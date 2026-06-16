/**
 * @file AuthContext.tsx
 * @description Contexto de autenticación: sesión por cookies, login cifrado, bootstrap y expiración de token.
 */
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
import { accessFlagsFromUser, canAccessTickets as resolveCanAccessTickets } from "../utils/auth-access";
import { isTechnicianRole, resolveRole } from "../utils/role";
import { useLoading } from "./LoadingContext";
import { useToast } from "./ToastContext";

const LEGACY_STORAGE_KEYS = ["asistia_token", "asistia_user", "asistia_expires_at"] as const;

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Elimina claves de almacenamiento local de sesiones anteriores basadas en token.
 * @returns void
 */
function clearLegacyStorage(): void {
  for (const key of LEGACY_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
}

/**
 * Proveedor del contexto de autenticación y ciclo de vida de la sesión.
 * @param props - Propiedades del proveedor, incluye `children`.
 * @returns Elemento React con el valor de autenticación disponible para descendientes.
 */
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

    /**
     * Restaura la sesión actual consultando `/auth/me` al montar la aplicación.
     * @returns Promesa que resuelve cuando termina el bootstrap de sesión.
     */
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

  /**
   * Autentica al usuario con contraseña cifrada RSA y establece la sesión local.
   * @param credentials - Usuario y contraseña en texto plano (se cifra antes del envío).
   * @returns Respuesta del backend con datos del usuario y tiempo de expiración.
   * @throws Propaga errores de red, cifrado o respuestas fallidas de la API.
   */
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

  /**
   * Cierra la sesión en el servidor y limpia el estado local de autenticación.
   * @param options - Opciones como mostrar toast de confirmación.
   * @returns Promesa que resuelve tras redirigir a login.
   */
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
  const isPorteriaUser = Boolean(user?.isPorteriaUser);
  const canAccessTickets = resolveCanAccessTickets(accessFlagsFromUser(user));

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      isAuthenticated: Boolean(user),
      isBootstrapping,
      isTechnician: isTechnicianRole(role),
      isSuperAdmin,
      isPorteriaUser,
      canAccessTickets,
      login,
      logout,
      clearSession
    }),
    [user, role, isBootstrapping, isSuperAdmin, isPorteriaUser, canAccessTickets, login, logout, clearSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook para acceder al estado y acciones de autenticación.
 * @returns Valor del contexto con usuario, rol, flags y métodos de sesión.
 * @throws {Error} Si se usa fuera de `AuthProvider`.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return context;
}
