export default function EmptyState({ icon = null, title, hint }) {
  return (
    <div className="empty">
      {icon && <div className="empty__icon" aria-hidden="true">{icon}</div>}
      <h3 className="empty__title">{title}</h3>
      {hint && <p className="empty__hint">{hint}</p>}
    </div>
  );
}
