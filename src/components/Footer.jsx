import { Link } from 'react-router-dom';
import { APP_NAME, PRICE_LABEL } from '../config';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <span className="brand">
            <span className="brand__logo">E</span>
            <span className="brand__name">{APP_NAME}</span>
          </span>
          <p>
            Connecting students with the right lecturers — book appointments, get materials, learn
            better.
          </p>
        </div>
        <div className="footer__col">
          <h4>Platform</h4>
          <Link to="/lecturers">Find a Lecturer</Link>
          <Link to="/register?role=lecturer">Become a Lecturer</Link>
          <Link to="/register">Create Account</Link>
        </div>
        <div className="footer__col">
          <h4>For Lecturers</h4>
          <span>Verified badge — {PRICE_LABEL}</span>
          <span>Post announcements &amp; materials</span>
          <span>Manage appointment requests</span>
        </div>
      </div>
      <div className="footer__bottom">© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</div>
    </footer>
  );
}
