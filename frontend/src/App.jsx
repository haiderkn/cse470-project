import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import NavBar from './components/NavBar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import TasksPage from './pages/TasksPage.jsx';
import TrainingVideosPage from './pages/TrainingVideosPage.jsx';
import CommunityPage from './pages/CommunityPage.jsx';

// Defines the page routes. The main app pages are protected; login and register are public.
export default function App() {
  const isWidePage = ['/videos', '/community'].includes(useLocation().pathname);

  return (
    <>
      <NavBar />
      <main className={isWidePage ? 'container container-wide' : 'container'}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <TasksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/videos"
            element={
              <ProtectedRoute>
                <TrainingVideosPage />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/community"
            element={
              <ProtectedRoute>
                <CommunityPage />
              </ProtectedRoute>
            }
          />
          {/* Unknown URLs go home. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
