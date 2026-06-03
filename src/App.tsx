import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicOnlyRoute from "@/components/PublicOnlyRoute";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "./context/AuthContext";

const AppShellLayout = lazy(() => import("./layouts/AppShellLayout"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const TicketsPage = lazy(() => import("./pages/TicketsPage"));
const AssistantPage = lazy(() => import("./pages/AssistantPage"));
const MailTestPage = lazy(() => import("./pages/MailTestPage"));

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppShellLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/tickets" replace />} />
          <Route path="tickets" element={<TicketsPage />} />
          <Route path="assistant" element={<AssistantPage />} />
          <Route path="mail/test" element={<MailTestPage />} />
        </Route>
        <Route path="*" element={<Navigate to={isAuthenticated ? "/tickets" : "/login"} replace />} />
      </Routes>
    </Suspense>
  );
}

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Loading label="Cargando módulo..." />
    </div>
  );
}
