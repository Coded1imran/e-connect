import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider, useStore } from './context/StoreContext';
import CallCenter from './components/CallCenter';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { Toast } from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import LecturersPage from './pages/LecturersPage';
import LecturerProfile from './pages/LecturerProfile';
import PublicFeed from './pages/PublicFeed';
import CallDemo from './pages/CallDemo';
import ForumRooms from './pages/forum/ForumRooms';
import ForumRoom from './pages/forum/ForumRoom';
import NotFound from './pages/NotFound';
import StudentDashboard from './pages/student/StudentDashboard';
import LecturerDashboard from './pages/lecturer/LecturerDashboard';

function RouterRoot() {
  const { ready } = useStore();

  if (!ready) {
    return (
      <div className="app-loader">
        <div className="app-loader__logo">E</div>
        <p className="app-loader__text">Loading E-Connect…</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <CallCenter>
        <div className="app-shell">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/lecturers" element={<LecturersPage />} />
            <Route path="/lecturers/:id" element={<LecturerProfile />} />
            <Route path="/posts" element={<PublicFeed />} />
            <Route path="/forum" element={<ForumRooms />} />
            <Route path="/forum/lecturers/:id" element={<ForumRoom />} />
            <Route path="/call-demo" element={<CallDemo />} />
            <Route
              path="/dashboard/student"
              element={
                <ProtectedRoute role="STUDENT">
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/lecturer"
              element={
                <ProtectedRoute role="LECTURER">
                  <LecturerDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/lecturer-dashboard" element={<Navigate to="/dashboard/lecturer" replace />} />
            <Route path="/student-dashboard" element={<Navigate to="/dashboard/student" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Footer />
          <Toast />
        </div>
      </CallCenter>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <RouterRoot />
    </StoreProvider>
  );
}
