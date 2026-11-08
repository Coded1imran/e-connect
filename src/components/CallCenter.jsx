import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { callConnect, callDisconnect, sendSignal, onSignal, requestPresence } from '../lib/callSocket';
import { CallSession } from '../lib/webrtc';
import Avatar from './Avatar';
import { uid } from '../utils/helpers';

const CallContext = createContext(null);
export function useCall() {
  return useContext(CallContext);
}

function playRing(times = 4) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.05);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
    let n = 1;
    const repeat = setInterval(() => {
      if (n++ >= times) {
        clearInterval(repeat);
        ctx.close();
        return;
      }
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = 660;
      g.gain.setValueAtTime(0.04, ctx.currentTime);
      osc.stop;
      o.start();
      o.stop(ctx.currentTime + 0.18);
    }, 500);
  } catch {
    // audio blocked — silently ignore
  }
}

function Timer({ since }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const sec = Math.max(0, Math.floor((now - since) / 1000));
  const m = String(Math.floor(sec / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return <span className="call-timer">{m}:{s}</span>;
}

export default function CallCenter({ children }) {
  const { sessionUser, notify } = useStore();
  const [online, setOnline] = useState([]);
  const [incoming, setIncoming] = useState(null); // {from, mode, sessionId}
  const [active, setActive] = useState(null); // {sessionId, peer, mode, role, status, since}
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const sessionRef = useRef(null);
  const activeRef = useRef(null);
  activeRef.current = active;
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);

  // ── Socket lifecycle ──────────────────────────────────
  useEffect(() => {
    if (!sessionUser) {
      callDisconnect();
      setOnline([]);
      cleanupSession(false);
      setActive(null);
      setIncoming(null);
      return;
    }
    callConnect(sessionUser);
    requestPresence();

    const off = onSignal((msg) => {
      switch (msg.type) {
        case 'presence':
          setOnline(msg.users || []);
          break;
        case 'call-ring': {
          const busy = activeRef.current && activeRef.current.status !== 'ended';
          if (busy) {
            sendSignal({ type: 'call-busy', to: msg.from, sessionId: msg.sessionId });
            return;
          }
          playRing();
          setIncoming({ from: { id: msg.from, name: msg.fromName, role: msg.fromRole }, mode: msg.mode, sessionId: msg.sessionId });
          break;
        }
        case 'call-accept': {
          const s = sessionRef.current;
          if (s && s.role === 'caller' && msg.sessionId === s.sessionId) {
            setActive((a) => ({ ...a, status: 'connecting' }));
            s.setupPeer();
            s.createAndSendOffer().catch(() => {
              notify('Could not establish the call connection.', 'error');
              endCallInternal(false);
            });
          }
          break;
        }
        case 'call-decline': {
          const s = sessionRef.current;
          if (s && msg.sessionId === s.sessionId) {
            notify(`${s.peerUser.name} declined the call.`, 'info');
            endCallInternal(false);
          }
          break;
        }
        case 'call-busy': {
          const s = sessionRef.current;
          if (s && msg.sessionId === s.sessionId) {
            notify(`${s.peerUser.name} is on another call.`, 'info');
            endCallInternal(false);
          }
          break;
        }
        case 'unreachable': {
          const s = sessionRef.current;
          if (s && msg.sessionId === s.sessionId) {
            notify(`${s.peerUser.name} is offline right now.`, 'error');
            endCallInternal(false);
          }
          break;
        }
        case 'call-end': {
          const s = sessionRef.current;
          if (s && msg.sessionId === s.sessionId) {
            endCallInternal(false);
          }
          break;
        }
        case 'sdp':
        case 'ice': {
          const s = sessionRef.current;
          if (s && msg.sessionId === s.sessionId) {
            s.handleSignal(msg);
          }
          break;
        }
        default:
          break;
      }
    });
    return off;
  }, [sessionUser?.id]);

  // Attach media streams to video elements when present
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, active?.status]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, active?.status]);

  function cleanupSession(notifyPeer) {
    sessionRef.current?.hangUp(notifyPeer);
    sessionRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
  }

  function endCallInternal(notifyPeer = true) {
    cleanupSession(notifyPeer);
    setActive(null);
    setIncoming(null);
  }

  // ── Public actions ────────────────────────────────────
  async function startCall(peerUser, mode = 'video') {
    if (!sessionUser) {
      notify('Please log in to start a call.', 'error');
      return;
    }
    if (!peerUser || peerUser.id === sessionUser.id) return;
    if (activeRef.current) {
      notify('Finish the current call first.', 'error');
      return;
    }
    if (!online.some((u) => u.userId === peerUser.id)) {
      notify(`${peerUser.name} is offline right now.`, 'error');
      return;
    }
    const sessionId = 'call-' + uid();
    const session = new CallSession({
      sessionId,
      role: 'caller',
      peerUser,
      mode,
      callbacks: {
        onRemoteStream: setRemoteStream,
        onConnected: () =>
          setActive((a) => (a && a.sessionId === sessionId ? { ...a, status: 'connected', since: Date.now() } : a)),
        onFailed: () => {
          notify('Call connection failed.', 'error');
          endCallInternal(true);
        },
      },
    });
    setActive({ sessionId, peer: peerUser, mode, role: 'caller', status: 'ringing' });
    try {
      await session.acquireLocalMedia();
      setLocalStream(session.localStream);
      setCamOn(mode === 'video');
      setMicOn(true);
      sessionRef.current = session;
      sendSignal({ type: 'call-ring', to: peerUser.id, sessionId, mode });
    } catch (err) {
      endCallInternal(false);
      notify(err.message, 'error');
    }
  }

  async function acceptCall() {
    if (!incoming) return;
    const inc = incoming;
    setIncoming(null);
    const peerUser = inc.from;
    const sessionId = inc.sessionId;
    const session = new CallSession({
      sessionId,
      role: 'callee',
      peerUser,
      mode: inc.mode || 'video',
      callbacks: {
        onRemoteStream: setRemoteStream,
        onConnected: () =>
          setActive((a) => (a && a.sessionId === sessionId ? { ...a, status: 'connected', since: Date.now() } : a)),
        onFailed: () => {
          notify('Call connection failed.', 'error');
          endCallInternal(true);
        },
      },
    });
    setActive({ sessionId, peer: peerUser, mode: session.mode, role: 'callee', status: 'connecting' });
    try {
      await session.acquireLocalMedia();
      setLocalStream(session.localStream);
      setCamOn(session.mode === 'video');
      setMicOn(true);
      sessionRef.current = session;
      session.setupPeer(); // ready before caller's offer arrives
      sendSignal({ type: 'call-accept', to: peerUser.id, sessionId });
    } catch (err) {
      sendSignal({ type: 'call-decline', to: peerUser.id, sessionId });
      endCallInternal(false);
      notify(err.message, 'error');
    }
  }

  function declineCall() {
    if (!incoming) return;
    sendSignal({ type: 'call-decline', to: incoming.from.id, sessionId: incoming.sessionId });
    setIncoming(null);
  }

  function endCall() {
    endCallInternal(true);
    notify('Call ended.', 'info');
  }

  function toggleMic() {
    const next = !micOn;
    setMicOn(next);
    sessionRef.current?.toggleMic(next);
  }

  function toggleCam() {
    const next = !camOn;
    setCamOn(next);
    sessionRef.current?.toggleCam(next);
  }

  // Solo preview — shows the real call UI with your own camera standing in
  // for the remote side. No second user needed. Clearly labeled as practice.
  async function startPracticeCall(mode = 'video') {
    if (activeRef.current) {
      notify('Finish the current call first.', 'error');
      return;
    }
    if (!sessionUser) {
      notify('Log in first (the demo accounts on this page work).', 'error');
      return;
    }
    const sessionId = 'practice-' + uid();
    const peer = { id: '__practice__', name: 'Practice peer (preview)', role: 'STUDENT' };
    const session = new CallSession({
      sessionId,
      role: 'caller',
      peerUser: peer,
      mode,
      callbacks: {},
    });
    setActive({ sessionId, peer, mode: 'video', role: 'caller', status: 'ringing', practice: true });
    try {
      await session.acquireLocalMedia();
      setLocalStream(session.localStream);
      setCamOn(mode === 'video');
      setMicOn(true);
      sessionRef.current = session;
      setActive((a) => (a && a.sessionId === sessionId ? { ...a, status: 'connecting' } : a));
      // Pretend the peer answered
      setTimeout(() => {
        if (activeRef.current?.sessionId !== sessionId) return;
        if (mode === 'video') setRemoteStream(session.localStream);
        setActive((a) =>
          a && a.sessionId === sessionId ? { ...a, status: 'connected', since: Date.now() } : a
        );
      }, 1800);
    } catch (err) {
      endCallInternal(false);
      notify(err.message, 'error');
    }
  }

  const activeCallVisible = active && active.status !== 'ended';

  return (
    <CallContext.Provider value={{ online, incoming, acceptCall, declineCall, endCall, startCall, startPracticeCall, active, toggleMic, toggleCam, micOn, camOn }}>
      {children}

      {/* ── Incoming call prompt ── */}
      {incoming && !activeCallVisible && (
        <div className="call-backdrop">
          <div className="incoming-card card">
            <Avatar name={incoming.from.name} size="xl" verified={incoming.from.role === 'LECTURER'} />
            <div>
              <h3 className="call-title">Incoming {incoming.mode === 'video' ? 'video' : 'voice'} call</h3>
              <p className="muted">{incoming.from.name}</p>
            </div>
            <div className="call-actions-row">
              <button className="btn btn--primary" onClick={acceptCall}>
                Accept
              </button>
              <button className="btn btn--danger" onClick={declineCall}>
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Active call overlay ── */}
      {activeCallVisible && (
        <div className="call-backdrop">
          <div className={active.mode === 'video' ? 'call-stage call-stage--video' : 'call-side'}>
            {active.mode === 'video' ? (
              <>
                <video className="remote-video" ref={remoteVideoRef} autoPlay playsInline />
                {!remoteStream && (
                  <div className="call-connecting">
                    <Avatar name={active.peer.name || active.peer.userId} size="xl" />
                    <div className="wave">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <span key={i} />
                      ))}
                    </div>
                    <p className="muted">
                      {active.practice
                        ? 'Preparing your preview…'
                        : active.status === 'connecting'
                          ? 'Connecting…'
                          : 'Ringing…'}{' '}
                      {!active.practice && active.peer.name}
                    </p>
                    <TimerBadge active={active} />
                  </div>
                )}
                <video className="local-video" ref={localVideoRef} autoPlay playsInline muted />
              </>
            ) : (
              <div className="call-connecting" style={{ color: '#fff' }}>
                <Avatar name={active.peer.name || active.peer.userId} size="xl" />
                <div className="wave">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <span key={i} />
                  ))}
                </div>
                <p style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {active.practice
                    ? 'Voice preview with yourself'
                    : active.status === 'connected'
                      ? 'Voice call with'
                      : 'Ringing…'}{' '}
                  {!active.practice && active.peer.name}
                </p>
                <TimerBadge active={active} />
              </div>
            )}

            <div className="call-controls">
              <button className={micOn ? 'call-btn' : 'call-btn call-btn--off'} onClick={toggleMic}>
                {micOn ? 'Mic on' : 'Muted'}
              </button>
              {active.mode === 'video' && (
                <button className={camOn ? 'call-btn' : 'call-btn call-btn--off'} onClick={toggleCam}>
                  {camOn ? 'Camera on' : 'Camera off'}
                </button>
              )}
              <button className="call-btn call-btn--end" onClick={endCall}>
                End call
              </button>
            </div>
          </div>
        </div>
      )}
    </CallContext.Provider>
  );
}

function TimerBadge({ active }) {
  if (active.status !== 'connected' || !active.since) return null;
  return <Timer since={active.since} />;
}
