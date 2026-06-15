/**
 * @file NonPorteriaUserRoute.tsx
 * @description Guard para impedir acceso a modulos generales al usuario exclusivo de Porteria.
 */
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { PORTERIA_ALLOWED_LOGIN } from "@/lib/porteria.constants";
import ProtectedRoute from "./ProtectedRoute";

interface NonPorteriaUserRouteProps {
  children: React.ReactNode;
}

/**
 * Bloquea rutas generales para el usuario reservado de Porteria.
 * @param props - Contenido hijo de la ruta.
 * @returns Children o redireccion a /porteria.
 */
export default function NonPorteriaUserRoute({ children }: NonPorteriaUserRouteProps) {
  const { user } = useAuth();
  const location = useLocation();
  const isPorteriaOnlyUser = user?.login?.toLowerCase() === PORTERIA_ALLOWED_LOGIN.toLowerCase();

  return (
    <ProtectedRoute>
      {isPorteriaOnlyUser ? (
        <Navigate to="/porteria" replace state={{ from: location.pathname }} />
      ) : (
        children
      )}
    </ProtectedRoute>
  );
}
