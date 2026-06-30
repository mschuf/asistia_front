/**
 * @file ErsTaskDeleteConfirmDialog.tsx
 * @description Diálogo de confirmación para eliminar una tarea del proyecto ERS.
 */
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ErsTaskDeleteConfirmDialogProps {
  open: boolean;
  taskLabel: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/** Diálogo modal de confirmación de eliminación de tarea ERS. */
export function ErsTaskDeleteConfirmDialog({
  open,
  taskLabel,
  onOpenChange,
  onConfirm,
}: ErsTaskDeleteConfirmDialogProps) {
  if (!taskLabel) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Eliminar "${taskLabel}"`}
      description="Esta acción quitará la tarea del proyecto. Deberás guardar los cambios para aplicarla en GLPI."
      className="max-w-md"
    >
      <div className="flex items-start gap-3 rounded-md border bg-muted/30 p-4">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border",
            "border-red-200/80 bg-red-50/80 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300",
          )}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          La tarea dejará de formar parte del proyecto y el avance se recalculará al guardar. Esta
          acción no se puede deshacer desde esta pantalla.
        </p>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button
          type="button"
          onClick={onConfirm}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          Eliminar tarea
        </Button>
      </div>
    </Dialog>
  );
}
