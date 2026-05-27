import { CheckCircle2, X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ToastProps {
  title: string;
  message: string;
  variant?: "success" | "default" | "destructive";
  onClose?: () => void;
  action?: ReactNode;
}

const variantStyles: Record<NonNullable<ToastProps["variant"]>, string> = {
  default: "border-border bg-card text-foreground",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200",
  destructive: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function Toast({ title, message, variant = "default", onClose, action }: ToastProps) {
  return (
    <div
      role="status"
      className={cn(
        "w-full rounded-md border p-4 shadow-2xl shadow-black/10 backdrop-blur-md",
        variantStyles[variant],
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-sm leading-6">{message}</p>
          {action ? <div>{action}</div> : null}
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            aria-label="Cerrar notificación"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
