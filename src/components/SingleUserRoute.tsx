/**
 * @file SingleUserRoute.tsx
 * @description Guard de ruta para habilitar acceso a un unico login.
 */
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";

interface SingleUserRouteProps {
  children: React.ReactNode;
  allowedLogin: string;
  fallbackPath?: string;
}

/**
 * Permite el acceso solo si el login autenticado coincide con el permitido.
 * @param props - Nodo hijo y login habilitado.
 * @returns Children o redireccion.
 */
export default function SingleUserRoute({
  children,
  allowedLogin,
  fallbackPath = "/tickets",
}: SingleUserRouteProps) {
  const { user } = useAuth();
  const location = useLocation();
  const currentLogin = user?.login?.toLowerCase() ?? "";
  const expectedLogin = allowedLogin.toLowerCase();

  return (
    <ProtectedRoute>
      {currentLogin === expectedLogin ? (
        children
      ) : (
        <Navigate to={fallbackPath} replace state={{ from: location.pathname }} />
      )}
    </ProtectedRoute>
  );
}
