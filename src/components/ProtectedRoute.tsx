import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { AuthUser } from "../types/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: AuthUser["role"][];
}

export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, isBootstrapping, role } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (Array.isArray(roles) && roles.length > 0 && (!role || !roles.includes(role))) {
    return <Navigate to="/tickets" replace />;
  }

  return <>{children}</>;
}
