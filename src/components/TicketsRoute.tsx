/**
 * @file TicketsRoute.tsx
 * @description Guard de ruta que excluye usuarios solo del grupo GLPI portería.
 */
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";

interface TicketsRouteProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

/**
 * Envuelve ProtectedRoute y exige acceso al módulo de tickets.
 * @param props - Contenido hijo de la ruta de tickets.
 * @returns Children o redirección a portería.
 */
export default function TicketsRoute({
  children,
  fallbackPath = "/porteria",
}: TicketsRouteProps) {
  const { canAccessTickets } = useAuth();
  const location = useLocation();

  return (
    <ProtectedRoute>
      {canAccessTickets ? (
        children
      ) : (
        <Navigate to={fallbackPath} replace state={{ from: location.pathname }} />
      )}
    </ProtectedRoute>
  );
}
