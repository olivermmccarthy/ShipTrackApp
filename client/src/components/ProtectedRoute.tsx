import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { staff, loading } = useAuth();

  if (loading) {
    return <p className="hint">Checking session…</p>;
  }

  if (!staff) {
    return <Navigate to="/staff/login" replace />;
  }

  return <>{children}</>;
}
