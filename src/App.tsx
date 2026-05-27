import { Suspense, lazy } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import ProtectedRoute from "@/ProtectedRoute";
import PublicOnlyRoute from "@/PublicOnlyRoute";
import { useAuth } from "./context/AuthContext";

const AppLayout = lazy(() => import("./layouts/AppLayout"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const TicketsPage = lazy(() => import("./pages/TicketsPage"));
const AssistantPage = lazy(() => import("./pages/AssistantPage"));

export default function App() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<RouteFallback />}>
        <Routes location={location} key={location.pathname}>
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
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/tickets" replace />} />
            <Route path="tickets" element={<TicketsPage />} />
            <Route path="assistant" element={<AssistantPage />} />
          </Route>
          <Route path="*" element={<Navigate to={isAuthenticated ? "/tickets" : "/login"} replace />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-center shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">asistIA</p>
        <p className="mt-2 text-sm font-semibold text-slate-700">Cargando módulo...</p>
      </div>
    </div>
  );
}
