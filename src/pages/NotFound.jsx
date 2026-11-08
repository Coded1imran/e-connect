import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="auth-page">
      <div className="auth card" style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: 56, margin: 0 }}>404</h1>
        <p className="auth__sub">We couldn't find that page.</p>
        <Link to="/" className="btn btn--primary">
          Back to home
        </Link>
      </div>
    </main>
  );
}
