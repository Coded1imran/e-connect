// WebRTC call signaling relay — moved here so one server handles everything.
// Relays handshake messages between users; media stays peer-to-peer.

import { WebSocketServer, WebSocket } from 'ws';

export function createCallRelay(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  // userId -> { ws, meta: { userId, role, name } }
  const conns = new Map();

  function presence() {
    const users = [];
    for (const { meta } of conns.values()) {
      if (meta) users.push(meta);
    }
    return users;
  }

  function broadcastPresence() {
    const msg = JSON.stringify({ type: 'presence', users: presence() });
    for (const { ws } of conns.values()) {
      if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    }
  }

  wss.on('connection', (ws) => {
    ws.on('message', (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (msg.type === 'hello') {
        if (!msg.userId) return;
        conns.set(msg.userId, {
          ws,
          meta: { userId: msg.userId, role: msg.role || '', name: msg.name || '' },
        });
        ws.send(JSON.stringify({ type: 'presence', users: presence() }));
        broadcastPresence();
        return;
      }

      if (msg.type === 'presence') {
        ws.send(JSON.stringify({ type: 'presence', users: presence() }));
        return;
      }

      if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
        return;
      }

      const sender = conns.get(msg.userId);
      if (!sender || sender.ws !== ws) {
        ws.send(JSON.stringify({ type: 'error', code: 'not-registered' }));
        return;
      }

      const target = msg.to ? conns.get(msg.to) : null;
      if (target && target.ws.readyState === WebSocket.OPEN && target.ws !== ws) {
        target.ws.send(
          JSON.stringify({
            ...msg,
            from: msg.userId,
            fromName: sender.meta.name,
            fromRole: sender.meta.role,
          })
        );
      } else {
        ws.send(
          JSON.stringify({
            type: 'unreachable',
            to: msg.to || null,
            kind: msg.type,
            sessionId: msg.sessionId || null,
          })
        );
      }
    });

    ws.on('close', () => {
      for (const [id, conn] of conns.entries()) {
        if (conn.ws === ws) {
          conns.delete(id);
          break;
        }
      }
      broadcastPresence();
    });

    ws.on('error', () => {
      // connection-level failure — 'close' follows
    });
  });

  return wss;
}
