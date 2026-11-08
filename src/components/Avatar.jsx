export default function Avatar({ name, size = 'md', verified = false }) {
  const letters = (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  return (
    <span className={`avatar avatar--${size}`}>
      {letters}
      {verified && <span className="avatar__check" title="Verified lecturer">✓</span>}
    </span>
  );
}
