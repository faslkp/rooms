import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
    <header className="border-b bg-white w-full overflow-x-hidden">
      <nav className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between w-full min-w-0">
        <Link to="/" className="text-lg font-semibold truncate">VideoChat</Link>
        <div className="flex items-center gap-4 min-w-0">
          {hasToken ? (
            <>
              <Link to="/rooms" className="text-sm text-gray-700 whitespace-nowrap">Rooms</Link>
              <span className="text-sm text-gray-500 truncate max-w-[200px]">{user?.email}</span>
              <button onClick={onLogout} className="text-sm text-red-600 whitespace-nowrap">Logout</button>
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
