import type { ReactNode } from "react";
import type { AuthUser, LoginPayload, LoginResponse } from "../auth";

export interface LogoutOptions {
  showToast?: boolean;
}

export interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  role: AuthUser["role"] | null;
  isAuthenticated: boolean;
  isTechnician: boolean;
  login: (payload: LoginPayload) => Promise<LoginResponse>;
  logout: (options?: LogoutOptions) => void;
  clearSession: () => void;
}

export interface AuthProviderProps {
  children: ReactNode;
}
