# E-Connect

An e-learning platform that connects **students** with **lecturers** — find a lecturer by
course, book appointments, and follow their announcements and study materials.

## Features

**Students**
- Register / log in (student role)
- Search & filter lecturers by name, course, department, or verified status
- Book appointments (course + date + time + note) and track their status
  (Pending → Accepted/Declined → Completed, or Cancelled)
- Personal dashboard with stats, upcoming sessions and full appointment history
- Forum rooms, public posts feed, and live voice/video calls with online users

**Lecturers**
- Register / log in (lecturer role) with the courses they **specialize in**
- Dashboard with tabs: Overview, Requests, My Courses, Posts, Verified Badge
- Accept / decline / complete appointment requests
- Publish **Announcements** and **Materials** (with an optional file link) — shown on their
  public profile so students can follow them
- Manage the list of courses they specialize in

**Verified Lecturer Badge (subscription)**
- Lecturers can subscribe to become a *Verified* lecturer
- Price is a placeholder — see `src/config.js` (change `amount` there; the server
  imports the same value so API pricing matches automatically)
- Checkout is simulated (no real payment gateway yet); payments are stored in the
  lecturer's subscription history and the badge appears across the whole site

## Tech Stack

- **React 18** (Vite) + **React Router 6** — plain JavaScript & JSX
- **Plain CSS** (`src/index.css`) — no CSS framework
- **Real backend**: `server/index.mjs` (plain Node, no framework) — REST API,
  SSE live-change stream, and WebRTC call signaling in one process
- **Shared data**: all users connect to the same server; data lives in
  `data/db.json` (auto-created and seeded on first run), passwords scrypt-hashed,
  bearer-token auth. A 20-second poll keeps clients in sync if SSE drops.

## Getting Started

```
npm install
npm run dev
```

Open http://localhost:5173 (the API + call server runs on port 4000;
the Vite dev server proxies `/api` and `/ws` to it).

## Demo Accounts

| Role     | Email                   | Password |
| -------- | ----------------------- | -------- |
| Student  | sara@student.com        | pass123  |
| Lecturer | dr.ade@econnect.com     | pass123  |

(Or register a fresh account — the login page has buttons to auto-fill the demo logins.)

Reset all data: delete `data/db.json` — it re-seeds on the next server start.

## Deploy (all-in-one on Render)

The production server (`node server/index.mjs`) serves the built website from
`dist/`, the REST API, the SSE change stream, and the WebRTC call signaling on a
single port. One hosting account runs the whole app with one public URL.

On render.com: **New Web Service** → connect this GitHub repo →
Build command `npm install && npm run build`, Start command `npm start`,
instance type Free. Render sets `PORT` automatically; no environment variables
are required.

Free-tier instances sleep after ~15 minutes of inactivity — the first visitor
after that waits roughly 30-60 seconds for the instance to wake up.
(Separate frontends can point at a hosted API with the `VITE_API_URL` build
variable; see `src/lib/api.js` and `src/lib/callSocket.js`.)

## Project Structure

```
e-connect/
├── index.html
├── server/
│   ├── index.mjs         # HTTP server: API routing, CORS, static dist + SPA fallback
│   ├── api.mjs           # All REST routes + /api/events SSE stream
│   ├── signal.mjs        # WebRTC signaling relay (/ws)
│   └── db.mjs            # JSON-file DB, scrypt auth, seeding
├── data/db.json          # Shared live database (gitignored, auto-created)
├── src/
│   ├── main.jsx          # Entry point
│   ├── App.jsx           # Routes
│   ├── index.css          # All styles
│   ├── config.js          # Subscription price + app settings
│   ├── lib/               # api.js (fetch + token + SSE), callSocket.js (calls)
│   ├── context/
│   │   └── StoreContext.jsx # Auth + data store (talks to the API)
│   ├── data/seed.js       # Demo lecturers, students, appointments, posts
│   ├── components/        # Navbar, Cards, Modal, BookingModal, CallCenter, ChipInput…
│   └── pages/
│       ├── Home.jsx, Login.jsx, Register.jsx
│       ├── LecturersPage.jsx, LecturerProfile.jsx, PublicFeed.jsx
│       ├── forum/ (rooms, topics, replies)
│       ├── CallDemo.jsx, NotFound.jsx
│       ├── student/StudentDashboard.jsx
│       └── lecturer/LecturerDashboard.jsx
```
