/**
 * @file ToastContext.tsx
 * @description Contexto de notificaciones toast con auto-dismiss y contenedor global.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import ToastContainer from "@/components/ToastContainer";
import type { Toast } from "../types/components/toast-container.types";
import type {
  AddToastInput,
  ToastContextValue,
  ToastProviderProps
} from "../types/context/toast-context.types";

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/**
 * Genera un identificador único para cada toast.
 * @returns ID de toast basado en `crypto.randomUUID` o fallback temporal.
 */
function buildId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Proveedor de toasts con cola en memoria, temporizadores y render del contenedor.
 * @param props - Propiedades del proveedor, incluye `children`.
 * @returns Elemento React con contexto de toasts y `ToastContainer` montado.
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutMap = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  /**
   * Elimina un toast por ID y cancela su temporizador asociado.
   * @param id - Identificador del toast a remover.
   * @returns void
   */
  const removeToast = useCallback((id: string) => {
    const timeout = timeoutMap.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutMap.current.delete(id);
    }

    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  /**
   * Encola un toast y programa su cierre automático.
   * @param input - Título, mensaje, tipo y duración del toast.
   * @returns ID generado del toast insertado.
   */
  const addToast = useCallback(
    ({ title, message, type = "info", duration = 4500 }: AddToastInput): string => {
      const id = buildId();
      setToasts((prev) => [...prev, { id, title, message, type }]);

      const timeout = setTimeout(() => removeToast(id), duration);
      timeoutMap.current.set(id, timeout);

      return id;
    },
    [removeToast]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      addToast,
      /**
       * Muestra un toast de éxito.
       * @param message - Texto principal del aviso.
       * @param title - Título opcional (por defecto "Éxito").
       * @returns ID del toast creado.
       */
      success(message, title = "Éxito") {
        return addToast({ title, message, type: "success" });
      },
      /**
       * Muestra un toast de error.
       * @param message - Texto principal del aviso.
       * @param title - Título opcional (por defecto "Error").
       * @returns ID del toast creado.
       */
      error(message, title = "Error") {
        return addToast({ title, message, type: "error" });
      },
      /**
       * Muestra un toast informativo.
       * @param message - Texto principal del aviso.
       * @param title - Título opcional (por defecto "Aviso").
       * @returns ID del toast creado.
       */
      info(message, title = "Aviso") {
        return addToast({ title, message, type: "info" });
      }
    }),
    [addToast]
  );

  useEffect(
    () => () => {
      timeoutMap.current.forEach((timeoutId) => clearTimeout(timeoutId));
      timeoutMap.current.clear();
    },
    []
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * Hook para disparar y gestionar toasts desde cualquier componente hijo.
 * @returns API de toasts: `addToast`, `success`, `error` e `info`.
 * @throws {Error} Si se usa fuera de `ToastProvider`.
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe usarse dentro de ToastProvider");
  }

  return context;
}
