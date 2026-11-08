import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import VerifiedBadge from './VerifiedBadge';
import Stars from './Stars';
import { useStore } from '../context/StoreContext';

export default function LecturerCard({ lecturer, onBook }) {
  const { isSubscriptionActive } = useStore();
  const verified = isSubscriptionActive(lecturer);

  return (
    <article className="lcard card">
      <div className="lcard__head">
        <Avatar name={lecturer.name} size="lg" verified={verified} />
        <div>
          <h3 className="lcard__name">
            {lecturer.name} {verified && <VerifiedBadge small />}
          </h3>
          <p className="lcard__sub">
            {lecturer.title} · {lecturer.department}
          </p>
          <Stars rating={lecturer.rating || 0} />
        </div>
      </div>

      <div className="lcard__courses">
        {lecturer.courses.map((c) => (
          <span key={c} className="chip">
            {c}
          </span>
        ))}
      </div>

      <div className="lcard__actions">
        <Link className="btn btn--outline btn--sm" to={`/lecturers/${lecturer.id}`}>
          View profile
        </Link>
        <button className="btn btn--primary btn--sm" onClick={() => onBook(lecturer)}>
          Book appointment
        </button>
      </div>
    </article>
  );
}
