import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { SUBSCRIPTION, PRICE_LABEL } from '../../config';
import VerifiedBadge from '../../components/VerifiedBadge';
import ChipInput from '../../components/ChipInput';
import PostCard from '../../components/PostCard';
import EmptyState from '../../components/EmptyState';
import { COURSE_CATALOG } from '../../data/seed';
import { formatDate, formatDateTime, initials } from '../../utils/helpers';
import CallButtons from '../../components/CallButtons';

const TABS = ['Overview', 'Requests', 'My Courses', 'Posts', 'Verified Badge'];

const STATUS_STYLES = {
  PENDING: 'pill pill--amber',
  ACCEPTED: 'pill pill--green',
  COMPLETED: 'pill pill--blue',
  DECLINED: 'pill pill--red',
  CANCELLED: 'pill pill--grey',
};

function RequestRow({ apt, onStatus }) {
  const { userById } = useStore();
  const student = userById(apt.studentId);
  const pending = apt.status === 'PENDING';

  return (
    <div className="apt">
      <div className="apt__main">
        <span className="avatar avatar--md">{initials(student?.name)}</span>
        <div>
          <strong className="apt__who">{student?.name || 'Student'}</strong>
          <span className={`pill ${STATUS_STYLES[apt.status]}`}>{apt.status}</span>
          <p className="apt__course">{apt.course}</p>
          {apt.note && <p className="apt__note">“{apt.note}”</p>}
        </div>
      </div>
      <div className="apt__side">
        <span className="apt__when">
          {formatDate(apt.date)} · {apt.time}
        </span>
        <div className="apt__actions">
          {pending && (
            <>
              <button className="btn btn--primary btn--sm" onClick={() => onStatus(apt, 'ACCEPTED')}>
                Accept
              </button>
              <button className="btn btn--danger btn--sm" onClick={() => onStatus(apt, 'DECLINED')}>
                Decline
              </button>
            </>
          )}
          {apt.status === 'ACCEPTED' && (
            <button className="btn btn--outline btn--sm" onClick={() => onStatus(apt, 'COMPLETED')}>
              Mark completed
            </button>
          )}
          <CallButtons peer={student ? { id: student.id, name: student.name, role: student.role } : null} />
        </div>
      </div>
    </div>
  );
}

