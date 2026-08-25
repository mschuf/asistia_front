/**
 * @file TicketAttachmentDeleteConfirmDialog.tsx
 * @description Confirmación para eliminar un adjunto de un ticket.
 */
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

interface TicketAttachmentDeleteConfirmDialogProps {
  /** Nombre del archivo a eliminar; `null` mantiene el diálogo cerrado. */
  filename: string | null;
  deleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/**
 * Pide confirmación antes de eliminar definitivamente un adjunto del caso.
 * @param props - Archivo objetivo, estado de borrado y callbacks.
 * @returns Diálogo de confirmación.
 */
export function TicketAttachmentDeleteConfirmDialog({
  filename,
  deleting,
  onOpenChange,
  onConfirm,
}: TicketAttachmentDeleteConfirmDialogProps) {
  return (
    <Dialog
      open={Boolean(filename)}
      onOpenChange={(open) => {
        if (!deleting) onOpenChange(open);
      }}
      title="Eliminar adjunto"
      description={`¿Deseás eliminar “${filename ?? ""}”?`}
      className="max-w-md"
    >
      <div className="flex items-start gap-3 rounded-md border border-destructive/20 bg-destructive/5 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-200/80 bg-red-50/80 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          El archivo se eliminará definitivamente de asistIA y no se podrá recuperar. La
          eliminación queda registrada en el Histórico del ticket en GLPI.
        </p>
      </div>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={deleting}
          onClick={() => onOpenChange(false)}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          disabled={deleting}
          onClick={onConfirm}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          )}
          {deleting ? "Eliminando..." : "Eliminar adjunto"}
        </Button>
      </div>
    </Dialog>
  );
}
