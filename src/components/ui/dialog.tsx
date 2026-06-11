/**
 * @file dialog.tsx
 * @description Modal accesible con bloqueo de scroll del body y soporte para contenido desbordante.
 */
import { X } from "lucide-react";
import { useEffect, useId, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

let scrollLockCount = 0;
let previousBodyOverflow = "";

/**
 * Bloquea el scroll del documento mientras hay al menos un diálogo abierto.
 */
function lockBodyScroll(): void {
  if (scrollLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  scrollLockCount += 1;
}

/**
 * Libera el bloqueo de scroll si no quedan diálogos abiertos.
 */
function unlockBodyScroll(): void {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    document.body.style.overflow = previousBodyOverflow;
  }
}

/** Props del componente Dialog. */
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  /** Evita recortar menús desplegables (p. ej. SearchableSelect) dentro del modal. */
  allowOverflow?: boolean;
}

/**
 * Modal centrado con overlay, cierre por Escape o clic fuera y etiquetas ARIA.
 * @param props - Configuración de apertura, contenido y estilos del diálogo.
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  contentClassName,
  allowOverflow = false,
}: DialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;

    lockBodyScroll();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      unlockBodyScroll();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onOpenChange, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Cerrar"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={cn(
          "relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-2xl flex-col rounded-md border bg-card shadow-soft",
          allowOverflow ? "overflow-visible" : "overflow-hidden",
          className
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
          <div className="min-w-0 space-y-1">
            <h2 id={titleId} className="text-lg font-semibold leading-tight">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label="Cerrar"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <div
          className={cn(
            "px-4 py-4 sm:px-5",
            allowOverflow ? "overflow-visible" : "min-h-0 flex-1 overflow-y-auto",
            contentClassName
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
