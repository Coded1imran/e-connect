import { useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { cx } from '../utils/helpers';

// Global toast — rendered once in App
export function Toast() {
  const { toast, setToast } = useStore();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast) return null;
  return (
    <div className={cx('toast', `toast--${toast.type}`)} role="status">
      {toast.message}
    </div>
  );
}
