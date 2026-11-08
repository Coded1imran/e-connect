export default function VerifiedBadge({ small = false }) {
  return (
    <span className={small ? 'vbadge vbadge--small' : 'vbadge'} title="Verified Lecturer">
      <svg
        width={small ? 12 : 14}
        height={small ? 12 : 14}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M12 1 9.1 3.7 5.2 3l-.9 3.8L.8 8.4l1.4 3.6L.8 15.6l3.5 1.6.9 3.8 3.9-.7 2.9 2.7 2.9-2.7 3.9.7.9-3.8 3.5-1.6-1.4-3.6 1.4-3.6-3.5-1.6-.9-3.8-3.9.7L12 1zm-1.6 14.2-3.7-3.7 1.4-1.4 2.3 2.3 5-5 1.4 1.4-6.4 6.4z" />
      </svg>
      Verified
    </span>
  );
}
