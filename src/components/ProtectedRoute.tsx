/**
 * @file ProtectedRoute.tsx
 * @description Guard de ruta que exige autenticación y roles opcionales.
 */
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { AuthUser } from "../types/auth";
import { accessFlagsFromUser, resolveDefaultAuthenticatedPath } from "../utils/auth-access";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: AuthUser["role"][];
}

/**
 * Redirige a login o tickets si el usuario no cumple autenticación/rol.
 * @param props - Contenido hijo y roles permitidos opcionales.
 * @returns Children o redirección.
 */
export default function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, isBootstrapping, role, user } = useAuth();
  const location = useLocation();
  const defaultPath = resolveDefaultAuthenticatedPath(accessFlagsFromUser(user));

  if (isBootstrapping) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (Array.isArray(roles) && roles.length > 0 && (!role || !roles.includes(role))) {
    return <Navigate to={defaultPath} replace />;
  }

  return <>{children}</>;
}
