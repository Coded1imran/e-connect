// REST API — all routes under /api. Also hosts the SSE change-stream at /api/events.

import crypto from 'node:crypto';
import { getDb, save, uid, publicUser, hashPassword, verifyPassword } from './db.mjs';
import { SUBSCRIPTION, PRICE_LABEL } from '../src/config.js';

const changeListeners = new Set();
export function broadcastChange() {
  for (const fn of changeListeners) fn();
}
function addChangeListener(fn) {
  changeListeners.add(fn);
}

function send(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function tokenFrom(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

function authUser(db, req) {
  const token = tokenFrom(req);
  if (!token) return null;
  const userId = db.tokens[token];
  return userId ? db.users.find((u) => u.id === userId) || null : null;
}

const UNAUTHORIZED = { error: 'Your session has expired. Please log in again.' };

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > 1e6) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function newToken(db, user) {
  const token = crypto.randomBytes(24).toString('hex');
  db.tokens[token] = user.id;
  return token;
}

export async function handleApi(req, res) {
  const db = getDb();
  const url = new URL(req.url, 'http://local');
  const path = url.pathname;
  const method = req.method;

  // ── Live change stream (SSE) ─────────────────────────────
  if (path === '/api/events' && method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write('retry: 2000\n\n');
    const keepalive = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        // ignore — close follows
      }
    }, 25000);
    const onChange = () => {
      try {
        res.write('data: changed\n\n');
      } catch {
        // ignore
      }
    };
    addChangeListener(onChange);
    req.on('close', () => {
      clearInterval(keepalive);
      changeListeners.delete(onChange);
    });
    return true;
  }

  // POST/PATCH need a parsed body
  let body = {};
  if (method === 'POST' || method === 'PATCH' || method === 'DELETE') {
    try {
      body = await readBody(req);
    } catch {
      send(res, 400, { error: 'Invalid request body.' });
      return true;
    }
  }

  // ── Auth ────────────────────────────────────────────────
  if (path === '/api/auth/register' && method === 'POST') {
    const { role, name, email, password, title, department, bio, courses, level } = body;
    const clean = String(email || '').toLowerCase().trim();
    if (!['STUDENT', 'LECTURER'].includes(role)) {
      return send(res, 400, { error: 'Choose a role: student or lecturer.' });
    }
    if (!String(name || '').trim()) return send(res, 400, { error: 'Please enter your full name.' });
    if (!/^\S+@\S+\.\S+$/.test(clean)) return send(res, 400, { error: 'Please enter a valid email address.' });
    if ((password || '').length < 6) return send(res, 400, { error: 'Password must be at least 6 characters.' });
    if (db.users.some((u) => u.email.toLowerCase() === clean)) {
      return send(res, 400, { error: 'An account with this email already exists.' });
    }
    if (role === 'LECTURER' && (!Array.isArray(courses) || courses.length === 0)) {
      return send(res, 400, { error: 'Please add at least one course you specialize in.' });
    }
    const user = {
      id: uid(),
      role,
      name: String(name).trim(),
      email: clean,
      ...hashPassword(password),
      rating: role === 'LECTURER' ? 0 : null,
      createdAt: new Date().toISOString(),
    };
    if (role === 'LECTURER') {
      user.title = title || 'Lecturer';
      user.department = department || '';
      user.bio = bio || '';
      user.courses = courses;
      user.verified = false;
      user.subscribedUntil = null;
      user.subscriptionHistory = [];
    } else {
      user.level = level || '';
    }
    db.users.push(user);
    const token = newToken(db, user);
    save();
    broadcastChange();
    return send(res, 201, { token, user: publicUser(user) });
  }

  if (path === '/api/auth/login' && method === 'POST') {
    const clean = String(body.email || '').toLowerCase().trim();
    const user = db.users.find((u) => u.email.toLowerCase() === clean);
    if (!user || !verifyPassword(body.password, user.salt, user.passwordHash)) {
      return send(res, 401, { error: 'Invalid email or password.' });
    }
    const token = newToken(db, user);
    save();
    return send(res, 200, { token, user: publicUser(user) });
  }

  if (path === '/api/auth/logout' && method === 'POST') {
    const token = tokenFrom(req);
    if (token) {
      delete db.tokens[token];
      save();
    }
    return send(res, 200, { ok: true });
  }

  if (path === '/api/me' && method === 'GET') {
    const user = authUser(db, req);
    if (!user) return send(res, 401, UNAUTHORIZED);
    return send(res, 200, { user: publicUser(user) });
  }

  if (path === '/api/me' && method === 'PATCH') {
    const user = authUser(db, req);
    if (!user) return send(res, 401, UNAUTHORIZED);
    const allowed = ['name', 'title', 'department', 'bio', 'courses', 'level'];
    for (const key of allowed) {
      if (key in body && body[key] !== undefined) user[key] = body[key];
    }
    if (Array.isArray(user.courses)) {
      user.courses = user.courses.filter((c) => typeof c === 'string' && c.trim());
      if (user.role === 'LECTURER' && user.courses.length === 0) {
        return send(res, 400, { error: 'Keep at least one course listed.' });
      }
    }
    save();
    broadcastChange();
    return send(res, 200, { user: publicUser(user) });
  }

  // ── Bootstrap (all public data, no auth needed to browse) ──
  if (path === '/api/bootstrap' && method === 'GET') {
    return send(res, 200, {
      users: db.users.map(publicUser),
      appointments: db.appointments,
      posts: db.posts,
      topics: db.topics,
    });
  }

  // ── Appointments ────────────────────────────────────────
  if (path === '/api/appointments' && method === 'POST') {
    const user = authUser(db, req);
    if (!user) return send(res, 401, UNAUTHORIZED);
    if (user.role !== 'STUDENT') {
      return send(res, 403, { error: 'Only student accounts can book appointments.' });
    }
    const { lecturerId, course, date, time, note } = body;
    const lecturer = db.users.find((u) => u.id === lecturerId && u.role === 'LECTURER');
    if (!lecturer) return send(res, 400, { error: 'That lecturer no longer exists.' });
    if (!course) return send(res, 400, { error: 'Please choose a course.' });
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return send(res, 400, { error: 'Please pick a valid date.' });
    }
    const apt = {
      id: uid(),
      studentId: user.id,
      lecturerId,
      course,
      date,
      time: /^\d{2}:\d{2}$/.test(time || '') ? time : '09:00',
      note: String(note || '').slice(0, 500).trim(),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    db.appointments.unshift(apt);
    save();
    broadcastChange();
    return send(res, 201, apt);
  }

  const mAptStatus = path.match(/^\/api\/appointments\/([\w-]+)\/status$/);
  if (mAptStatus && method === 'PATCH') {
    const user = authUser(db, req);
    if (!user) return send(res, 401, UNAUTHORIZED);
    const apt = db.appointments.find((a) => a.id === mAptStatus[1]);
    if (!apt) return send(res, 404, { error: 'Appointment not found.' });
    const isStudent = user.id === apt.studentId;
    const isLecturer = user.id === apt.lecturerId;
    if (isStudent && body.status === 'CANCELLED') {
      apt.status = 'CANCELLED';
    } else if (isLecturer && ['ACCEPTED', 'DECLINED', 'COMPLETED'].includes(body.status)) {
      apt.status = body.status;
    } else {
      return send(res, 403, { error: 'You are not allowed to change this appointment.' });
    }
    save();
    broadcastChange();
    return send(res, 200, apt);
  }

  // ── Lecturer posts ──────────────────────────────────────
  if (path === '/api/posts' && method === 'POST') {
    const user = authUser(db, req);
    if (!user) return send(res, 401, UNAUTHORIZED);
    if (user.role !== 'LECTURER') {
      return send(res, 403, { error: 'Only lecturer accounts can post.' });
    }
    const { type, title, body: postBody, link } = body;
    if (type !== 'ANNOUNCEMENT' && type !== 'MATERIAL') {
      return send(res, 400, { error: 'Pick a post type: announcement or material.' });
    }
    if (!String(title || '').trim()) return send(res, 400, { error: 'Please give your post a title.' });
    if (!String(postBody || '').trim()) return send(res, 400, { error: 'Please write something in the post body.' });
    if (link && !/^https?:\/\//i.test(link.trim())) {
      return send(res, 400, { error: 'Material link must start with http:// or https://' });
    }
    const post = {
      id: uid(),
      lecturerId: user.id,
      type,
      title: String(title).trim().slice(0, 140),
      body: String(postBody).trim().slice(0, 4000),
      link: link ? String(link).trim().slice(0, 500) : '',
      createdAt: new Date().toISOString(),
    };
    db.posts.unshift(post);
    save();
    broadcastChange();
    return send(res, 201, post);
  }

  const mPost = path.match(/^\/api\/posts\/([\w-]+)$/);
  if (mPost && method === 'DELETE') {
    const user = authUser(db, req);
    if (!user) return send(res, 401, UNAUTHORIZED);
    const post = db.posts.find((p) => p.id === mPost[1]);
    if (!post) return send(res, 404, { error: 'Post not found.' });
    if (post.lecturerId !== user.id) {
      return send(res, 403, { error: 'You can only delete your own posts.' });
    }
    db.posts = db.posts.filter((p) => p.id !== mPost[1]);
    save();
    broadcastChange();
    return send(res, 200, { ok: true });
  }

  // ── Subscription (Verified Lecturer Badge) ──────────────
  if (path === '/api/subscription' && method === 'POST') {
    const user = authUser(db, req);
    if (!user) return send(res, 401, UNAUTHORIZED);
    if (user.role !== 'LECTURER') {
      return send(res, 403, { error: 'Only lecturer accounts can subscribe.' });
    }
    const durDays = SUBSCRIPTION.durationDays || 30;
    const entry = {
      id: uid(),
      date: new Date().toISOString(),
      amount: `${SUBSCRIPTION.currency}${SUBSCRIPTION.amount}`,
      period: PRICE_LABEL,
      status: 'paid',
      method: 'placeholder',
    };
    user.verified = true;
    user.subscribedUntil = new Date(Date.now() + durDays * 864e5).toISOString();
    user.subscriptionHistory.push(entry);
    save();
    broadcastChange();
    return send(res, 200, { entry });
  }

  if (path === '/api/subscription' && method === 'DELETE') {
    const user = authUser(db, req);
    if (!user) return send(res, 401, UNAUTHORIZED);
    if (user.role !== 'LECTURER') {
      return send(res, 403, { error: 'Only lecturer accounts have subscriptions.' });
    }
    user.verified = false;
    user.subscribedUntil = null;
    save();
    broadcastChange();
    return send(res, 200, { ok: true });
  }

  // ── Forum topics & replies ──────────────────────────────
  if (path === '/api/topics' && method === 'POST') {
    const user = authUser(db, req);
    if (!user) return send(res, 401, UNAUTHORIZED);
    const { lecturerId, course, title, body: topicBody } = body;
    const lecturer = db.users.find((u) => u.id === lecturerId && u.role === 'LECTURER');
    if (!lecturer) return send(res, 400, { error: 'Lecturer room not found.' });
    if (!String(title || '').trim()) return send(res, 400, { error: 'Please add a title for your topic.' });
    if (!String(topicBody || '').trim()) return send(res, 400, { error: 'Please write your question or message.' });
    const topic = {
      id: uid(),
      lecturerId,
      authorId: user.id,
      course: course || 'General',
      title: String(title).trim().slice(0, 140),
      body: String(topicBody).trim().slice(0, 4000),
      replies: [],
      createdAt: new Date().toISOString(),
    };
    db.topics.unshift(topic);
    save();
    broadcastChange();
    return send(res, 201, topic);
  }

  const mReplies = path.match(/^\/api\/topics\/([\w-]+)\/replies$/);
  if (mReplies && method === 'POST') {
    const user = authUser(db, req);
    if (!user) return send(res, 401, UNAUTHORIZED);
    const topic = db.topics.find((t) => t.id === mReplies[1]);
    if (!topic) return send(res, 404, { error: 'Topic not found.' });
    if (!String(body.body || '').trim()) {
      return send(res, 400, { error: 'Reply cannot be empty.' });
    }
    const reply = {
      id: uid(),
      authorId: user.id,
      body: String(body.body).trim().slice(0, 4000),
      createdAt: new Date().toISOString(),
    };
    topic.replies.push(reply);
    save();
    broadcastChange();
    return send(res, 201, reply);
  }

  const mReply = path.match(/^\/api\/topics\/([\w-]+)\/replies\/([\w-]+)$/);
  if (mReply && method === 'DELETE') {
    const user = authUser(db, req);
    if (!user) return send(res, 401, UNAUTHORIZED);
    const topic = db.topics.find((t) => t.id === mReply[1]);
    if (!topic) return send(res, 404, { error: 'Topic not found.' });
    const reply = topic.replies.find((r) => r.id === mReply[2]);
    if (!reply) return send(res, 404, { error: 'Reply not found.' });
    if (reply.authorId !== user.id) {
      return send(res, 403, { error: 'You can only remove your own replies.' });
    }
    topic.replies = topic.replies.filter((r) => r.id !== mReply[2]);
    save();
    broadcastChange();
    return send(res, 200, { ok: true });
  }

  const mTopic = path.match(/^\/api\/topics\/([\w-]+)$/);
  if (mTopic && method === 'DELETE') {
    const user = authUser(db, req);
    if (!user) return send(res, 401, UNAUTHORIZED);
    const topic = db.topics.find((t) => t.id === mTopic[1]);
    if (!topic) return send(res, 404, { error: 'Topic not found.' });
    const isAuthor = topic.authorId === user.id;
    const isRoomOwner = topic.lecturerId === user.id;
    if (!isAuthor && !isRoomOwner) {
      return send(res, 403, { error: 'You can only delete your own topics (or topics in your own room).' });
    }
    db.topics = db.topics.filter((t) => t.id !== mTopic[1]);
    save();
    broadcastChange();
    return send(res, 200, { ok: true });
  }

  // Unknown API route
  send(res, 404, { error: 'Not found.' });
  return true;
}
