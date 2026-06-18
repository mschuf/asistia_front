/**
 * @file PorteriaRoute.tsx
 * @description Guard de ruta exclusivo para usuarios del grupo GLPI portería.
 */
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";

interface PorteriaRouteProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

/**
 * Envuelve ProtectedRoute y exige flag `isPorteriaUser`.
 * @param props - Contenido hijo de la ruta portería.
 * @returns Children o redirección a tickets.
 */
export default function PorteriaRoute({
  children,
  fallbackPath = "/irs",
}: PorteriaRouteProps) {
  const { isPorteriaUser } = useAuth();
  const location = useLocation();

  return (
    <ProtectedRoute>
      {isPorteriaUser ? (
        children
      ) : (
        <Navigate to={fallbackPath} replace state={{ from: location.pathname }} />
      )}
    </ProtectedRoute>
  );
}
