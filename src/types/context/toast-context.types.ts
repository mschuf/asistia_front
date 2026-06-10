/**
 * @file toast-context.types.ts
 * @description Tipos del contexto global de notificaciones toast.
 */
import type { ReactNode } from "react";
import type { ToastType } from "../components/toast-container.types";

/** Datos para encolar una notificación toast. */
export interface AddToastInput {
  title: string;
  message: string;
  type?: ToastType;
  /** Duración en milisegundos antes de auto-ocultar; omitir para persistir. */
  duration?: number;
}

/** API del contexto de toasts disponible vía hook. */
export interface ToastContextValue {
  addToast: (input: AddToastInput) => string;
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
}

/** Props del componente ToastProvider. */
export interface ToastProviderProps {
  children: ReactNode;
}
