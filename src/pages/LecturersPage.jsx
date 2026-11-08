import BrowseLecturers from '../components/BrowseLecturers';

export default function LecturersPage() {
  return (
    <main className="container main-pad">
      <h1 className="page-title">Find a Lecturer</h1>
      <p className="page-sub">
        Search by course, department or name, then book an appointment that fits your schedule.
      </p>
      <BrowseLecturers />
    </main>
  );
}
