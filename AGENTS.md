# E-Connect — Project Guidelines

## What this is
E-learning platform connecting students with lecturers.
- Students search lecturers by course and book appointments.
- Lecturers list the courses they specialize in, manage bookings, and post
  announcements + materials on their dashboard.
- Forum: every lecturer has a public room; students post topics and replies,
  lecturers reply — plus live VIDEO and VOICE calls (WebRTC) between any
  two logged-in users who are online at the same time.
- Lecturers can buy a "Verified Lecturer Badge" subscription (price is a
  PLACEHOLDER in `src/config.js` — user will supply the real amount later).
- Two dashboards: one for lecturers, one for students.

## Stack (fixed by user — do not change without asking)
- React 18 + Vite, plain JavaScript & JSX (no TypeScript)
- Plain HTML/JSX + plain CSS (`src/index.css`), no CSS framework
- React Router v6
- Calls: WebRTC peer-to-peer. Signaling lives INSIDE `server/index.mjs`
  (`server/signal.mjs`) — one process serves API + calls on port 4000;
  browser connects through the Vite proxy at `/ws`. STUN only (no TURN), so calls
  work on the same / local network — a TURN server is needed for strict NATs.
- REAL BACKEND: `server/index.mjs` (plain node:http, port 4000) serves
  REST API + SSE change-stream + WebRTC signaling. Data in `data/db.json`
  (server module `server/db.mjs`) — shared by ALL users; auth via scrypt-hashed
  passwords + bearer tokens; live sync via `/api/events` SSE + 20s poll fallback.

## User preferences (IMPORTANT)
- **Never use emojis anywhere** in UI, code, README, messages, or any artifact
  built for this user, unless they explicitly ask. Plain SVG icons are fine.
- Subscription price placeholder lives in `src/config.js` — update in one place
  (server imports the same file, so API pricing matches automatically).
- No API keys needed — the backend is self-contained.
- User adds features incrementally; always wait for their input on new scope.

## Commands
Run from the `e-connect` folder (PowerShell: use `npm.cmd`, not `npm`):
- `npm.cmd run dev` — API server (port 4000) + web app (5173, LAN-visible)
- `npm.cmd run dev:web` / `npm.cmd run dev:server` — one at a time
- `npm.cmd run build` — production build
- Reset all data: delete `data/db.json` (re-seeds on next start)

## Demo accounts (seeded into the server DB)
- Student: sara@student.com / pass123
- Lecturer: dr.ade@econnect.com / pass123

## Structure
- `server/` — index.mjs (HTTP server), api.mjs (REST + SSE), signal.mjs (calls), db.mjs (JSON DB)
- `data/db.json` — all accounts, bookings, posts, topics (auto-created, gitignored)
- `src/lib/api.js` — fetch client + token + SSE subscription
- `src/config.js` — app name, subscription pricing, demo accounts
- `src/context/StoreContext.jsx` — data cache + auth + mutators (calls the API)
- `src/data/seed.js` — demo users, appointments, posts, topics, course catalog
- `src/components/` — shared UI (Navbar, Cards, Modal, BookingModal, CallCenter, ChipInput…)
- `src/pages/` — Home, Login, Register, LecturersPage, LecturerProfile, PublicFeed,
  CallDemo, forum/ForumRooms, forum/ForumRoom, NotFound,
  `student/StudentDashboard.jsx`, `lecturer/LecturerDashboard.jsx`

## Status
- Functional multi-user build: server DB + auth tokens + live SSE sync,
  verified (bootstrap/login/me all 200). Emojis stripped everywhere.
- Roles enforced server-side (only students book, only lecturers post/subscribe,
  owners-only deletes). Pending from user: real subscription price, next features.
