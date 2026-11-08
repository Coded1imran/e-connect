import { Navigate, useLocation } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export default function ProtectedRoute({ children, role }) {
  const { sessionUser } = useStore();
  const location = useLocation();

  if (!sessionUser) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (role && sessionUser.role !== role) {
    return (
      <Navigate
        to={sessionUser.role === 'LECTURER' ? '/dashboard/lecturer' : '/dashboard/student'}
        replace
      />
    );
  }
  return children;
}
