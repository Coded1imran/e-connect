// Call signaling client — one socket per user session, with reconnect.

import { API_ORIGIN } from './api.js';

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
  // Same origin by default (Vite proxies /ws in dev); when the API is hosted
  // elsewhere (VITE_API_URL set), connect straight to that host.
  const base = API_ORIGIN || `${location.protocol}//${location.host}`;
  try {
    socket = new WebSocket(`${base.replace(/^http/, 'ws')}/ws`);
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
