import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import PostCard from '../components/PostCard';
import EmptyState from '../components/EmptyState';

const TYPE_FILTERS = [
  { value: 'All', label: 'All posts' },
  { value: 'ANNOUNCEMENT', label: 'Announcements' },
  { value: 'MATERIAL', label: 'Materials' },
];

// Public feed of every lecturer post — open to everyone, no login required.
export default function PublicFeed() {
  const { posts, lecturers } = useStore();
  const [query, setQuery] = useState('');
  const [course, setCourse] = useState('all');
  const [type, setType] = useState('All');

  const courses = useMemo(() => {
    const set = new Set();
    lecturers.forEach((l) => (l.courses || []).forEach((c) => set.add(c)));
    return [...set].sort();
  }, [lecturers]);

  const lecturerById = useMemo(
    () => Object.fromEntries(lecturers.map((l) => [l.id, l])),
    [lecturers]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts
      .filter((p) => (type === 'All' ? true : p.type === type))
      .filter((p) => {
        if (course === 'all') return true;
        return lecturerById[p.lecturerId]?.courses?.includes(course);
      })
      .filter((p) => {
        if (!q) return true;
        const hay = [p.title, p.body, lecturerById[p.lecturerId]?.name]
          .join(' ')
          .toLowerCase();
        return q.split(/\s+/).every((w) => hay.includes(w));
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [posts, query, course, type, lecturerById]);

  return (
    <main className="container main-pad">
      <h1 className="page-title">Posts</h1>
      <p className="page-sub">
        Everything lecturers publish — announcements and study materials in one feed. Open to
        everyone, no account needed.
      </p>

      <div className="card feed__bar">
        <input
          className="field__input feed__search"
          placeholder="Search posts by keyword or lecturer…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="field__input feed__filter"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
        >
          <option value="all">All courses</option>
          {courses.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div className="feed__types">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t.value}
              className={type === t.value ? 'feed-type feed-type--active' : 'feed-type'}
              onClick={() => setType(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <p className="browse__count">
        {filtered.length} post{filtered.length !== 1 ? 's' : ''}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          title="No posts match your filters"
          hint="Try clearing the search, course or type filters."
        />
      ) : (
        <div className="feed-stack">
          {filtered.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}

      <div className="feed__cta card">
        <p className="muted" style={{ margin: 0, fontSize: 14 }}>
          Want to book a session with one of these lecturers?{' '}
          <Link to="/register">Create a free account</Link> or{' '}
          <Link to="/login">log in</Link> to get started.
        </p>
      </div>
    </main>
  );
}
