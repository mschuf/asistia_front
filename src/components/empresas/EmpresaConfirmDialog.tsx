/**
 * @file EmpresaConfirmDialog.tsx
 * @description Diálogo de confirmación para activar, desactivar o eliminar empresas.
 */
import { Power, Trash2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { Empresa } from "@/api/empresas";

export type EmpresaConfirmAction = "deactivate" | "activate" | "delete";

interface EmpresaConfirmDialogProps {
  open: boolean;
  action: EmpresaConfirmAction | null;
  empresa: Empresa | null;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

const actionConfig: Record<
  EmpresaConfirmAction,
  {
    title: (name: string) => string;
    description: string;
    confirmLabel: string;
    icon: LucideIcon;
    iconClassName: string;
    confirmClassName: string;
  }
> = {
  deactivate: {
    title: (name) => `Desactivar "${name}"`,
    description: "La empresa quedará inactiva. Podés reactivarla cuando quieras.",
    confirmLabel: "Desactivar",
    icon: Power,
    iconClassName:
      "border-amber-200/80 bg-amber-50/80 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200",
    confirmClassName:
      "bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600",
  },
  activate: {
    title: (name) => `Activar "${name}"`,
    description: "La empresa volverá a estar operativa en el sistema.",
    confirmLabel: "Activar",
    icon: Power,
    iconClassName:
      "border-emerald-200/80 bg-emerald-50/80 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200",
    confirmClassName:
      "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600",
  },
  delete: {
    title: (name) => `Eliminar "${name}"`,
    description: "Esta acción es definitiva y no se puede deshacer.",
    confirmLabel: "Eliminar definitivamente",
    icon: Trash2,
    iconClassName:
      "border-red-200/80 bg-red-50/80 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300",
    confirmClassName: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  },
};

/**
 * Diálogo modal de confirmación de acciones destructivas sobre empresas.
 * @param props - Acción, empresa, estado de carga y callbacks.
 * @returns Diálogo de confirmación o null sin acción/empresa.
 */
export function EmpresaConfirmDialog({
  open,
  action,
  empresa,
  loading = false,
  onOpenChange,
  onConfirm,
}: EmpresaConfirmDialogProps) {
  if (!action || !empresa) return null;

  const config = actionConfig[action];
  const Icon = config.icon;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={config.title(empresa.name)}
      description={config.description}
      className="max-w-md"
    >
      <div className="flex items-start gap-3 rounded-md border bg-muted/30 p-4">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border",
            config.iconClassName,
          )}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          {action === "delete"
            ? "Se eliminarán credenciales Microsoft, configuración del daemon y todo el registro asociado."
            : action === "activate"
              ? "Los procesos que dependan de esta empresa podrán volver a usar su configuración."
              : "No se borran datos; solo cambia el estado operativo a inactivo."}
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
          className={config.confirmClassName}
        >
          {loading ? "Procesando…" : config.confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
