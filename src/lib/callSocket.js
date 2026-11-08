// Call signaling client — one socket per user session, with reconnect.

const listeners = new Set();
let socket = null;
let userKey = null;
let me = null;
let reconnectTimer = null;
let backoff = 1000;

function isOpen() {
  return socket && socket.readyState === WebSocket.OPEN;
}

function scheduleReconnect() {
  if (!userKey) return;
  clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(() => open(), backoff);
  backoff = Math.min(backoff * 1.7, 8000);
}

function open() {
  if (!userKey || !me) return;
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  try {
    socket = new WebSocket(`${proto}://${location.host}/ws`);
  } catch {
    scheduleReconnect();
    return;
  }

  socket.onopen = () => {
    backoff = 1000;
    send({ type: 'hello', role: me.role, name: me.name });
  };

  socket.onmessage = (e) => {
    let msg = null;
    try {
      msg = JSON.parse(e.data);
    } catch {
      return;
    }
    if (msg) listeners.forEach((l) => l(msg));
  };

  socket.onclose = () => {
    socket = null;
    scheduleReconnect();
  };

  socket.onerror = () => {
    // onclose will follow — reconnect handled there
  };
}

function send(payload) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

// ── Public API ─────────────────────────────────────────
export function callConnect(user) {
  if (userKey === user.id && socket) return;
  callDisconnect();
  userKey = user.id;
  me = { userId: user.id, role: user.role, name: user.name };
  open();
}

export function callDisconnect() {
  clearTimeout(reconnectTimer);
  reconnectTimer = null;
  const closing = socket;
  socket = null;
  userKey = null;
  me = null;
  if (closing) {
    closing.onclose = null;
    closing.onmessage = null;
    closing.onerror = null;
    try {
      closing.close();
    } catch {
      // ignore
    }
  }
}

export function sendSignal(payload) {
  send(payload);
}

export function onSignal(fn) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function requestPresence() {
  send({ type: 'presence' });
}
