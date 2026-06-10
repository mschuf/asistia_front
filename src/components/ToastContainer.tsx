/**
 * @file ToastContainer.tsx
 * @description Contenedor fijo de toasts apilados en la esquina inferior derecha.
 */
import { Toast as ToastView } from "@/components/ui/toast";
import type { Toast, ToastContainerProps } from "@/types/components/toast-container.types";

/**
 * Mapea el tipo interno de toast a la variante visual del componente UI.
 * @param type - Tipo de toast del contexto.
 * @returns Variante para ToastView.
 */
function mapVariant(type: Toast["type"]): "default" | "success" | "destructive" {
  if (type === "success") return "success";
  if (type === "error") return "destructive";
  return "default";
}

/**
 * Renderiza la pila de toasts activos.
 * @param props - Lista de toasts y callback de cierre.
 * @returns Contenedor de toasts o null si está vacío.
 */
export default function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastView
            title={toast.title}
            message={toast.message}
            variant={mapVariant(toast.type)}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}
