/**
 * @file PublicOnlyRoute.tsx
 * @description Ruta accesible solo sin sesión; redirige a tickets si el usuario ya está autenticado.
 */
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { accessFlagsFromUser, resolveDefaultAuthenticatedPath } from "../utils/auth-access";

interface PublicOnlyRouteProps {
  children: React.ReactNode;
}

/**
 * Renderiza hijos solo para visitantes no autenticados (p. ej. login).
 * @param props - Contenido de la ruta pública.
 * @returns `null` durante bootstrap, redirección a `/tickets` o los hijos.
 */
export default function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { isAuthenticated, isBootstrapping, user } = useAuth();

  if (isBootstrapping) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to={resolveDefaultAuthenticatedPath(accessFlagsFromUser(user))} replace />;
  }

  return <>{children}</>;
}
