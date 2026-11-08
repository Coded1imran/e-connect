export default function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className={wide ? 'modal modal--wide' : 'modal'}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal__head">
          <h3 className="modal__title">{title}</h3>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}
