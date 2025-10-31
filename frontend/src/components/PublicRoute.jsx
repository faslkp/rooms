import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PublicRoute({ children }) {
  const { access, loading } = useAuth();
  if (loading) return null;
  if (access) return <Navigate to="/rooms" replace />;
  return children;
}
