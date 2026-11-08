// E-Connect server: REST API + SSE change-stream + WebRTC call signaling
// in a single process. Data lives in a JSON file (data/db.json).
// In production (dist/ present) it also serves the built website.

import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCallRelay } from './signal.mjs';
import { handleApi } from './api.mjs';
import { getDb } from './db.mjs';

const PORT = process.env.PORT || 4000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(__dirname, '..', 'dist');
const hasStatic = fs.existsSync(path.join(DIST, 'index.html'));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

function serveStatic(req, res) {
  if (!hasStatic || req.method !== 'GET') return false;
  const pathname = decodeURIComponent(new URL(req.url, 'http://local').pathname);
  let filePath = path.join(DIST, pathname);
  if (!filePath.startsWith(DIST)) return false; // path traversal guard
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
    return true;
  }
  // SPA fallback: client-side routes always receive the app shell
  const index = path.join(DIST, 'index.html');
  if (fs.existsSync(index)) {
    res.writeHead(200, { 'Content-Type': MIME['.html'] });
    fs.createReadStream(index).pipe(res);
    return true;
  }
  return false;
}

const server = createServer(async (req, res) => {
  try {
    if (req.url === '/api' || req.url.startsWith('/api/')) {
      // CORS — allows a separately-hosted frontend (e.g. Vercel) to call this API
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Max-Age', '86400');
      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
      }
      const handled = await handleApi(req, res);
      if (!handled) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found.' }));
      }
      return;
    }

    if (serveStatic(req, res)) return;

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end(
      hasStatic
        ? 'Not found.'
        : 'E-Connect API server is running. Build the site (npm run build) or use the Vite dev server (port 5173).'
    );
  } catch (err) {
    console.error('[e-connect] request error:', err.message || err);
    try {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Server error. Try again.' }));
      } else {
        res.destroy();
      }
    } catch {
      // socket already gone
    }
  }
});

createCallRelay(server);
getDb(); // ensure the database exists (seeds on first run)

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[e-connect] API + call signaling + static on http://localhost:${PORT}`);
});
