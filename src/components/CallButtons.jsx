import { useCall } from './CallCenter';
import { useStore } from '../context/StoreContext';

// Voice / video call buttons for a peer user. Hidden for guests and self.
export default function CallButtons({ peer }) {
  const { online, startCall, active } = useCall();
  const { sessionUser } = useStore();

  if (!sessionUser || !peer || sessionUser.id === peer.id) return null;

  const isOnline = online.some((u) => u.userId === peer.id);
  const busy = !!active && active.status !== 'ended';

  return (
    <div className="callbtns">
      <span
        className={isOnline ? 'online-dot' : 'offline-dot'}
        title={isOnline ? 'Online now' : 'Offline'}
      />
      <button
        className="btn btn--outline btn--sm"
        disabled={busy || !isOnline}
        onClick={() => startCall(peer, 'audio')}
        title={isOnline ? 'Start a voice call' : 'User is offline'}
      >
        Voice call
      </button>
      <button
        className="btn btn--primary btn--sm"
        disabled={busy || !isOnline}
        onClick={() => startCall(peer, 'video')}
        title={isOnline ? 'Start a video call' : 'User is offline'}
      >
        Video call
      </button>
    </div>
  );
}
