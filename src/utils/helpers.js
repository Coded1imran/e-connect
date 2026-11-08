// Small shared utilities

export function uid() {
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

export function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

// "2026-03-14" -> "Sat, Mar 14 2026"
export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// "2026-03-14T10:30" style timestamps -> readable
export function formatDateTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function isUpcoming(dateIso, timeStr) {
  if (!dateIso) return false;
  const d = new Date(dateIso + 'T' + (timeStr || '00:00'));
  return d.getTime() > Date.now();
}

export function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
