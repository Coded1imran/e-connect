import { useMemo, useState } from 'react';
import { useStore } from '../context/StoreContext';
import LecturerCard from './LecturerCard';
import BookingModal from './BookingModal';
import EmptyState from './EmptyState';
import { COURSE_CATALOG } from '../data/seed';

// Searchable browsable list of lecturers — reused by /lecturers page and student dashboard
export default function BrowseLecturers({ initialQuery = '' }) {
  const { lecturers } = useStore();
  const [query, setQuery] = useState(initialQuery);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [courseFilter, setCourseFilter] = useState('all');
  const [bookingLecturer, setBookingLecturer] = useState(null);

  const allCourses = useMemo(() => {
    const set = new Set();
    lecturers.forEach((l) => l.courses?.forEach((c) => set.add(c)));
    return [...set].sort();
  }, [lecturers]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lecturers.filter((l) => {
      if (verifiedOnly && !l.verified) return false;
      if (courseFilter !== 'all' && !l.courses?.includes(courseFilter)) return false;
      if (!q) return true;
      const haystack = [
        l.name,
        l.title,
        l.department,
        l.bio,
        ...(l.courses || []),
      ]
        .join(' ')
        .toLowerCase();
      return q.split(/\s+/).every((word) => haystack.includes(word));
    });
  }, [lecturers, query, verifiedOnly, courseFilter]);

  return (
    <section className="browse">
      <div className="browse__bar card">
        <input
          className="field__input browse__search"
          placeholder="Search by name, course, department…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="field__input browse__filter"
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
        >
          <option value="all">All courses</option>
          {allCourses.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <label className="browse__check">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => setVerifiedOnly(e.target.checked)}
          />
          Verified only
        </label>
      </div>

      <p className="browse__count">
        {results.length} lecturer{results.length !== 1 ? 's' : ''} found
      </p>

      {results.length === 0 ? (
        <EmptyState
          title="No lecturers match your search"
          hint={`Try a different keyword or clear the filter. Popular: ${COURSE_CATALOG.slice(0, 3).join(', ')}`}
        />
      ) : (
        <div className="grid cards-3">
          {results.map((l) => (
            <LecturerCard key={l.id} lecturer={l} onBook={setBookingLecturer} />
          ))}
        </div>
      )}

      <BookingModal
        lecturer={bookingLecturer}
        open={!!bookingLecturer}
        onClose={() => setBookingLecturer(null)}
      />
    </section>
  );
}
