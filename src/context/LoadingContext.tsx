/**
 * @file LoadingContext.tsx
 * @description Contexto global de carga con contador de peticiones HTTP y backdrop visual.
 */
import { createContext, useContext, useMemo, useState } from "react";
import Backdrop from "@/components/Backdrop";
import type {
  LoadingContextValue,
  LoadingProviderProps
} from "../types/context/loading-context.types";

const LoadingContext = createContext<LoadingContextValue | undefined>(undefined);

/**
 * Proveedor que rastrea peticiones pendientes y muestra un backdrop de carga global.
 * @param props - Propiedades del proveedor, incluye `children`.
 * @returns Elemento React con contexto de carga y overlay cuando hay peticiones activas.
 */
export function LoadingProvider({ children }: LoadingProviderProps) {
  const [pendingRequests, setPendingRequests] = useState(0);

  const value = useMemo<LoadingContextValue>(
    () => ({
      /**
       * Incrementa el contador de peticiones en curso.
       * @returns void
       */
      startLoading() {
        setPendingRequests((prev) => prev + 1);
      },
      /**
       * Decrementa el contador de peticiones en curso sin bajar de cero.
       * @returns void
       */
      stopLoading() {
        setPendingRequests((prev) => (prev > 0 ? prev - 1 : 0));
      },
      isLoading: pendingRequests > 0
    }),
    [pendingRequests]
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      <Backdrop isVisible={pendingRequests > 0} />
    </LoadingContext.Provider>
  );
}

/**
 * Hook para iniciar/detener el indicador global de carga.
 * @returns Métodos `startLoading`, `stopLoading` y flag `isLoading`.
 * @throws {Error} Si se usa fuera de `LoadingProvider`.
 */
export function useLoading(): LoadingContextValue {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading debe usarse dentro de LoadingProvider");
  }

  return context;
}
