import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import PublicRoute from './components/PublicRoute.jsx';
import Navbar from './components/Navbar.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Rooms from './pages/Rooms.jsx';
import RoomDetail from './pages/RoomDetail.jsx';

function AppRoutes() {
  const { loading } = useAuth();
  if (loading) return null;
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Navbar />
      <div className="flex-1 overflow-hidden min-h-0">
        <div className="h-full overflow-y-auto overflow-x-hidden">
          <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        <Route
          path="/rooms"
          element={
            <PrivateRoute>
              <Rooms />
            </PrivateRoute>
          }
        />
        <Route
          path="/rooms/:id"
          element={
            <PrivateRoute>
              <RoomDetail />
            </PrivateRoute>
          }
        />

        <Route path="/" element={<Navigate to="/rooms" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="h-screen w-screen bg-gray-50 text-gray-900 overflow-hidden flex flex-col">
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
