import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import ChipInput from '../components/ChipInput';
import { COURSE_CATALOG } from '../data/seed';

const LEVELS = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Postgraduate'];

export default function Register() {
  const { register, notify } = useStore();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [role, setRole] = useState(params.get('role') === 'lecturer' ? 'LECTURER' : 'STUDENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [title, setTitle] = useState('Lecturer');
  const [department, setDepartment] = useState('');
  const [bio, setBio] = useState('');
  const [courses, setCourses] = useState([]);
  const [level, setLevel] = useState('Year 1');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      const user = await register({
        role,
        name,
        email,
        password,
        title,
        department,
        bio,
        courses,
        level,
      });
      notify(`Welcome to E-Connect, ${user.name.split(' ')[0]}!`);
      navigate(user.role === 'LECTURER' ? '/dashboard/lecturer' : '/dashboard/student', {
        replace: true,
      });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth auth--wide card">
        <h1 className="auth__title">Create your account</h1>
        <p className="auth__sub">Join E-Connect as a student or a lecturer.</p>

        {/* Role picker */}
        <div className="role-picker">
          <button
            type="button"
            className={role === 'STUDENT' ? 'role role--active' : 'role'}
            onClick={() => setRole('STUDENT')}
          >
            <strong>I'm a Student</strong>
            <span className="role__desc">Find lecturers and book appointments</span>
          </button>
          <button
            type="button"
            className={role === 'LECTURER' ? 'role role--active' : 'role'}
            onClick={() => setRole('LECTURER')}
          >
            <strong>I'm a Lecturer</strong>
            <span className="role__desc">Get bookings and share materials</span>
          </button>
        </div>

        <form className="form" onSubmit={submit}>
          <div className="field-row">
            <div className="field">
              <label className="field__label">Full name</label>
              <input
                className="field__input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'LECTURER' ? 'Dr. John Doe' : 'Jane Doe'}
                required
              />
            </div>
            <div className="field">
              <label className="field__label">{role === 'LECTURER' ? 'Academic title' : 'Level'}</label>
              {role === 'LECTURER' ? (
                <input
                  className="field__input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior Lecturer"
                />
              ) : (
                <select className="field__input" value={level} onChange={(e) => setLevel(e.target.value)}>
                  {LEVELS.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="field-row">
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
                placeholder="At least 6 characters"
                required
              />
            </div>
          </div>

          {role === 'LECTURER' && (
            <>
              <div className="field">
                <label className="field__label">Department / Faculty</label>
                <input
                  className="field__input"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science"
                  required
                />
              </div>
              <ChipInput
                label="Courses you specialize in"
                chips={courses}
                onChange={setCourses}
                placeholder="Type a course and press Enter…"
                suggestions={COURSE_CATALOG}
              />
              <div className="field">
                <label className="field__label">Short bio (optional)</label>
                <textarea
                  className="field__input"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell students about your teaching style and experience…"
                />
              </div>
            </>
          )}

          {error && <p className="form__error">{error}</p>}
          <button className="btn btn--primary btn--block" type="submit">
            Create account{role === 'LECTURER' ? ' as lecturer' : ' as student'}
          </button>
        </form>

        <p className="auth__switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </main>
  );
}
