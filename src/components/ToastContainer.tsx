import { Toast as ToastView } from "@/components/ui/toast";
import type { Toast, ToastContainerProps } from "@/types/components/toast-container.types";

function mapVariant(type: Toast["type"]): "default" | "success" | "destructive" {
  if (type === "success") return "success";
  if (type === "error") return "destructive";
  return "default";
}

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
