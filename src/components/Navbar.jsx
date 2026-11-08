import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { APP_NAME } from '../config';
import Avatar from './Avatar';

export default function Navbar() {
  const { sessionUser, logout, isSubscriptionActive, notify } = useStore();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    notify('You have been logged out.', 'info');
    navigate('/');
  }

  return (
    <header className="nav">
      <div className="nav__inner">
        <Link to="/" className="brand">
          <span className="brand__logo">E</span>
          <span className="brand__name">{APP_NAME}</span>
        </Link>

        <nav className="nav__links">
          {sessionUser?.role === 'STUDENT' && (
            <>
              <Link to="/dashboard/student">Dashboard</Link>
              <Link to="/lecturers">Find a Lecturer</Link>
            </>
          )}
          {sessionUser?.role === 'LECTURER' && (
            <>
              <Link to="/dashboard/lecturer">Dashboard</Link>
              <Link to={`/lecturers/${sessionUser.id}`}>My Public Profile</Link>
            </>
          )}
          {!sessionUser && (
            <>
              <Link to="/lecturers">Find a Lecturer</Link>
              <Link to="/forum">Forum</Link>
              <Link to="/#how-it-works">How it works</Link>
            </>
          )}
          <Link to="/posts">Posts</Link>
          <Link to="/call-demo">Try a call</Link>
        </nav>

        <div className="nav__actions">
          {sessionUser ? (
            <>
              <Link
                to={
                  sessionUser.role === 'LECTURER' ? '/dashboard/lecturer' : '/dashboard/student'
                }
                className="nav__user"
                title={sessionUser.email}
              >
                <Avatar name={sessionUser.name} size="sm" verified={isSubscriptionActive(sessionUser)} />
                <span className="nav__username">{sessionUser.name.split(' ')[0]}</span>
              </Link>
              <button className="btn btn--ghost btn--sm" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn--ghost btn--sm">
                Log in
              </Link>
              <Link to="/register" className="btn btn--primary btn--sm">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
