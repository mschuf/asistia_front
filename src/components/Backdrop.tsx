/**
 * @file Backdrop.tsx
 * @description Overlay global de carga durante peticiones HTTP.
 */
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackdropProps {
  isVisible: boolean;
}

/**
 * Muestra overlay semitransparente con spinner mientras hay peticiones en curso.
 * @param props - Flag de visibilidad.
 * @returns Overlay de carga o null.
 */
export default function Backdrop({ isVisible }: BackdropProps) {
  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-[1px]"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={cn("flex items-center gap-3 rounded-md border bg-card px-4 py-3 shadow-soft")}>
        <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
        <span className="text-sm font-medium text-foreground">Cargando...</span>
      </div>
    </div>
  );
}
