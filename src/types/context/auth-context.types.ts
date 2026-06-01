import type { ReactNode } from "react";
import type { AuthUser, LoginPayload, LoginResponse } from "../auth";

export interface LogoutOptions {
  showToast?: boolean;
}

export interface AuthContextValue {
  user: AuthUser | null;
  role: AuthUser["role"] | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  isTechnician: boolean;
  login: (payload: LoginPayload) => Promise<LoginResponse>;
  logout: (options?: LogoutOptions) => Promise<void>;
  clearSession: () => void;
}

export interface AuthProviderProps {
  children: ReactNode;
}
