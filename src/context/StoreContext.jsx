import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, setToken, getToken, openEventStream } from '../lib/api';
import { isUpcoming, uid } from '../utils/helpers';
import { SUBSCRIPTION, PRICE_LABEL } from '../config';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [data, setData] = useState({ users: [], appointments: [], posts: [], topics: [] });
  const [sessionId, setSessionId] = useState(null);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState(null);

  function notify(message, type = 'success') {
    setToast({ message, type, key: uid() });
  }

  async function refreshAll() {
    const d = await api.get('/api/bootstrap');
    setData(d);
  }

  // ── Boot: restore session, load data, subscribe to live changes ──
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (getToken()) {
          const me = await api.get('/api/me');
          if (alive) setSessionId(me.user.id);
        }
        await refreshAll();
      } catch {
        setToken(null); // bad/expired token — start clean
      } finally {
        if (alive) setReady(true);
      }
    })();

    const closeStream = openEventStream(() => {
      refreshAll().catch(() => {});
    });
    // Safety net if SSE gets blocked somewhere
    const interval = setInterval(() => refreshAll().catch(() => {}), 20000);

    return () => {
      alive = false;
      closeStream();
      clearInterval(interval);
    };
  }, []);

  // ── Derived (live) ─────────────────────────────────────
  const users = data.users || [];
  const appointments = data.appointments || [];
  const posts = data.posts || [];
  const topics = data.topics || [];
  const lecturers = users.filter((u) => u.role === 'LECTURER');
  const students = users.filter((u) => u.role === 'STUDENT');
  const sessionUser = useMemo(
    () => users.find((u) => u.id === sessionId) || null,
    [users, sessionId]
  );

  // ── Auth ───────────────────────────────────────────────
  async function login(email, password) {
    const res = await api.post('/api/auth/login', { email, password });
    setToken(res.token);
    setSessionId(res.user.id);
    await refreshAll();
    return res.user;
  }

  async function register(payload) {
    // Client-side fast checks mirror the server for snappy feedback
    if (!payload.name || !payload.name.trim()) throw new Error('Please enter your full name.');
    if ((payload.password || '').length < 6) throw new Error('Password must be at least 6 characters.');
    if (payload.role === 'LECTURER' && (!payload.courses || payload.courses.length === 0)) {
      throw new Error('Please add at least one course you specialize in.');
    }
    const res = await api.post('/api/auth/register', payload);
    setToken(res.token);
    setSessionId(res.user.id);
    await refreshAll();
    return res.user;
  }

  async function logout() {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // logging out locally regardless
    }
    setToken(null);
    setSessionId(null);
  }

  // ── User/profile ───────────────────────────────────────
  async function updateUser(userId, fields) {
    await api.patch('/api/me', fields); // server only allows editing your own account
    await refreshAll();
  }

  // Placeholder payment — a real gateway can be plugged in later.
  async function subscribeLecturer(lecturerId) {
    const res = await api.post('/api/subscription');
    await refreshAll();
    return res.entry;
  }

  async function cancelSubscription(lecturerId) {
    await api.delete('/api/subscription');
    await refreshAll();
  }

  // ── Appointments ───────────────────────────────────────
  async function bookAppointment({ studentId, lecturerId, course, date, time, note }) {
    if (!studentId) throw new Error('Please log in as a student to book.');
    if (!course) throw new Error('Please choose a course.');
    if (!date) throw new Error('Please pick a date.');
    const apt = await api.post('/api/appointments', { lecturerId, course, date, time, note });
    await refreshAll();
    return apt;
  }

  async function setAppointmentStatus(aptId, status) {
    await api.patch(`/api/appointments/${aptId}/status`, { status });
    await refreshAll();
  }

  async function cancelAppointmentAsStudent(aptId) {
    return setAppointmentStatus(aptId, 'CANCELLED');
  }

  // ── Posts ──────────────────────────────────────────────
  async function addPost({ lecturerId, type, title, body, link }) {
    if (!title.trim()) throw new Error('Please give your post a title.');
    if (!body.trim()) throw new Error('Please write something in the post body.');
    if (type === 'MATERIAL' && link && !/^https?:\/\//i.test(link.trim())) {
      throw new Error('Material link must start with http:// or https://');
    }
    await api.post('/api/posts', { type, title, body, link });
    await refreshAll();
  }

  async function deletePost(postId) {
    await api.delete(`/api/posts/${postId}`);
    await refreshAll();
  }

  // ── Forum ──────────────────────────────────────────────
  async function addTopic({ lecturerId, authorId, course, title, body }) {
    if (!title.trim()) throw new Error('Please add a title for your topic.');
    if (!body.trim()) throw new Error('Please write your question or message.');
    await api.post('/api/topics', { lecturerId, course, title, body });
    await refreshAll();
  }

  async function addReply(topicId, authorId, body) {
    if (!body.trim()) throw new Error('Reply cannot be empty.');
    await api.post(`/api/topics/${topicId}/replies`, { body });
    await refreshAll();
  }

  async function deleteTopic(topicId) {
    await api.delete(`/api/topics/${topicId}`);
    await refreshAll();
  }

  async function deleteReply(topicId, replyId) {
    await api.delete(`/api/topics/${topicId}/replies/${replyId}`);
    await refreshAll();
  }

  // ── Selectors (same API as before) ─────────────────────
  function userById(id) {
    return users.find((u) => u.id === id) || null;
  }
  function postsByLecturer(lecturerId) {
    return posts.filter((p) => p.lecturerId === lecturerId);
  }
  function appointmentsForStudent(studentId) {
    return appointments.filter((a) => a.studentId === studentId);
  }
  function appointmentsForLecturer(lecturerId) {
    return appointments.filter((a) => a.lecturerId === lecturerId);
  }
  function topicsForLecturer(lecturerId) {
    return topics.filter((t) => t.lecturerId === lecturerId);
  }
  function activeAppointments(list) {
    return list.filter(
      (a) => (a.status === 'ACCEPTED' || a.status === 'PENDING') && isUpcoming(a.date, a.time)
    );
  }
  function isSubscriptionActive(user) {
    if (!user || !user.verified) return false;
    if (!user.subscribedUntil) return true;
    return new Date(user.subscribedUntil).getTime() > Date.now();
  }

  const value = {
    users,
    lecturers,
    students,
    appointments,
    posts,
    topics,
    sessionUser,
    ready,
    resetAndRefresh: refreshAll,
    toast,
    notify,
    setToast,
    login,
    register,
    logout,
    updateUser,
    subscribeLecturer,
    cancelSubscription,
    bookAppointment,
    setAppointmentStatus,
    cancelAppointmentAsStudent,
    addPost,
    deletePost,
    addTopic,
    addReply,
    deleteTopic,
    deleteReply,
    topicsForLecturer,
    userById,
    postsByLecturer,
    appointmentsForStudent,
    appointmentsForLecturer,
    activeAppointments,
    isSubscriptionActive,
  };

  // expose subscription constants for dashboard panels
  value.subscriptionInfo = { ...SUBSCRIPTION, priceLabel: PRICE_LABEL };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}
