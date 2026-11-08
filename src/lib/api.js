// API client — every request carries the auth token when present.
// Set VITE_API_URL at build time when the API lives on another host
// (e.g. frontend on Vercel, backend on Render). Empty = same origin.

export const API_ORIGIN = import.meta.env.VITE_API_URL || '';

const TOKEN_KEY = 'econnect_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_ORIGIN}${path}`, { ...options, headers });
  } catch {
    throw new Error('Cannot reach the E-Connect server. Ask the host to start it.');
  }

  let payload = null;
  const type = res.headers.get('content-type') || '';
  if (type.includes('application/json')) payload = await res.json();

  if (!res.ok) {
    const err = new Error((payload && payload.error) || 'Something went wrong. Try again.');
    err.status = res.status;
    throw err;
  }
  return payload;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};

// Live updates: the server pushes a "changed" ping on every data mutation.
export function openEventStream(onChange) {
  const es = new EventSource(`${API_ORIGIN}/api/events`);
  es.onmessage = () => onChange();
  es.onerror = () => {
    // EventSource reconnects automatically
  };
  return () => es.close();
}
