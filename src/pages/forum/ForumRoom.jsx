import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import CallButtons from '../../components/CallButtons';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import NotFound from '../NotFound';
import { formatDateTime } from '../../utils/helpers';

function authorLabel(authorId, userById) {
  const u = userById(authorId);
  return u
    ? { name: u.name, role: u.role }
    : { name: 'Deleted user', role: '' };
}

function TopicCard({ topic }) {
  const { userById, addReply, deleteReply, deleteTopic, sessionUser, notify } = useStore();
  const [text, setText] = useState('');
  const author = topic.authorId === sessionUser?.id ? sessionUser : userById(topic.authorId);
  const lecturer = userById(topic.lecturerId);
  const authorRole = author?.role || 'STUDENT';
  const canModerate = sessionUser && (sessionUser.id === topic.authorId || sessionUser.id === topic.lecturerId);

  async function submit(e) {
    e.preventDefault();
    try {
      await addReply(topic.id, sessionUser.id, text);
      setText('');
      notify('Reply posted.');
    } catch (err) {
      notify(err.message, 'error');
    }
  }

  return (
    <article className="card topic">
      <div className="topic-meta">
        <span className={`pill ${authorRole === 'LECTURER' ? 'pill--blue' : 'pill--grey'}`}>
          {authorRole}
        </span>
        <span>{topic.course}</span>
        <span>·</span>
        <span>{formatDateTime(topic.createdAt)}</span>
        {canModerate && (
          <button
            className="btn btn--ghost btn--sm topic__delete"
            onClick={async () => {
              if (window.confirm('Delete this topic and all its replies?')) {
                try {
                  await deleteTopic(topic.id);
                  notify('Topic deleted.', 'info');
                } catch (err) {
                  notify(err.message, 'error');
                }
              }
            }}
          >
            Delete
          </button>
        )}
      </div>

      <div className="topic-body">
        <strong>{topic.title}</strong>
        <p className="topic-body__text">{topic.body}</p>
      </div>

      <div className="replies">
        <h4 className="replies__count">
          {(topic.replies || []).length} {(topic.replies || []).length === 1 ? 'Reply' : 'Replies'}
        </h4>
        {(topic.replies || []).map((r) => {
          const ra = authorLabel(r.authorId, userById);
          const isSelfR = sessionUser && r.authorId === sessionUser.id;
          return (
            <div key={r.id} className="reply">
              <div className="reply-head">
                <span className="reply-author">{ra.name}</span>
                {ra.role === 'LECTURER' && <span className="pill pill--blue">Lecturer</span>}
                {ra.role === 'STUDENT' && <span className="pill pill--grey">Student</span>}
                <span className="reply-time">{formatDateTime(r.createdAt)}</span>
                {isSelfR && (
                  <button
                    className="btn btn--ghost btn--sm reply__delete"
                    onClick={async () => {
                      try {
                        await deleteReply(topic.id, r.id);
                        notify('Reply removed.', 'info');
                      } catch (err) {
                        notify(err.message, 'error');
                      }
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="reply-body">{r.body}</p>
            </div>
          );
        })}
      </div>

      {sessionUser ? (
        <form className="reply-form" onSubmit={submit}>
          <textarea
            className="field__input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              sessionUser.role === 'LECTURER'
                ? 'Reply to this student as the lecturer…'
                : 'Write a reply or a follow-up question…'
            }
          />
          <button className="btn btn--primary btn--sm" type="submit">
            Reply
          </button>
        </form>
      ) : (
        <p className="muted" style={{ fontSize: 13.5 }}>
          <Link to="/login">Log in</Link> to post a reply.
        </p>
      )}
    </article>
  );
}

export default function ForumRoom() {
  const { id } = useParams();
  const { lecturers, topicsForLecturer, addTopic, sessionUser, notify, isSubscriptionActive } =
    useStore();

  const lecturer = lecturers.find((l) => l.id === id);

  // New topic form state — always declared, above any early return
  const [title, setTitle] = useState('');
  const [course, setCourse] = useState(lecturer.courses?.[0] || 'General');
  const [body, setBody] = useState('');
  const [err, setErr] = useState('');

  const topics = lecturer ? topicsForLecturer(lecturer.id) : [];

  if (!lecturer) return <NotFound />;

  async function submitTopic(e) {
    e.preventDefault();
    setErr('');
    try {
      await addTopic({
        lecturerId: lecturer.id,
        authorId: sessionUser.id,
        course,
        title,
        body,
      });
      setTitle('');
      setBody('');
      notify('Topic posted.');
    } catch (error) {
      setErr(error.message);
    }
  }

  return (
    <main className="container main-pad">
      <Link to="/forum" className="backlink">
        ← All forum rooms
      </Link>

      <section className="card room-hero">
        <div className="room-head">
          <Avatar name={lecturer.name} size="xl" verified={isSubscriptionActive(lecturer)} />
          <div>
            <h1 className="room-name room-name--lg">
              {lecturer.name}'s Room {isSubscriptionActive(lecturer) && <VerifiedBadge />}
            </h1>
            <p className="room-sub">
              {lecturer.title} · {lecturer.department}
            </p>
          </div>
          <div className="room-hero__cta">
            <CallButtons peer={{ id: lecturer.id, name: lecturer.name, role: 'LECTURER' }} />
          </div>
        </div>
        <div className="lcard__courses">
          {(lecturer.courses || []).map((c) => (
            <span key={c} className="chip">
              {c}
            </span>
          ))}
        </div>
      </section>

      {sessionUser ? (
        <section className="card topic-form-card">
          <h2 className="card__title">Start a new topic</h2>
          <form className="form" onSubmit={submitTopic}>
            <div className="field-row">
              <div className="field">
                <label className="field__label">Title</label>
                <input
                  className="field__input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. How would you approach past question 3?"
                />
              </div>
              <div className="field">
                <label className="field__label">Course (optional)</label>
                <select
                  className="field__input"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                >
                  <option value="General">General</option>
                  {(lecturer.courses || []).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field">
              <label className="field__label">Message</label>
              <textarea
                className="field__input"
                rows={3}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your question or topic for the room…"
              />
            </div>
            {err && <p className="form__error">{err}</p>}
            <button className="btn btn--primary" type="submit">
              Post topic
            </button>
          </form>
        </section>
      ) : (
        <section className="card">
          <p className="muted" style={{ margin: 0 }}>
            <Link to="/login">Log in</Link> or <Link to="/register">create an account</Link> to post
            topics and replies in this room.
          </p>
        </section>
      )}

      <h2 className="section__title section__title--left">Room topics ({topics.length})</h2>
      {topics.length === 0 ? (
        <EmptyState
          title="No topics yet"
          hint="Be the first to start a discussion in this room."
        />
      ) : (
        <div className="topics-list">
          {topics.map((t) => (
            <TopicCard key={t.id} topic={t} />
          ))}
        </div>
      )}
    </main>
  );
}
