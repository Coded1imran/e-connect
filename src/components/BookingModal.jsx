import { useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from './Modal';
import { useStore } from '../context/StoreContext';

// Booking modal — only meaningful for logged-in students
export default function BookingModal({ lecturer, open, onClose }) {
  const { sessionUser, bookAppointment, notify } = useStore();
  const [course, setCourse] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  if (!lecturer) return null;

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      await bookAppointment({
        studentId: sessionUser.id,
        lecturerId: lecturer.id,
        course,
        date,
        time,
        note,
      });
      notify(`Appointment request sent to ${lecturer.name}.`);
      setCourse('');
      setDate('');
      setTime('09:00');
      setNote('');
      onClose();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Book appointment — ${lecturer.name}`}>
      {!sessionUser ? (
        <div className="booking-login">
          <p>Please log in as a student to book an appointment.</p>
          <Link to="/login" className="btn btn--primary">
            Go to login
          </Link>
        </div>
      ) : sessionUser.role !== 'STUDENT' ? (
        <p>Only students can book appointments with lecturers.</p>
      ) : (
        <form className="form" onSubmit={submit}>
          <div className="field">
            <label className="field__label">Course</label>
            <select
              className="field__input"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              required
            >
              <option value="" disabled>
                Choose a course…
              </option>
              {lecturer.courses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="field-row">
            <div className="field">
              <label className="field__label">Date</label>
              <input
                type="date"
                className="field__input"
                value={date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label className="field__label">Time</label>
              <input
                type="time"
                className="field__input"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="field">
            <label className="field__label">What do you need help with?</label>
            <textarea
              className="field__input"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. I'm stuck on recursion and past questions…"
            />
          </div>
          {error && <p className="form__error">{error}</p>}
          <button className="btn btn--primary" type="submit">
            Send booking request
          </button>
          <p className="form__hint">
            The lecturer will confirm or decline — you'll see the status on your dashboard.
          </p>
        </form>
      )}
    </Modal>
  );
}
