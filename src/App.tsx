/**
 * @file App.tsx
 * @description Enrutamiento principal de la aplicación con rutas públicas, protegidas y lazy loading.
 */
import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicOnlyRoute from "@/components/PublicOnlyRoute";
import NonPorteriaUserRoute from "@/components/NonPorteriaUserRoute";
import SingleUserRoute from "@/components/SingleUserRoute";
import SuperAdminRoute from "@/components/SuperAdminRoute";
import { Loading } from "@/components/ui/loading";
import { PORTERIA_ALLOWED_LOGIN } from "@/lib/porteria.constants";
import { useAuth } from "./context/AuthContext";

const AppShellLayout = lazy(() => import("./layouts/AppShellLayout"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const TicketsPage = lazy(() => import("./pages/TicketsPage"));
const AssistantPage = lazy(() => import("./pages/AssistantPage"));
const PorteriaPage = lazy(() => import("./pages/PorteriaPage"));
const EmpresasPage = lazy(() => import("./pages/EmpresasPage"));
const PromptsPage = lazy(() => import("./pages/PromptsPage"));
const TicketCreatedReportPage = lazy(() => import("./pages/TicketCreatedReportPage"));

/**
 * Componente raíz con definición de rutas y guards de autenticación.
 * @returns Árbol de rutas de React Router con carga diferida por página.
 */
export default function App() {
  const { isAuthenticated, user } = useAuth();
  const isPorteriaUser = user?.login?.toLowerCase() === PORTERIA_ALLOWED_LOGIN.toLowerCase();

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
          <Route index element={<Navigate to={isPorteriaUser ? "/porteria" : "/tickets"} replace />} />
          <Route
            path="tickets"
            element={
              <NonPorteriaUserRoute>
                <TicketsPage />
              </NonPorteriaUserRoute>
            }
          />
          <Route
            path="assistant"
            element={
              <NonPorteriaUserRoute>
                <AssistantPage />
              </NonPorteriaUserRoute>
            }
          />
          <Route
            path="porteria"
            element={
              <SingleUserRoute allowedLogin={PORTERIA_ALLOWED_LOGIN}>
                <PorteriaPage />
              </SingleUserRoute>
            }
          />
          <Route
            path="admin/empresas"
            element={
              <NonPorteriaUserRoute>
                <SuperAdminRoute>
                  <EmpresasPage />
                </SuperAdminRoute>
              </NonPorteriaUserRoute>
            }
          />
          <Route
            path="admin/prompts"
            element={
              <NonPorteriaUserRoute>
                <SuperAdminRoute>
                  <PromptsPage />
                </SuperAdminRoute>
              </NonPorteriaUserRoute>
            }
          />
          <Route
            path="admin/reporte-tickets"
            element={
              <NonPorteriaUserRoute>
                <SuperAdminRoute>
                  <TicketCreatedReportPage />
                </SuperAdminRoute>
              </NonPorteriaUserRoute>
            }
          />
        </Route>
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? (isPorteriaUser ? "/porteria" : "/tickets") : "/login"} replace />}
        />
      </Routes>
    </Suspense>
  );
}

/**
 * Pantalla de espera mostrada mientras se cargan módulos con `React.lazy`.
 * @returns Contenedor centrado con indicador de carga.
 */
function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Loading label="Cargando módulo..." />
    </div>
  );
}
