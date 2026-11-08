// JSON-file database with atomic writes. Swappable for Postgres/SQL later:
// only this module touches storage.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { SEED_USERS, SEED_APPOINTMENTS, SEED_POSTS, SEED_TOPICS } from '../src/data/seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DB_DIR, 'db.json');

export function uid() {
  return crypto.randomUUID();
}

// scrypt hashing (built-in, no extra dependency)
export function hashPassword(password, salt) {
  salt = salt || crypto.randomBytes(16).toString('hex');
  const passwordHash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return { salt, passwordHash };
}

export function verifyPassword(password, salt, passwordHash) {
  try {
    const candidate = crypto.scryptSync(String(password), salt, 64);
    return crypto.timingSafeEqual(candidate, Buffer.from(passwordHash, 'hex'));
  } catch {
    return false;
  }
}

let db = null;

function seedDatabase() {
  const users = SEED_USERS.map((u) => {
    const { password, ...rest } = u;
    const acc = { ...rest, ...hashPassword(password), createdAt: new Date().toISOString() };
    if (acc.role === 'LECTURER') {
      acc.rating = acc.rating ?? 0;
      acc.courses = acc.courses ?? [];
      acc.bio = acc.bio ?? '';
      acc.verified = acc.verified ?? false;
      acc.subscribedUntil = acc.subscribedUntil ?? null;
      acc.subscriptionHistory = acc.subscriptionHistory ?? [];
    }
    return acc;
  });
  return {
    users,
    appointments: SEED_APPOINTMENTS,
    posts: SEED_POSTS,
    topics: SEED_TOPICS,
    tokens: {},
  };
}

export function getDb() {
  if (db) return db;
  fs.mkdirSync(DB_DIR, { recursive: true });
  if (fs.existsSync(DB_PATH)) {
    try {
      db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    } catch {
      db = null;
    }
  }
  if (!db || !Array.isArray(db.users) || db.users.length === 0) {
    db = seedDatabase();
    save();
    console.log(`[e-connect] Seeded fresh database at ${DB_PATH}`);
  }
  return db;
}

export function save() {
  const tmp = DB_PATH + '.tmp';
  try {
    fs.writeFileSync(tmp, JSON.stringify(db));
    fs.renameSync(tmp, DB_PATH);
  } catch (err) {
    console.error('[e-connect] DB save failed:', err.message);
  }
}

// Strip private fields before anything leaves the server
export function publicUser(u) {
  const { passwordHash, salt, ...pub } = u;
  return pub;
}
