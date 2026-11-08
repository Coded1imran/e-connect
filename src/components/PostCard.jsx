import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import VerifiedBadge from './VerifiedBadge';
import { useStore } from '../context/StoreContext';

// Thread-style post card (social feed look) — used on the public feed,
// lecturer profiles and the lecturer dashboard.
export default function PostCard({ post, onDelete }) {
  const { userById, isSubscriptionActive } = useStore();
  const lecturer = userById(post.lecturerId);
  if (!lecturer) return null;
  const verified = isSubscriptionActive(lecturer);
  const handle = lecturer.name
    .toLowerCase()
    .split(/\s+/)
    .join('.')
    .replace(/[^a-z0-9.-]/g, '');
  const time = new Date(post.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <article className="thread">
      <div className="thread__head">
        <Link to={`/lecturers/${lecturer.id}`} title={lecturer.name}>
          <Avatar name={lecturer.name} size="md" verified={verified} />
        </Link>
        <div className="thread__id">
          <Link to={`/lecturers/${lecturer.id}`} className="thread__name">
            {lecturer.name} {verified && <VerifiedBadge small />}
          </Link>
          <span className="thread__handle">@{handle}</span>
          <span className="thread__dot">·</span>
          <span className="thread__time">{time}</span>
        </div>
        <span className={`pill ${post.type === 'ANNOUNCEMENT' ? 'pill--amber' : 'pill--blue'}`}>
          {post.type === 'ANNOUNCEMENT' ? 'Announcement' : 'Material'}
        </span>
      </div>

      <div className="thread__body">
        <p className="thread__title">{post.title}</p>
        <p className="thread__text">{post.body}</p>
        {post.link && (
          <a href={post.link} target="_blank" rel="noreferrer" className="thread__attach">
            Attachment — open material
          </a>
        )}
      </div>

      <div className="thread__actions">
        <Link to={`/lecturers/${lecturer.id}`} className="thread__action">
          View profile
        </Link>
        <Link to={`/forum/lecturers/${lecturer.id}`} className="thread__action">
          Discuss in forum
        </Link>
        {onDelete && (
          <button
            className="thread__action thread__action--danger"
            onClick={() => onDelete(post)}
          >
            Delete
          </button>
        )}
      </div>
    </article>
  );
}
