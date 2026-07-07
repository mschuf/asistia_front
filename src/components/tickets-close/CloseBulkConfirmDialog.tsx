/**
 * @file CloseBulkConfirmDialog.tsx
 * @description Confirmación de cierre masivo de tickets, con la cantidad exacta seleccionada.
 */
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

interface CloseBulkConfirmDialogProps {
  open: boolean;
  count: number;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/**
 * Diálogo de confirmación previo a cerrar en bloque los tickets seleccionados.
 * @param props - Cantidad seleccionada, estado de carga y callbacks.
 * @returns Diálogo de confirmación o null sin selección activa.
 */
export function CloseBulkConfirmDialog({
  open,
  count,
  loading = false,
  onOpenChange,
  onConfirm,
}: CloseBulkConfirmDialogProps) {
  if (count === 0) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Cerrar ${count} ${count === 1 ? "ticket" : "tickets"}`}
      description="Esta acción cierra los tickets directamente en la base de datos de GLPI."
      className="max-w-md"
    >
      <div className="flex items-start gap-3 rounded-md border bg-muted/30 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-emerald-200/80 bg-emerald-50/80 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
          <Lock className="h-4 w-4" aria-hidden="true" />
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          Se marcarán como cerrados {count} {count === 1 ? "ticket" : "tickets"}. Esta acción no se
          puede deshacer.
        </p>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={loading}
          onClick={() => onOpenChange(false)}
        >
          Cancelar
        </Button>
        <Button type="button" disabled={loading} onClick={onConfirm}>
          {loading ? "Procesando…" : "Cerrar tickets"}
        </Button>
      </div>
    </Dialog>
  );
}
