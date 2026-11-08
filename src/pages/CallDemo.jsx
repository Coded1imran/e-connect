import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { useCall } from '../components/CallCenter';
import { DEMO_ACCOUNTS } from '../config';

export default function CallDemo() {
  const { sessionUser, login, notify, lecturers, students } = useStore();
  const { startPracticeCall, active, online } = useCall();
  const [busy, setBusy] = useState(false);

  const inCall = !!active && active.status !== 'ended';

  async function switchAccount(role) {
    const acc =
      role === 'LECTURER' ? DEMO_ACCOUNTS.lecturer : DEMO_ACCOUNTS.student;
    try {
      const user = await login(acc.email, acc.password);
      notify(`Now viewing as ${user.name} (${role.toLowerCase()}).`);
    } catch (err) {
      notify(err.message, 'error');
    }
  }

  async function preview(mode) {
    setBusy(true);
    try {
      await startPracticeCall(mode);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container main-pad">
      <h1 className="page-title">Call demo playground</h1>
      <p className="page-sub">
        Try the voice and video call experience without waiting for another person.
      </p>

      <div className="grid cards-2">
        {/* ── Solo preview ── */}
        <section className="card">
          <h2 className="card__title">Solo preview (one click)</h2>
          <p className="muted" style={{ fontSize: 14 }}>
            Opens the exact call screen you would see in a real call. Your own camera plays the
            part of the "other person" (labeled <strong>Practice peer</strong>) so nothing needs a
            second user. Mute, camera and end-call controls all work.
          </p>
          {!sessionUser && (
            <p className="muted" style={{ fontSize: 14 }}>
              Log in first — use the demo account buttons below.
            </p>
          )}
          <div className="demo-actions">
            <button className="btn btn--primary" disabled={inCall || busy} onClick={() => preview('video')}>
              Start video preview
            </button>
            <button className="btn btn--outline" disabled={inCall || busy} onClick={() => preview('audio')}>
              Start voice-only preview
            </button>
          </div>
          {inCall && (
            <p className="muted" style={{ fontSize: 13 }}>
              A preview call is running in the overlay — use <strong>End call</strong> there, then
              come back here.
            </p>
          )}
        </section>

        {/* ── Real two-user call ── */}
        <section className="card">
          <h2 className="card__title">Real call with two users</h2>
          <ol className="demo-steps">
            <li>Log in as one demo user in this window (buttons below).</li>
            <li>
              Open a second browser window in <strong>Incognito or another profile</strong> — that
              window gets a separate login, which is needed because logins are shared per browser.
            </li>
            <li>Log in as the other demo user there.</li>
            <li>
              From a forum room, a lecturer profile, or a dashboard, press <strong>Video call</strong> or{' '}
              <strong>Voice call</strong>, and press <strong>Accept</strong> when the other window rings.
            </li>
          </ol>
          <button
            className="btn btn--ghost"
            onClick={() => window.open(window.location.href, '_blank', 'noopener')}
          >
            Open this page in a second window
          </button>
        </section>
      </div>

      {/* ── Account switcher ── */}
      <section className="card demo-accounts">
        <h2 className="card__title">Demo accounts</h2>
        <p className="demo-user">
          You are currently viewing as:{' '}
          {sessionUser ? (
            <>
              <strong>{sessionUser.name}</strong>{' '}
              <span className={`pill ${sessionUser.role === 'LECTURER' ? 'pill--blue' : 'pill--grey'}`}>
                {sessionUser.role}
              </span>
            </>
          ) : (
            <span className="muted">Guest (not logged in)</span>
          )}
        </p>
        <div className="demo-actions">
          <button
            className="btn btn--outline btn--sm"
            onClick={() => switchAccount('STUDENT')}
            disabled={inCall}
          >
            Use student demo account
          </button>
          <button
            className="btn btn--outline btn--sm"
            onClick={() => switchAccount('LECTURER')}
            disabled={inCall}
          >
            Use lecturer demo account
          </button>
        </div>
      </section>

      <p className="muted" style={{ fontSize: 13 }}>
        Online friends right now: {online.length}. You can also call any of them via the{' '}
        <Link to="/forum">forum rooms</Link>.
      </p>
    </main>
  );
}
