/**

 * @file App.tsx

 * @description Enrutamiento principal de la aplicación con rutas públicas, protegidas y lazy loading.

 */

import { Suspense, lazy } from "react";

import { Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "@/components/ProtectedRoute";

import PublicOnlyRoute from "@/components/PublicOnlyRoute";

import PorteriaRoute from "@/components/PorteriaRoute";

import TicketsRoute from "@/components/TicketsRoute";

import SuperAdminRoute from "@/components/SuperAdminRoute";

import { Loading } from "@/components/ui/loading";

import { useAuth } from "./context/AuthContext";
import { accessFlagsFromUser, resolveDefaultAuthenticatedPath } from "./utils/auth-access";



const AppShellLayout = lazy(() => import("./layouts/AppShellLayout"));

const PorteriaLayout = lazy(() => import("./layouts/PorteriaLayout"));

const PorteriaIndicadoresPage = lazy(() => import("./pages/PorteriaIndicadoresPage"));

const PorteriaHistorialPage = lazy(() => import("./pages/PorteriaHistorialPage"));

const LoginPage = lazy(() => import("./pages/LoginPage"));

const TicketsPage = lazy(() => import("./pages/TicketsPage"));

const AssistantPage = lazy(() => import("./pages/AssistantPage"));

const PersonasPage = lazy(() => import("./pages/PersonasPage"));

const VisitasPage = lazy(() => import("./pages/VisitasPage"));

const EmpresasPage = lazy(() => import("./pages/EmpresasPage"));

const PromptsPage = lazy(() => import("./pages/PromptsPage"));

const TicketCreatedReportPage = lazy(() => import("./pages/TicketCreatedReportPage"));

const PorteriaReportPage = lazy(() => import("./pages/PorteriaReportPage"));
const PorteriaAuditReportPage = lazy(() => import("./pages/PorteriaAuditReportPage"));



/**

 * Componente raíz con definición de rutas y guards de autenticación.

 * @returns Árbol de rutas de React Router con carga diferida por página.

 */

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

            path="porteria"

            element={

              <PorteriaRoute>

                <PorteriaLayout />

              </PorteriaRoute>

            }

          >

            <Route index element={<PorteriaIndicadoresPage />} />

            <Route path="historial" element={<PorteriaHistorialPage />} />

            <Route path="visitas" element={<VisitasPage />} />

            <Route path="personas" element={<PersonasPage />} />

          </Route>

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

            path="admin/reporte-tickets"

            element={

              <SuperAdminRoute>

                <TicketCreatedReportPage />

              </SuperAdminRoute>

            }

          />

          <Route

            path="admin/reporte-porteria"

            element={

              <SuperAdminRoute>

                <PorteriaReportPage />

              </SuperAdminRoute>

            }

          />

          <Route

            path="admin/reporte-porteria-auditoria"

            element={

              <SuperAdminRoute>

                <PorteriaAuditReportPage />

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

