/**
 * @file ErsUnapprovedTasksConfirmDialog.tsx
 * @description Confirma el guardado de un proyecto no aprobado que tiene tareas en el formulario.
 */
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

interface ErsUnapprovedTasksConfirmDialogProps {
  open: boolean;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/** Advierte que las tareas del formulario no se guardarán. */
export function ErsUnapprovedTasksConfirmDialog({
  open,
  saving,
  onOpenChange,
  onConfirm,
}: ErsUnapprovedTasksConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Proyecto no aprobado"
      description="Las tareas requieren que el proyecto esté aprobado."
      className="max-w-md"
    >
      <div className="flex items-start gap-3 rounded-md border border-amber-300/70 bg-amber-50/70 p-4 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
        <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p className="text-sm leading-6">
          Si el proyecto no está aprobado no se guardará la tarea. ¿Desea continuar igual?
        </p>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
          Cancelar
        </Button>
        <Button type="button" onClick={onConfirm} disabled={saving}>
          {saving ? "Guardando..." : "Continuar igual"}
        </Button>
      </div>
    </Dialog>
  );
}
