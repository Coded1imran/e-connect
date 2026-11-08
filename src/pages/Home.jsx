import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { APP_NAME, PRICE_LABEL } from '../config';
import Avatar from '../components/Avatar';
import VerifiedBadge from '../components/VerifiedBadge';
import Stars from '../components/Stars';
import { COURSE_CATALOG } from '../data/seed';

export default function Home() {
  const navigate = useNavigate();
  const { lecturers, appointments, posts, isSubscriptionActive } = useStore();
  const verifiedLecturers = lecturers.filter((l) => isSubscriptionActive(l));
  const featured = [...verifiedLecturers, ...lecturers].slice(0, 3);
  const courseCount = new Set(lecturers.flatMap((l) => l.courses || [])).size;

  function onSearch(e) {
    e.preventDefault();
    navigate('/lecturers');
  }

  return (
    <main>
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero__inner">
          <span className="hero__eyebrow">The smarter way to learn</span>
          <h1 className="hero__title">
            Connect directly with the <span className="accent">lecturers</span> you need.
          </h1>
          <p className="hero__sub">
            {APP_NAME} links students to lecturers across campus. Find a lecturer by course, book an
            appointment in seconds, and get announcements and study materials straight from them.
          </p>
          <form className="hero__search" onSubmit={onSearch}>
            <input
              className="hero__search-input"
              placeholder="What course do you need help with?"
              onFocus={() => navigate('/lecturers')}
              readOnly
            />
            <button className="btn btn--accent" type="submit">
              Find lecturers
            </button>
          </form>
          <div className="hero__cta">
            <Link to="/register" className="btn btn--light">
              Create a free account
            </Link>
            <Link to="/register?role=lecturer" className="btn btn--outline-light">
              Are you a lecturer? Join →
            </Link>
          </div>
          <div className="hero__stats">
            <div>
              <strong>{lecturers.length}</strong> Lecturers
            </div>
            <div>
              <strong>{courseCount}</strong> Courses covered
            </div>
            <div>
              <strong>{appointments.length}</strong> Appointments booked
            </div>
            <div>
              <strong>{posts.length}</strong> Posts shared
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="section" id="how-it-works">
        <div className="container">
          <h2 className="section__title">How {APP_NAME} works</h2>
          <p className="section__sub">Three steps between you and the help you need.</p>
          <div className="grid cards-3">
            <div className="card step">
              <div className="step__num">1</div>
              <h3>Find your lecturer</h3>
              <p>
                Search by course, department or name. Verified lecturers carry a badge so you know
                they're committed.
              </p>
            </div>
            <div className="card step">
              <div className="step__num">2</div>
              <h3>Book an appointment</h3>
              <p>
                Pick the course, date and time, add a short note on what you need help with, and
                send the request.
              </p>
            </div>
            <div className="card step">
              <div className="step__num">3</div>
              <h3>Learn &amp; follow up</h3>
              <p>
                Track requests on your dashboard, get materials the lecturer posts, and rebook
                anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured lecturers ── */}
      <section className="section section--tinted">
        <div className="container">
          <h2 className="section__title">Featured lecturers</h2>
          <p className="section__sub">Top-rated and verified members of {APP_NAME}.</p>
          <div className="grid cards-3">
            {featured.map((l) => (
              <Link key={l.id} to={`/lecturers/${l.id}`} className="card feat">
                <Avatar name={l.name} size="lg" verified={isSubscriptionActive(l)} />
                <h3>
                  {l.name} {isSubscriptionActive(l) && <VerifiedBadge small />}
                </h3>
                <p className="feat__sub">
                  {l.title} · {l.department}
                </p>
                <Stars rating={l.rating || 0} />
                <div className="feat__courses">
                  {(l.courses || []).slice(0, 3).map((c) => (
                    <span key={c} className="chip">
                      {c}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
          <div className="section__center">
            <Link to="/lecturers" className="btn btn--primary">
              Browse all lecturers
            </Link>
          </div>
        </div>
      </section>

      {/* ── Courses strip ── */}
      <section className="section">
        <div className="container">
          <h2 className="section__title">Popular courses right now</h2>
          <div className="course-cloud">
            {COURSE_CATALOG.slice(0, 12).map((c) => (
              <Link key={c} to="/lecturers" className="chip chip--lg">
                {c}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Lecturer CTA ── */}
      <section className="section">
        <div className="container">
          <div className="cta card">
            <div>
              <h2>Are you a lecturer?</h2>
              <p>
                List the courses you specialize in, receive appointment bookings from students, and
                post announcements &amp; materials on your dashboard.
              </p>
              <ul className="cta__list">
                <li>✓ Show a <strong>Verified Lecturer</strong> badge with a subscription ({PRICE_LABEL})</li>
                <li>✓ Accept or decline bookings on your own terms</li>
                <li>✓ Share announcements and study materials with students</li>
              </ul>
            </div>
            <div className="cta__actions">
              <Link to="/register?role=lecturer" className="btn btn--accent btn--lg">
                Join as a lecturer
              </Link>
              <span className="cta__note">Free to join · Badge optional</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
