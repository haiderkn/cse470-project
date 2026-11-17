import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        🐾 PetCare <span className="brand-accent">Hub</span>
      </Link>
      <div className="nav-links">
        {user ? (
          <>
            <Link to="/" className="nav-item">🐾 Pets & Profile</Link>
            <Link to="/tasks" className="nav-item">📋 Tasks</Link>
            <span className="user-pill">👤 {user.name}</span>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
