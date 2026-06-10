/**
 * @file toast-container.types.ts
 * @description Tipos del contenedor de notificaciones toast apiladas.
 */

/** Variante visual de una notificación toast. */
export type ToastType = "success" | "error" | "info";

/** Notificación individual en la cola del contenedor. */
export interface Toast {
  id: string;
  title: string;
  message: string;
  type: ToastType;
}

/** Props del componente ToastContainer. */
export interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}
