import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/useAuth.js';

function GuestRoute() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default GuestRoute;
