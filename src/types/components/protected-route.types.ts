/**
 * @file protected-route.types.ts
 * @description Tipos de la ruta protegida que exige autenticación y roles opcionales.
 */
import type { ReactNode } from "react";
import type { AuthUser } from "../auth";

/** Props del componente ProtectedRoute. */
export interface ProtectedRouteProps {
  children: ReactNode;
  /** Roles permitidos; si se omite, basta con estar autenticado. */
  roles?: AuthUser["role"][];
}
