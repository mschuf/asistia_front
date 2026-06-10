/**
 * @file toast.tsx
 * @description Notificación inline con variantes visuales, icono y acción opcional.
 */
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Props del componente Toast. */
interface ToastProps {
  title: string;
  message: string;
  variant?: "success" | "default" | "destructive";
  onClose?: () => void;
  /** Contenido interactivo adicional (p. ej. un botón de acción). */
  action?: ReactNode;
}

const variantStyles: Record<NonNullable<ToastProps["variant"]>, string> = {
  default:
    "border-sky-200/80 bg-sky-50/95 text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-100",
  success:
    "border-emerald-200/80 bg-emerald-50/95 text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100",
  destructive:
    "border-red-200/80 bg-red-50/95 text-red-950 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100",
};

const variantIcons: Record<NonNullable<ToastProps["variant"]>, LucideIcon> = {
  default: Info,
  success: CheckCircle2,
  destructive: AlertTriangle,
};

/**
 * Muestra una notificación accesible con título, mensaje y variante de color.
 * @param props - Textos, variante visual y callbacks del toast.
 */
export function Toast({ title, message, variant = "default", onClose, action }: ToastProps) {
  const Icon = variantIcons[variant];

  return (
    <div
      role="status"
      className={cn(
        "w-full rounded-lg border p-4 shadow-2xl shadow-black/10 backdrop-blur-md",
        variantStyles[variant],
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-sm leading-6 opacity-90">{message}</p>
          {action ? <div>{action}</div> : null}
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
            aria-label="Cerrar notificación"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
