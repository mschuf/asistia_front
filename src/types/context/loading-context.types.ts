/**
 * @file loading-context.types.ts
 * @description Tipos del contexto global de indicador de carga (backdrop).
 */
import type { ReactNode } from "react";

/** Valor expuesto por LoadingContext para controlar el backdrop global. */
export interface LoadingContextValue {
  startLoading: () => void;
  stopLoading: () => void;
  isLoading: boolean;
}

/** Props del componente LoadingProvider. */
export interface LoadingProviderProps {
  children: ReactNode;
}
