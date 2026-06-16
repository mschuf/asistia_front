/**
 * @file auth-context.types.ts
 * @description Tipos del contexto de autenticación y del proveedor AuthProvider.
 */
import type { ReactNode } from "react";
import type { AuthUser, LoginPayload, LoginResponse } from "../auth";

/** Opciones al cerrar sesión desde el contexto de autenticación. */
export interface LogoutOptions {
  /** Muestra un toast informativo tras el cierre de sesión. */
  showToast?: boolean;
}

/** Valor expuesto por AuthContext a los consumidores. */
export interface AuthContextValue {
  user: AuthUser | null;
  role: AuthUser["role"] | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  isTechnician: boolean;
  isSuperAdmin: boolean;
  isPorteriaUser: boolean;
  canAccessTickets: boolean;
  login: (payload: LoginPayload) => Promise<LoginResponse>;
  logout: (options?: LogoutOptions) => Promise<void>;
  clearSession: () => void;
}

/** Props del componente AuthProvider. */
export interface AuthProviderProps {
  children: ReactNode;
}
