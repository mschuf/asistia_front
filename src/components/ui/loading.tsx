/**
 * @file loading.tsx
 * @description Indicador de carga con icono animado y etiqueta personalizable.
 */
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Props del componente Loading. */
interface LoadingProps {
  label?: string;
  className?: string;
}

/**
 * Muestra un spinner con texto de estado para operaciones en curso.
 * @param props - Etiqueta visible y clases adicionales del contenedor.
 */
export function Loading({ label = "Cargando", className }: LoadingProps) {
  return (
    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
