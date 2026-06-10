/**
 * @file MobileRefreshFab.tsx
 * @description FAB móvil de recarga flotante sobre la barra inferior.
 */
import { createPortal } from "react-dom";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileRefreshFabProps {
  visible: boolean;
  onClick: () => void;
  loading?: boolean;
}

/**
 * Botón flotante de recarga visible solo en móvil.
 * @param props - Visibilidad, callback y estado de carga.
 * @returns Portal con FAB o null.
 */
export function MobileRefreshFab({ visible, onClick, loading }: MobileRefreshFabProps) {
  if (!visible || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <Button
      type="button"
      size="icon"
      aria-label="Recargar"
      disabled={loading}
      className={cn(
        "fixed z-[60] h-11 w-11 rounded-full shadow-lg sm:hidden",
        "bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))]",
        "right-[max(1rem,env(safe-area-inset-right,0px))]",
      )}
      onClick={onClick}
    >
      <RefreshCw className={cn("h-5 w-5", loading && "animate-spin")} aria-hidden="true" />
    </Button>,
    document.body,
  );
}
