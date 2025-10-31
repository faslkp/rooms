import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children }) {
  const { access, loading } = useAuth();
  if (loading) return null;
  if (!access) return <Navigate to="/login" replace />;
  return children;
}
