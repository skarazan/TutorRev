import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function AdminRoute() {
  const { isAdmin, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
