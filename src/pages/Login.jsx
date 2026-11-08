import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { DEMO_ACCOUNTS } from '../config';

export default function Login() {
  const { login, notify } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(email, password);
      notify(`Welcome back, ${user.name.split(' ')[0]}!`);
      const dest =
        location.state?.from ||
        (user.role === 'LECTURER' ? '/dashboard/lecturer' : '/dashboard/student');
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  function fillDemo(role) {
    setEmail(DEMO_ACCOUNTS[role].email);
    setPassword(DEMO_ACCOUNTS[role].password);
  }

  return (
    <main className="auth-page">
      <div className="auth card">
        <h1 className="auth__title">Welcome back</h1>
        <p className="auth__sub">Log in to your {`E-Connect`} account.</p>

        <form className="form" onSubmit={submit}>
          <div className="field">
            <label className="field__label">Email</label>
            <input
              className="field__input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="field">
            <label className="field__label">Password</label>
            <input
              className="field__input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="form__error">{error}</p>}
          <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
            {busy ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <div className="auth__demo">
          <p className="auth__demo-label">Try the demo:</p>
          <button className="btn btn--outline btn--sm" onClick={() => fillDemo('student')}>
            Student demo
          </button>
          <button className="btn btn--outline btn--sm" onClick={() => fillDemo('lecturer')}>
            Lecturer demo
          </button>
        </div>

        <p className="auth__switch">
          New to E-Connect? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </main>
  );
}