export default function LecturerDashboard() {
  const store = useStore();
  const {
    sessionUser,
    updateUser,
    appointmentsForLecturer,
    postsByLecturer,
    addPost,
    deletePost,
    setAppointmentStatus,
    subscribeLecturer,
    cancelSubscription,
    isSubscriptionActive,
    notify,
  } = store;

  const [tab, setTab] = useState('Overview');
  const mine = appointmentsForLecturer(sessionUser.id);
  const posts = postsByLecturer(sessionUser.id);
  const verified = isSubscriptionActive(sessionUser);

  // Post form state
  const [type, setType] = useState('ANNOUNCEMENT');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [postErr, setPostErr] = useState('');

  // Courses state
  const [courses, setCourses] = useState(sessionUser.courses || []);

  async function handleSubscribe() {
    if (
      !window.confirm(
        `Subscribe to the Verified Lecturer Badge for ${PRICE_LABEL}? (Demo checkout — no real payment)`
      )
    ) {
      return;
    }
    try {
      await new Promise((r) => setTimeout(r, 900)); // simulated gateway delay
      await subscribeLecturer(sessionUser.id);
      notify('Payment successful! Your Verified badge is now active.');
    } catch (err) {
      notify(err.message, 'error');
    }
  }

  async function handleCancelSub() {
    if (!window.confirm('Cancel your subscription? Your verified badge will be removed.')) return;
    try {
      await cancelSubscription(sessionUser.id);
      notify('Subscription cancelled.', 'info');
    } catch (err) {
      notify(err.message, 'error');
    }
  }

  async function saveCourses() {
    if (courses.length === 0) {
      notify('Keep at least one course listed.', 'error');
      return;
    }
    try {
      await updateUser(sessionUser.id, { courses });
      notify('Courses updated.');
    } catch (err) {
      notify(err.message, 'error');
    }
  }

  async function doStatus(apt, s) {
    try {
      await setAppointmentStatus(apt.id, s);
      notify(`Request ${s.toLowerCase()}.`);
    } catch (err) {
      notify(err.message, 'error');
    }
  }

  async function submitPost(e) {
    e.preventDefault();
    setPostErr('');
    try {
      await addPost({ lecturerId: sessionUser.id, type, title, body, link });
      setTitle('');
      setBody('');
      setLink('');
      notify(type === 'ANNOUNCEMENT' ? 'Announcement posted.' : 'Material posted.');
    } catch (err) {
      setPostErr(err.message);
    }
  }

  const pendingCount = mine.filter((a) => a.status === 'PENDING').length;

  return (
    <main className="container main-pad">
      <div className="dash__head">
        <div>
          <h1 className="page-title">
            {sessionUser.name.split(' ')[0]}'s Dashboard {verified && <VerifiedBadge />}
          </h1>
          <p className="page-sub">
            {sessionUser.title} · {sessionUser.department}
          </p>
        </div>
        <Link to={`/lecturers/${sessionUser.id}`} className="btn btn--outline">
          View public profile ↗
        </Link>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t} className={tab === t ? 'tab tab--active' : 'tab'} onClick={() => setTab(t)}>
            {t}
            {t === 'Requests' && pendingCount > 0 && <span className="tab__badge">{pendingCount}</span>}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'Overview' && (
        <>
          <div className="grid cards-4 stats">
            <div className="card stat">
              <span className="stat__num">{pendingCount}</span>
              <span className="stat__label">Pending requests</span>
            </div>
            <div className="card stat">
              <span className="stat__num">
                {mine.filter((a) => a.status === 'ACCEPTED').length}
              </span>
              <span className="stat__label">Upcoming sessions</span>
            </div>
            <div className="card stat">
              <span className="stat__num">{courses.length}</span>
              <span className="stat__label">Courses listed</span>
            </div>
            <div className="card stat">
              <span className="stat__num">{verified ? 'Active' : 'Off'}</span>
              <span className="stat__label">Verified badge</span>
            </div>
          </div>

          <div className="grid cards-2">
            <div className="card">
              <h3 className="card__title">Latest requests</h3>
              {pendingCount === 0 ? (
                <EmptyState title="No pending requests" hint="New bookings from students will appear here." />
              ) : (
                <div className="apt-list">
                  {mine
                    .filter((a) => a.status === 'PENDING')
                    .slice(0, 3)
                    .map((a) => (
                      <RequestRow key={a.id} apt={a} onStatus={(apt, s) => doStatus(apt, s)} />
                    ))}
                </div>
              )}
              {pendingCount > 3 && (
                <button className="btn btn--ghost btn--sm" onClick={() => setTab('Requests')}>
                  See all requests →
                </button>
              )}
            </div>
            <div className="card">
              <h3 className="card__title">Your status</h3>
              <p>
                <strong>{verified ? 'Verified Lecturer' : 'Not verified'}</strong>
              </p>
              {verified && sessionUser.subscribedUntil && (
                <p className="muted">Badge active until {formatDate(sessionUser.subscribedUntil.slice(0, 10))}</p>
              )}
              <p className="muted">
                {verified
                  ? 'Students trust verified lecturers more — keep it active to stay distinguished.'
                  : 'Get the Verified badge to build trust with students and rank higher in searches.'}
              </p>
              <button
                className={verified ? 'btn btn--outline btn--sm' : 'btn btn--accent btn--sm'}
                onClick={() => setTab('Verified Badge')}
              >
                {verified ? 'Manage subscription' : `Get verified — ${PRICE_LABEL}`}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Requests ── */}
      {tab === 'Requests' && (
        <div className="card">
          <h3 className="card__title">Student appointment requests</h3>
          {mine.length === 0 ? (
            <EmptyState title="No requests yet" hint="Students will find you through your course list and profile." />
          ) : (
            <div className="apt-list">
              {mine.map((a) => (
                <RequestRow
                  key={a.id}
                  apt={a}
                  onStatus={(apt, s) => doStatus(apt, s)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── My Courses ── */}
      {tab === 'My Courses' && (
        <div className="card">
          <h3 className="card__title">Courses I specialize in</h3>
          <p className="muted">These are the courses students can book you for.</p>
          <ChipInput
            label="Your courses"
            chips={courses}
            onChange={setCourses}
            placeholder="Type a course and press Enter…"
            suggestions={COURSE_CATALOG}
          />
          <button className="btn btn--primary" onClick={saveCourses}>
            Save changes
          </button>
        </div>
      )}

      {/* ── Posts ── */}
      {tab === 'Posts' && (
        <>
          <div className="card">
            <h3 className="card__title">Create a post</h3>
            <form className="form" onSubmit={submitPost}>
              <div className="post-types">
                <button
                  type="button"
                  className={type === 'ANNOUNCEMENT' ? 'ptype ptype--active' : 'ptype'}
                  onClick={() => setType('ANNOUNCEMENT')}
                >
                  Announcement
                </button>
                <button
                  type="button"
                  className={type === 'MATERIAL' ? 'ptype ptype--active' : 'ptype'}
                  onClick={() => setType('MATERIAL')}
                >
                  Study material
                </button>
              </div>
              <div className="field">
                <label className="field__label">Title</label>
                <input
                  className="field__input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    type === 'ANNOUNCEMENT'
                      ? 'e.g. Revision clinic this Friday'
                      : 'e.g. Organic chemistry cheat sheet'
                  }
                />
              </div>
              <div className="field">
                <label className="field__label">Message</label>
                <textarea
                  className="field__input"
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your message to students…"
                />
              </div>
              {type === 'MATERIAL' && (
                <div className="field">
                  <label className="field__label">Material link (optional)</label>
                  <input
                    className="field__input"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://… link to a PDF, slide deck or doc"
                  />
                </div>
              )}
              {postErr && <p className="form__error">{postErr}</p>}
              <button className="btn btn--primary" type="submit">
                Publish {type === 'ANNOUNCEMENT' ? 'announcement' : 'material'}
              </button>
            </form>
          </div>

          <div className="card">
            <h3 className="card__title">Your published posts ({posts.length})</h3>
            {posts.length === 0 ? (
              <EmptyState title="You haven't posted yet" hint="Publish your first announcement or material above." />
            ) : (
              <div className="posts-list">
                {posts.map((p) => (
                  <PostCard key={p.id} post={p} onDelete={async () => {
                    if (window.confirm('Delete this post?')) {
                      try {
                        await deletePost(p.id);
                        notify('Post deleted.', 'info');
                      } catch (err) {
                        notify(err.message, 'error');
                      }
                    }
                  }} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Verified Badge ── */}
      {tab === 'Verified Badge' && (
        <>
          <div className={`card vsub ${verified ? 'vsub--active' : ''}`}>
            <div className="vsub__row">
              <div>
                <h3 className="card__title">
                  {SUBSCRIPTION.name} {verified && <VerifiedBadge small />}
                </h3>
                <p className="muted">
                  {verified
                    ? sessionUser.subscribedUntil
                      ? `Active until ${formatDate(sessionUser.subscribedUntil.slice(0, 10))}`
                      : 'Active'
                    : `Status: not verified`}
                </p>
              </div>
              <div className="vsub__price">
                <span className="vsub__amount">
                  {SUBSCRIPTION.currency}
                  {SUBSCRIPTION.amount}
                </span>
                <span className="vsub__period">per {SUBSCRIPTION.period}</span>
              </div>
            </div>

            <div className="vsub__benefits">
              <h4>What you get:</h4>
              <ul>
                <li>✓ A <strong>Verified</strong> check badge next to your name everywhere on E-Connect</li>
                <li>✓ Higher ranking and a "verified" highlight in student searches</li>
                <li>✓ The trusted badge boosts student confidence to book you</li>
                <li>✓ Mark of authenticity on your announcements and materials</li>
              </ul>
            </div>

            {verified ? (
              <div className="vsub__actions">
                <button className="btn btn--primary" onClick={handleSubscribe}>
                  Renew / extend ({PRICE_LABEL})
                </button>
                <button className="btn btn--danger" onClick={handleCancelSub}>
                  Cancel subscription
                </button>
              </div>
            ) : (
              <div className="vsub__actions">
                <button className="btn btn--accent btn--lg" onClick={handleSubscribe}>
                  Subscribe — {PRICE_LABEL}
                </button>
                <span className="cta__note">Secure demo checkout · Cancel anytime</span>
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="card__title">Subscription history</h3>
            {(sessionUser.subscriptionHistory || []).length === 0 ? (
              <EmptyState title="No payments yet" />
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[...sessionUser.subscriptionHistory].reverse().map((h) => (
                    <tr key={h.id}>
                      <td>{formatDateTime(h.date)}</td>
                      <td>{h.amount}</td>
                      <td className="muted">{h.method === 'placeholder' ? 'Demo checkout' : h.method}</td>
                      <td>
                        <span className="pill pill--green">{h.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </main>
  );
}
