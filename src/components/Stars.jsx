// Monochrome SVG star — never renders as an emoji on any platform
function StarIcon({ on }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill={on ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.3l-5.8 3.1 1.1-6.5L2.6 9.3l6.5-.9L12 2.5z" />
    </svg>
  );
}

export default function Stars({ rating = 0 }) {
  const full = Math.round(rating);
  return (
    <span className="stars" title={`${Number(rating).toFixed(1)} rating`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= full ? 'star star--on' : 'star star--off'}>
          <StarIcon on={n <= full} />
        </span>
      ))}
      {rating > 0 && <span className="stars__num">{Number(rating).toFixed(1)}</span>}
    </span>
  );
}
