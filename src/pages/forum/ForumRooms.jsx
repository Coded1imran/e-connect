import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { useCall } from '../../components/CallCenter';
import CallButtons from '../../components/CallButtons';
import Avatar from '../../components/Avatar';
import VerifiedBadge from '../../components/VerifiedBadge';

// Landing list of all lecturer forum rooms
export default function ForumRooms() {
  const { lecturers, topics, isSubscriptionActive } = useStore();
  const { online } = useCall();

  return (
    <main className="container main-pad">
      <h1 className="page-title">Forum</h1>
      <p className="page-sub">
        Open a lecturer's room to ask questions and reply to others. You can also start a voice or
        video call right from here when the lecturer is online.
      </p>

      <div className="grid cards-2">
        {lecturers.map((l) => {
          const roomTopics = topics.filter((t) => t.lecturerId === l.id);
          const replyCount = roomTopics.reduce((n, t) => n + (t.replies?.length || 0), 0);
          const isOnline = online.some((u) => u.userId === l.id);
          return (
            <div key={l.id} className="card room-card">
              <div className="room-head">
                <Avatar name={l.name} size="lg" verified={isSubscriptionActive(l)} />
                <div>
                  <h3 className="room-name">
                    {l.name} {isSubscriptionActive(l) && <VerifiedBadge small />}
                    <span className={isOnline ? 'online-dot' : 'offline-dot'} title={isOnline ? 'Online now' : 'Offline'} />
                  </h3>
                  <p className="room-sub">
                    {l.title} · {l.department}
                  </p>
                  <p className="room-sub">
                    {roomTopics.length} topic{roomTopics.length !== 1 ? 's' : ''} · {replyCount}{' '}
                    {replyCount === 1 ? 'reply' : 'replies'}
                  </p>
                </div>
              </div>
              <div className="lcard__courses">
                {(l.courses || []).map((c) => (
                  <span key={c} className="chip">
                    {c}
                  </span>
                ))}
              </div>
              <div className="room-actions">
                <Link to={`/forum/lecturers/${l.id}`} className="btn btn--outline btn--sm">
                  Open room
                </Link>
                <CallButtons peer={{ id: l.id, name: l.name, role: 'LECTURER' }} />
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
