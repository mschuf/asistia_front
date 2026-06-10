/**
 * @file SuperAdminRoute.tsx
 * @description Guard de ruta exclusivo para super-administradores.
 */
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";

interface SuperAdminRouteProps {
  children: React.ReactNode;
}

/**
 * Envuelve ProtectedRoute y exige flag `isSuperAdmin`.
 * @param props - Contenido hijo de la ruta admin.
 * @returns Children o redirección a tickets.
 */
export default function SuperAdminRoute({ children }: SuperAdminRouteProps) {
  const { isSuperAdmin } = useAuth();
  const location = useLocation();

  return (
    <ProtectedRoute>
      {isSuperAdmin ? children : <Navigate to="/tickets" replace state={{ from: location.pathname }} />}
    </ProtectedRoute>
  );
}
