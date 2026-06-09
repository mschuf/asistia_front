import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";

interface SuperAdminRouteProps {
  children: React.ReactNode;
}

export default function SuperAdminRoute({ children }: SuperAdminRouteProps) {
  const { isSuperAdmin } = useAuth();
  const location = useLocation();

  return (
    <ProtectedRoute>
      {isSuperAdmin ? children : <Navigate to="/tickets" replace state={{ from: location.pathname }} />}
    </ProtectedRoute>
  );
}
