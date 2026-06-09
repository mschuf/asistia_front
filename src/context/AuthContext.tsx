import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, configureApiClient } from "../api/apiClient";
import { useTokenTimer } from "../hooks/useTokenTimer";
import type { AuthUser, LoginPayload, LoginResponse, SessionResponse } from "../types/auth";
import type {
  AuthContextValue,
  AuthProviderProps,
  LogoutOptions
} from "../types/context/auth-context.types";
import { clearAuthPublicKeyCache, encryptPassword, loadAuthPublicKey } from "../utils/crypto";
import { parseExpiresInSeconds } from "../utils/parseExpiresIn";
import { isTechnicianRole, resolveRole } from "../utils/role";
import { useLoading } from "./LoadingContext";
import { useToast } from "./ToastContext";

const LEGACY_STORAGE_KEYS = ["asistia_token", "asistia_user", "asistia_expires_at"] as const;

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function clearLegacyStorage(): void {
  for (const key of LEGACY_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate();
  const { startLoading, stopLoading } = useLoading();
  const toast = useToast();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const clearSession = useCallback(() => {
    setUser(null);
    setExpiresAt(null);
    clearAuthPublicKeyCache();
  }, []);

  const applySession = useCallback((sessionUser: AuthUser, sessionExpiresAt: number) => {
    setUser(sessionUser);
    setExpiresAt(sessionExpiresAt);
  }, []);

  const handleSessionExpired = useCallback(() => {
    if (!user) return;
    clearSession();
    toast.error("Tu token expiró. Volvé a iniciar sesión.", "Sesión expirada");
    navigate("/login", { replace: true });
  }, [user, clearSession, toast, navigate]);

  useTokenTimer(expiresAt, handleSessionExpired);

  useLayoutEffect(() => {
    configureApiClient({
      onRequestStartFn: startLoading,
      onRequestEndFn: stopLoading,
      onUnauthorizedFn: () => handleSessionExpired()
    });
  }, [startLoading, stopLoading, handleSessionExpired]);

  useEffect(() => {
    clearLegacyStorage();

    let cancelled = false;

    async function bootstrapSession(): Promise<void> {
      try {
        const session = await apiClient.get<SessionResponse>("/auth/me", {
          showBackdrop: false,
          timeoutMs: 10000
        });
        if (!cancelled) {
          applySession(session.user, session.expiresAt);
        }
      } catch {
        if (!cancelled) {
          clearSession();
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false);
        }
      }
    }

    void bootstrapSession();

    return () => {
      cancelled = true;
    };
  }, [applySession, clearSession]);

  const login = useCallback(
    async ({ username, password }: LoginPayload): Promise<LoginResponse> => {
      await loadAuthPublicKey(async () => {
        const response = await apiClient.get<{ publicKey: string }>("/auth/public-key", {
          auth: false,
          showBackdrop: false,
          timeoutMs: 10000
        });
        return response.publicKey;
      });

      const encryptedPassword = await encryptPassword(password);
      const response = await apiClient.post<LoginResponse>(
        "/auth/login",
        { username, encryptedPassword },
        { auth: false, timeoutMs: 15000 }
      );

      const expiry = Date.now() + parseExpiresInSeconds(response.expiresIn) * 1000;
      applySession(response.user, expiry);
      return response;
    },
    [applySession]
  );

  const logout = useCallback(
    async ({ showToast = false }: LogoutOptions = {}) => {
      try {
        await apiClient.post("/auth/logout", undefined, { showBackdrop: false, timeoutMs: 10000 });
      } catch {
        // Si la cookie ya expiró, igual limpiamos el estado local.
      }

      clearSession();
      if (showToast) {
        toast.info("La sesión se cerró correctamente.");
      }
      navigate("/login", { replace: true });
    },
    [clearSession, navigate, toast]
  );

  const role = resolveRole(user);
  const isSuperAdmin = Boolean(user?.isSuperAdmin);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      isAuthenticated: Boolean(user),
      isBootstrapping,
      isTechnician: isTechnicianRole(role),
      isSuperAdmin,
      login,
      logout,
      clearSession
    }),
    [user, role, isBootstrapping, isSuperAdmin, login, logout, clearSession]
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
