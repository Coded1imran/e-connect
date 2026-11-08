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

**Lecturers**
- Register / log in (lecturer role) with the courses they **specialize in**
- Dashboard with tabs: Overview, Requests, My Courses, Posts, Verified Badge
- Accept / decline / complete appointment requests
- Publish **Announcements** and **Materials** (with an optional file link) — shown on their
  public profile so students can follow them
- Manage the list of courses they specialize in

**Verified Lecturer Badge (subscription)** ⭐
- Lecturers can subscribe to become a *Verified* lecturer
- Price is a placeholder — see `src/config.js`:
  ```js
  export const SUBSCRIPTION = {
    name: 'Verified Lecturer Badge',
    amount: 9.99,        // change amount here
    currency: '$',
    period: 'month',
    durationDays: 30,
  };
  ```
- Checkout is simulated (no real payment gateway yet); payments are stored in the
  lecturer's subscription history and the badge appears across the whole site

## Tech Stack

- **React 18** (Vite) + **React Router 6** — plain JavaScript & JSX
- **Plain CSS** (`src/index.css`) — no CSS framework
- **Data**: browser `localStorage` — no server needed to run the demo.
  All accounts, bookings, posts and subscriptions persist between refreshes.

> Note: this is a client-side demo. For production, replace the `StoreContext` functions
> with real API calls (auth with hashed passwords, a database, and a payment gateway).

## Getting Started

```bash
cd e-connect
npm install
npm run dev
```

Open http://localhost:5173

## Demo Accounts

| Role     | Email                   | Password |
| -------- | ----------------------- | -------- |
| Student  | sara@student.com        | pass123  |
| Lecturer | dr.ade@econnect.com     | pass123  |

(Or register a fresh account — the login page has buttons to auto-fill the demo logins.)

## Project Structure

```
e-connect/
├── index.html
├── src/
│   ├── main.jsx            # Entry point
│   ├── App.jsx             # Routes
│   ├── index.css           # All styles
│   ├── config.js           # Subscription price + app settings
│   ├── context/
│   │   └── StoreContext.jsx # Auth + data store (localStorage)
│   ├── data/seed.js        # Demo lecturers, students, appointments, posts
│   ├── utils/helpers.js
│   ├── components/         # Navbar, Cards, Modal, BookingModal, ChipInput…
│   └── pages/
│       ├── Home.jsx, Login.jsx, Register.jsx
│       ├── LecturersPage.jsx, LecturerProfile.jsx, NotFound.jsx
│       ├── student/StudentDashboard.jsx
│       └── lecturer/LecturerDashboard.jsx
```
