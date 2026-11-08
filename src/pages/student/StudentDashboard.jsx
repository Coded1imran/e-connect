import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import BrowseLecturers from '../../components/BrowseLecturers';
import Avatar from '../../components/Avatar';
import EmptyState from '../../components/EmptyState';
import { formatDate, formatDateTime } from '../../utils/helpers';
import CallButtons from '../../components/CallButtons';

const TABS = ['Overview', 'Find Lecturers', 'My Appointments'];

const STATUS_STYLES = {
  PENDING: 'pill pill--amber',
  ACCEPTED: 'pill pill--green',
  COMPLETED: 'pill pill--blue',
  DECLINED: 'pill pill--red',
  CANCELLED: 'pill pill--grey',
};

function AppointmentRow({ apt, onCancel }) {
  const { userById } = useStore();
  const lecturer = userById(apt.lecturerId);
  const canCancel = apt.status === 'PENDING' || apt.status === 'ACCEPTED';

  return (
    <div className="apt">
      <div className="apt__main">
        <Avatar name={lecturer?.name} size="md" verified={lecturer?.verified} />
        <div>
          <strong className="apt__who">{lecturer?.name || 'Lecturer'}</strong>
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
          {apt.status === 'ACCEPTED' && (
            <span className="pill pill--green">Confirmed — meet them</span>
          )}
          {canCancel && (
            <button className="btn btn--danger btn--sm" onClick={() => onCancel(apt)}>
              Cancel
            </button>
          )}
          <CallButtons peer={lecturer ? { id: lecturer.id, name: lecturer.name, role: lecturer.role } : null} />
          <Link className="btn btn--ghost btn--sm" to={`/lecturers/${apt.lecturerId}`}>
            Profile
          </Link>
        </div>
      </div>
      <span className="apt__created" title={apt.createdAt}>
        Requested {formatDateTime(apt.createdAt)}
      </span>
    </div>
  );
}

export default function StudentDashboard() {
  const { sessionUser, appointmentsForStudent, cancelAppointmentAsStudent, notify } = useStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState('Overview');

  const mine = appointmentsForStudent(sessionUser.id);
  const active = mine.filter((a) => a.status === 'PENDING' || a.status === 'ACCEPTED');
  const upcoming = active.filter((a) => new Date(`${a.date}T${a.time}`) > new Date());
  const completed = mine.filter((a) => a.status === 'COMPLETED');
  const contacted = new Set(mine.map((a) => a.lecturerId)).size;

  async function cancel(apt) {
    if (!window.confirm(`Cancel your appointment with ${apt.course}?`)) return;
    try {
      await cancelAppointmentAsStudent(apt.id);
      notify('Appointment cancelled.', 'info');
    } catch (err) {
      notify(err.message, 'error');
    }
  }

  return (
    <main className="container main-pad">
      <div className="dash__head">
        <div>
          <h1 className="page-title">Hi, {sessionUser.name.split(' ')[0]}</h1>
          <p className="page-sub">
            {sessionUser.level ? `${sessionUser.level} · ` : ''}Your student dashboard.
          </p>
        </div>
        <Link to="/lecturers" className="btn btn--accent">
          + Book a new appointment
        </Link>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t}
            className={tab === t ? 'tab tab--active' : 'tab'}
            onClick={() => setTab(t)}
          >
            {t}
            {t === 'My Appointments' && active.length > 0 && (
              <span className="tab__badge">{active.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'Overview' && (
        <>
          <div className="grid cards-3 stats">
            <div className="card stat">
              <span className="stat__num">{upcoming.length}</span>
              <span className="stat__label">Upcoming appointments</span>
            </div>
            <div className="card stat">
              <span className="stat__num">{completed.length}</span>
              <span className="stat__label">Completed sessions</span>
            </div>
            <div className="card stat">
              <span className="stat__num">{contacted}</span>
              <span className="stat__label">Lecturers contacted</span>
            </div>
          </div>

          <div className="grid cards-2">
            <div className="card">
              <h3 className="card__title">Next up</h3>
              {upcoming.length === 0 ? (
                <EmptyState
                  title="No upcoming appointments"
                  hint="Find a lecturer that matches your course and book a session."
                />
              ) : (
                <>
                  <AppointmentRow apt={upcoming[0]} onCancel={cancel} />
                  {active.length > 1 && (
                    <button className="btn btn--ghost btn--sm" onClick={() => setTab('My Appointments')}>
                      See all {active.length} →
                    </button>
                  )}
                </>
              )}
            </div>
            <div className="card">
              <h3 className="card__title">Quick actions</h3>
              <div className="quick-actions">
                <button className="qbtn" onClick={() => setTab('Find Lecturers')}>
                  Find a lecturer by course
                </button>
                <button className="qbtn" onClick={() => navigate('/lecturers')}>
                  Browse all lecturers
                </button>
                <button className="qbtn" onClick={() => setTab('My Appointments')}>
                  Review my requests
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Find lecturers ── */}
      {tab === 'Find Lecturers' && <BrowseLecturers />}

      {/* ── My appointments ── */}
      {tab === 'My Appointments' && (
        <div className="card">
          <h3 className="card__title">Appointment history</h3>
          {mine.length === 0 ? (
            <EmptyState
              title="No appointments yet"
              hint="Head to 'Find Lecturers' to make your first booking."
            />
          ) : (
            <div className="apt-list">
              {mine.map((a) => (
                <AppointmentRow key={a.id} apt={a} onCancel={cancel} />
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
