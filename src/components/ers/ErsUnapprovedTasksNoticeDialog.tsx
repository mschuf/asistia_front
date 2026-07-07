/**
 * @file ErsUnapprovedTasksNoticeDialog.tsx
 * @description Aviso informativo al ingresar a tareas en un ERS no aprobado.
 */
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

interface ErsUnapprovedTasksNoticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Informa que las tareas no se guardarán mientras el proyecto no esté aprobado. */
export function ErsUnapprovedTasksNoticeDialog({
  open,
  onOpenChange,
}: ErsUnapprovedTasksNoticeDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Proyecto no aprobado"
      className="max-w-md"
    >
      <div className="flex items-start gap-3 rounded-md border border-amber-300/70 bg-amber-50/70 p-4 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
        <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p className="text-sm leading-6">
          Si el proyecto no está aprobado, las tareas no se guardarán.
        </p>
      </div>

      <div className="mt-6 flex justify-end">
        <Button type="button" onClick={() => onOpenChange(false)}>
          Entendido
        </Button>
      </div>
    </Dialog>
  );
}
