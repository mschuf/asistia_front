/**
 * @file PromptConfirmDialog.tsx
 * @description Diálogo de confirmación para eliminar un prompt definitivamente.
 */
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Prompt } from "@/api/prompts";

interface PromptConfirmDialogProps {
  open: boolean;
  prompt: Prompt | null;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/**
 * Diálogo modal de confirmación de eliminación de prompt.
 * @param props - Prompt objetivo, estado de carga y callbacks.
 * @returns Diálogo de confirmación o null sin prompt.
 */
export function PromptConfirmDialog({
  open,
  prompt,
  loading = false,
  onOpenChange,
  onConfirm,
}: PromptConfirmDialogProps) {
  if (!prompt) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Eliminar prompt de "${prompt.companyName}"`}
      description="Esta acción es definitiva y no se puede deshacer."
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
          Se eliminará la instrucción del sistema y la plantilla asociadas a esta empresa. El daemon
          de correo dejará de tener prompts configurados para ella.
        </p>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" disabled={loading} onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button
          type="button"
          disabled={loading}
          onClick={onConfirm}
          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          {loading ? "Procesando…" : "Eliminar definitivamente"}
        </Button>
      </div>
    </Dialog>
  );
}
