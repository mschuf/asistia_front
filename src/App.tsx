/**
 * @file App.tsx
 * @description Enrutamiento principal de la aplicación con rutas públicas, protegidas y lazy loading.
 */
import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import PublicOnlyRoute from "@/components/PublicOnlyRoute";
import TicketsRoute from "@/components/TicketsRoute";
import SuperAdminRoute from "@/components/SuperAdminRoute";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "./context/AuthContext";
import { accessFlagsFromUser, resolveDefaultAuthenticatedPath } from "./utils/auth-access";

const AppShellLayout = lazy(() => import("./layouts/AppShellLayout"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const TicketsPage = lazy(() => import("./pages/TicketsPage"));
const AssistantPage = lazy(() => import("./pages/AssistantPage"));
const EmpresasPage = lazy(() => import("./pages/EmpresasPage"));
const PromptsPage = lazy(() => import("./pages/PromptsPage"));
const TicketCreatedReportPage = lazy(() => import("./pages/TicketCreatedReportPage"));
const TicketsCloseBulkPage = lazy(() => import("./pages/TicketsCloseBulkPage"));
const ErsPage = lazy(() => import("./pages/ErsPage"));
const ErsIndicatorsPage = lazy(() => import("./pages/ErsIndicatorsPage"));
const NuevoErsPage = lazy(() => import("./pages/NuevoErsPage"));
const EscalarTicketErsPage = lazy(() => import("./pages/EscalarTicketErsPage"));
const ErsEditPage = lazy(() => import("./pages/ErsEditPage"));
const ErsHistoryPage = lazy(() => import("./pages/ErsHistoryPage"));
const RequestTypesPage = lazy(() => import("./pages/RequestTypesPage"));

export default function App() {
  const { isAuthenticated, user } = useAuth();
  const defaultAuthenticatedPath = resolveDefaultAuthenticatedPath(accessFlagsFromUser(user));

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
          <Route
            path='ers/indicadores'
            element={
              <TicketsRoute>
                <ErsIndicatorsPage />
              </TicketsRoute>
            }
          />
          <Route index element={<Navigate to={defaultAuthenticatedPath} replace />} />
          <Route
            path="irs"
            element={
              <TicketsRoute>
                <TicketsPage />
              </TicketsRoute>
            }
          />
          <Route
            path="assistant"
            element={
              <TicketsRoute>
                <AssistantPage />
              </TicketsRoute>
            }
          />
          <Route
            path="ers"
            element={
              <TicketsRoute>
                <ErsPage />
              </TicketsRoute>
            }
          />
          <Route
            path="ers/nuevo"
            element={
              <TicketsRoute>
                <NuevoErsPage />
              </TicketsRoute>
            }
          />
          <Route
            path="ers/escalar/:ticketId"
            element={
              <TicketsRoute>
                <EscalarTicketErsPage />
              </TicketsRoute>
            }
          />
          <Route
            path="ers/:projectId/editar"
            element={
              <TicketsRoute>
                <ErsEditPage />
              </TicketsRoute>
            }
          />
          <Route
            path="ers/:projectId/historial"
            element={
              <TicketsRoute>
                <ErsHistoryPage />
              </TicketsRoute>
            }
          />
          <Route
            path="admin/software"
            element={
              <SuperAdminRoute>
                <RequestTypesPage />
              </SuperAdminRoute>
            }
          />
          <Route
            path="admin/empresas"
            element={
              <SuperAdminRoute>
                <EmpresasPage />
              </SuperAdminRoute>
            }
          />
          <Route
            path="admin/prompts"
            element={
              <SuperAdminRoute>
                <PromptsPage />
              </SuperAdminRoute>
            }
          />
          <Route
            path="admin/reporte-irs"
            element={
              <SuperAdminRoute>
                <TicketCreatedReportPage />
              </SuperAdminRoute>
            }
          />
          <Route
            path="admin/cierre-tickets"
            element={
              <SuperAdminRoute>
                <TicketsCloseBulkPage />
              </SuperAdminRoute>
            }
          />
        </Route>

        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? defaultAuthenticatedPath : "/login"} replace />}
        />
      </Routes>
    </Suspense>
  );
}

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Loading label="Cargando modulo..." />
    </div>
  );
}

