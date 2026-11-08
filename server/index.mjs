// E-Connect server: REST API + SSE change-stream + WebRTC call signaling
// in a single process. Data lives in a JSON file (data/db.json).

import { createServer } from 'node:http';
import { createCallRelay } from './signal.mjs';
import { handleApi } from './api.mjs';
import { getDb } from './db.mjs';

const PORT = process.env.PORT || 4000;

const server = createServer(async (req, res) => {
  try {
    if (req.url === '/api' || req.url.startsWith('/api/')) {
      const handled = await handleApi(req, res);
      if (!handled) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found.' }));
      }
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('E-Connect API server. The site runs on the Vite dev server (usually port 5173).');
  } catch (err) {
    console.error('[e-connect] request error:', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Server error. Try again.' }));
    } else {
      res.destroy();
    }
  }
});

createCallRelay(server);
getDb(); // ensure the database exists (seeds on first run)

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[e-connect] API + call signaling listening on http://localhost:${PORT}`);
});
