/**
 * @file empty-state.tsx
 * @description Placeholder visual para listas o secciones sin contenido.
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Props del componente EmptyState. */
interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Presenta un estado vacío con título, descripción y acción opcional.
 * @param props - Textos, acción y clases del contenedor.
 */
export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-40 flex-col items-center justify-center rounded-md border border-dashed border-border bg-card p-6 text-center",
        className,
      )}
    >
      <h3 className="text-base font-semibold">{title}</h3>
      {description ? <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
