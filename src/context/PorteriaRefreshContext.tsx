/**
 * @file PorteriaRefreshContext.tsx
 * @description Registro de recarga por vista hija para el botón del layout de Portería.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface PorteriaRefreshContextValue {
  registerRefresh: (refresh: () => void | Promise<void>, loading: boolean) => void;
  unregisterRefresh: () => void;
  handleRefresh: () => Promise<void>;
  loading: boolean;
}

const PorteriaRefreshContext = createContext<PorteriaRefreshContextValue | null>(null);

/**
 * Provee el handler de recarga compartido del layout de Portería.
 * @param props - Contenido del layout.
 * @returns Provider con estado de recarga.
 */
export function PorteriaRefreshProvider({ children }: { children: ReactNode }) {
  const refreshRef = useRef<(() => void | Promise<void>) | null>(null);
  const [loading, setLoading] = useState(false);

  const registerRefresh = useCallback((refresh: () => void | Promise<void>, isLoading: boolean) => {
    refreshRef.current = refresh;
    setLoading(isLoading);
  }, []);

  const unregisterRefresh = useCallback(() => {
    refreshRef.current = null;
    setLoading(false);
  }, []);

  const handleRefresh = useCallback(async () => {
    await refreshRef.current?.();
  }, []);

  const value = useMemo(
    () => ({ registerRefresh, unregisterRefresh, handleRefresh, loading }),
    [registerRefresh, unregisterRefresh, handleRefresh, loading],
  );

  return <PorteriaRefreshContext.Provider value={value}>{children}</PorteriaRefreshContext.Provider>;
}

/**
 * Registra la función de recarga de la vista activa.
 * @param refresh - Callback de recarga.
 * @param loading - Indica si hay una carga en curso.
 */
export function useRegisterPorteriaRefresh(refresh: () => void | Promise<void>, loading: boolean) {
  const context = useContext(PorteriaRefreshContext);

  useEffect(() => {
    if (!context) return;
    context.registerRefresh(refresh, loading);
    return () => context.unregisterRefresh();
  }, [context, refresh, loading]);
}

/** @returns Estado de recarga del layout de Portería. */
export function usePorteriaRefresh() {
  const context = useContext(PorteriaRefreshContext);
  if (!context) {
    throw new Error("usePorteriaRefresh debe usarse dentro de PorteriaRefreshProvider.");
  }
  return context;
}
