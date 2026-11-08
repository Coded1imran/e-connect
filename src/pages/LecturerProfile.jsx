import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import Avatar from '../components/Avatar';
import VerifiedBadge from '../components/VerifiedBadge';
import Stars from '../components/Stars';
import PostCard from '../components/PostCard';
import BookingModal from '../components/BookingModal';
import CallButtons from '../components/CallButtons';
import EmptyState from '../components/EmptyState';
import NotFound from './NotFound';

export default function LecturerProfile() {
  const { id } = useParams();
  const { lecturers, sessionUser, postsByLecturer, isSubscriptionActive } = useStore();
  const [booking, setBooking] = useState(false);

  const lecturer = lecturers.find((l) => l.id === id);
  if (!lecturer) return <NotFound />;
  const verified = isSubscriptionActive(lecturer);
  const posts = postsByLecturer(lecturer.id);

  return (
    <main className="container main-pad">
      <Link to="/lecturers" className="backlink">
        ← All lecturers
      </Link>

      {/* Header card */}
      <section className="card prof__head">
        <Avatar name={lecturer.name} size="xl" verified={verified} />
        <div className="prof__head-info">
          <h1 className="prof__name">
            {lecturer.name} {verified && <VerifiedBadge />}
          </h1>
          <p className="prof__sub">
            {lecturer.title} · Department of {lecturer.department}
          </p>
          <Stars rating={lecturer.rating || 0} />
          {lecturer.bio && <p className="prof__bio">{lecturer.bio}</p>}
        </div>
        <div className="prof__head-cta">
          <div className="prof__head-btns">
            {(sessionUser?.role === 'STUDENT' || !sessionUser) && (
              <button className="btn btn--primary" onClick={() => setBooking(true)}>
                Book appointment
              </button>
            )}
            <CallButtons peer={{ id: lecturer.id, name: lecturer.name, role: lecturer.role }} />
          </div>
          {sessionUser?.id === lecturer.id && (
            <Link to="/dashboard/lecturer" className="btn btn--outline" style={{ marginTop: 10 }}>
              Edit on dashboard
            </Link>
          )}
        </div>
      </section>

      {/* Courses */}
      <section className="card">
        <h2 className="card__title">Courses I specialize in</h2>
        <div className="chip-cloud">
          {lecturer.courses.length > 0 ? (
            lecturer.courses.map((c) => (
              <Link key={c} to="/lecturers" className="chip chip--lg">
                {c}
              </Link>
            ))
          ) : (
            <p className="muted">No courses listed yet.</p>
          )}
        </div>
      </section>

      {/* Posts */}
      <section>
        <h2 className="section__title section__title--left">Announcements &amp; Materials</h2>
        {posts.length === 0 ? (
          <EmptyState
            title="Nothing posted yet"
            hint="This lecturer hasn't shared any announcements or materials yet."
          />
        ) : (
          <div className="posts-list">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        )}
      </section>

      <BookingModal lecturer={lecturer} open={booking} onClose={() => setBooking(false)} />
    </main>
  );
}
