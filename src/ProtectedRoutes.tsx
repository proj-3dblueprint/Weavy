import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { User } from './types/auth.types';

export const ProtectedRoutes = ({ user }: { user: User | null }) => {
  const location = useLocation();

  if (!user) {
    // Redirect to signin page with the attempted path stored in state
    return <Navigate to="/signin" state={{ from: location.pathname }} replace />;
  }

  // If user is authenticated, render the nested routes
  return <Outlet />;
};
