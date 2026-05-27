import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, configureApiClient } from "../api/apiClient";
import { useTokenTimer } from "../hooks/useTokenTimer";
import type { AuthUser, LoginPayload, LoginResponse } from "../types/auth";
import type {
  AuthContextValue,
  AuthProviderProps,
  LogoutOptions
} from "../types/context/auth-context.types";
import { parseExpiresInSeconds } from "../utils/parseExpiresIn";
import { isTechnicianRole, resolveRole } from "../utils/role";
import { useLoading } from "./LoadingContext";
import { useToast } from "./ToastContext";

const TOKEN_STORAGE_KEY = "asistia_token";
const USER_STORAGE_KEY = "asistia_user";
const EXPIRES_AT_STORAGE_KEY = "asistia_expires_at";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readUserFromStorage(): AuthUser | null {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
  const { startLoading, stopLoading } = useLoading();
  const toast = useToast();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => readUserFromStorage());
  const [expiresAt, setExpiresAt] = useState<number | null>(() => {
    const raw = localStorage.getItem(EXPIRES_AT_STORAGE_KEY);
    return raw ? Number(raw) : null;
  });

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    setExpiresAt(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(EXPIRES_AT_STORAGE_KEY);
  }, []);

  const saveSession = useCallback((accessToken: string, expiresIn: string, sessionUser: AuthUser) => {
    const expiry = Date.now() + parseExpiresInSeconds(expiresIn) * 1000;
    setToken(accessToken);
    setUser(sessionUser);
    setExpiresAt(expiry);
    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(sessionUser));
    localStorage.setItem(EXPIRES_AT_STORAGE_KEY, String(expiry));
  }, []);

  const handleSessionExpired = useCallback(() => {
    if (!token) return;
    clearSession();
    toast.error("Tu token expiró. Volvé a iniciar sesión.", "Sesión expirada");
    navigate("/login", { replace: true });
  }, [token, clearSession, toast, navigate]);

  useTokenTimer(expiresAt, handleSessionExpired);

  useLayoutEffect(() => {
    configureApiClient({
      getTokenFn: () => token,
      onRequestStartFn: startLoading,
      onRequestEndFn: stopLoading,
      onUnauthorizedFn: () => handleSessionExpired()
    });
  }, [token, startLoading, stopLoading, handleSessionExpired]);

  const login = useCallback(
    async ({ username, password }: LoginPayload): Promise<LoginResponse> => {
      const response = await apiClient.post<LoginResponse>(
        "/auth/login",
        { username, password },
        { auth: false, timeoutMs: 15000 }
      );

      saveSession(response.accessToken, response.expiresIn, response.user);
      return response;
    },
    [saveSession]
  );

  const logout = useCallback(
    ({ showToast = false }: LogoutOptions = {}) => {
      clearSession();
      if (showToast) {
        toast.info("La sesión se cerró correctamente.");
      }
      navigate("/login", { replace: true });
    },
    [clearSession, navigate, toast]
  );

  const role = resolveRole(user);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      role,
      isAuthenticated: Boolean(token && user),
      isTechnician: isTechnicianRole(role),
      login,
      logout,
      clearSession
    }),
    [token, user, role, login, logout, clearSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return context;
}
