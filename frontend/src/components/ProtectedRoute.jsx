import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute() {
  const { token, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}
