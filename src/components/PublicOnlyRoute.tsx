import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface PublicOnlyRouteProps {
  children: React.ReactNode;
}

export default function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/tickets" replace />;
  }

  return <>{children}</>;
}
