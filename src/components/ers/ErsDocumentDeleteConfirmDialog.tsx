/**
 * @file ErsDocumentDeleteConfirmDialog.tsx
 * @description Confirmación visual para eliminar definitivamente un documento ERS.
 */
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Props {
  documentName: string | null;
  deleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ErsDocumentDeleteConfirmDialog({
  documentName,
  deleting,
  onOpenChange,
  onConfirm,
}: Props) {
  return (
    <Dialog
      open={Boolean(documentName)}
      onOpenChange={(open) => { if (!deleting) onOpenChange(open); }}
      title="Eliminar documento adjunto"
      description={`¿Deseás eliminar “${documentName ?? ""}”?`}
      className="max-w-md"
    >
      <div className="flex items-start gap-3 rounded-md border border-destructive/20 bg-destructive/5 p-4">
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full border", "border-red-200/80 bg-red-50/80 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300")}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          El archivo se eliminará definitivamente de GLPI. Esta acción no se puede deshacer.
        </p>
      </div>
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" disabled={deleting} onClick={() => onOpenChange(false)}>Cancelar</Button>
        <Button type="button" disabled={deleting} onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
          {deleting ? "Eliminando..." : "Eliminar documento"}
        </Button>
      </div>
    </Dialog>
  );
}
