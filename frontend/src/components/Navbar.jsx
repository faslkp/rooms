import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Derive auth presence from localStorage to avoid brief stale state
  let hasToken = false;
  try {
    const raw = localStorage.getItem('auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      hasToken = !!parsed?.access;
    }
  } catch {}

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="border-b bg-white">
      <nav className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-lg font-semibold">VideoChat</Link>
        <div className="flex items-center gap-4">
          {hasToken ? (
            <>
              <Link to="/rooms" className="text-sm text-gray-700">Rooms</Link>
              <span className="text-sm text-gray-500">{user?.email}</span>
              <button onClick={onLogout} className="text-sm text-red-600">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-700">Login</Link>
              <Link to="/register" className="text-sm text-gray-700">Register</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
