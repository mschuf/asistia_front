/**
 * @file VisitasTable.tsx
 * @description Tabla de visitas con orden por columnas.
 */
import { ArrowDown, ArrowUp, ArrowUpDown, LogOut, Pencil, Trash2 } from "lucide-react";
import type { Visita, VisitaSortColumn, VisitaSortOrder } from "@/api/visitas";
import { VISITA_ESTADO_LABELS, isVisitaEliminable, requiereCancelacionAlEliminar } from "@/api/visitas";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  isVisitaTarjetaColor,
  VISITA_TARJETA_COLOR_LABELS,
  type VisitaTarjetaColor,
} from "@/lib/visita-tarjeta-color";
import { cn } from "@/lib/utils";

interface VisitasTableProps {
  rows: Visita[];
  sortColumn?: VisitaSortColumn | null;
  sortOrder?: VisitaSortOrder | null;
  onSortColumnChange?: (column: VisitaSortColumn) => void;
  onEdit: (visita: Visita) => void;
  onFinalizar: (visita: Visita) => void;
  onDelete: (visita: Visita) => void;
}

const SORTABLE_COLUMNS: Array<{ id: VisitaSortColumn; label: string }> = [
  { id: "id", label: "Visita" },
  { id: "visitante", label: "Visitante" },
  { id: "documento", label: "Documento" },
  { id: "empresa", label: "Empresa" },
  { id: "motivo", label: "Motivo" },
  { id: "responsable", label: "Responsable" },
  { id: "estado", label: "Estado" },
  { id: "entradaAt", label: "Entrada" },
  { id: "salidaAt", label: "Salida" },
];

const TARJETA_SWATCH_CLASS: Record<VisitaTarjetaColor, string> = {
  rojo: "bg-red-500 ring-red-300/60 dark:bg-red-600 dark:ring-red-700/45",
  amarillo: "bg-amber-400 ring-amber-300/60 dark:bg-amber-500 dark:ring-amber-700/45",
  verde: "bg-emerald-500 ring-emerald-300/60 dark:bg-emerald-600 dark:ring-emerald-700/45",
};

const ESTADO_VARIANT: Record<Visita["estado"], "info" | "success" | "warning" | "danger"> = {
  programada: "info",
  activa: "success",
  sin_salida: "danger",
  finalizada: "warning",
  cancelada: "danger",
};

const actionIconButtonClass =
  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40";

function formatTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TarjetaColorCell({ color }: { color: VisitaTarjetaColor | null }) {
  if (!isVisitaTarjetaColor(color)) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn("h-3.5 w-3.5 shrink-0 rounded-full ring-1", TARJETA_SWATCH_CLASS[color])}
        aria-hidden
      />
      <span>{VISITA_TARJETA_COLOR_LABELS[color]}</span>
    </span>
  );
}

function SortableHeader({
  column,
  label,
  sortColumn,
  sortOrder,
  onSortColumnChange,
}: {
  column: VisitaSortColumn;
  label: string;
  sortColumn?: VisitaSortColumn | null;
  sortOrder?: VisitaSortOrder | null;
  onSortColumnChange?: (column: VisitaSortColumn) => void;
}) {
  const isActive = sortColumn === column;
  const ariaSort = isActive ? (sortOrder === "asc" ? "ascending" : "descending") : "none";

  if (!onSortColumnChange) {
    return <th className="px-4 py-3 font-semibold">{label}</th>;
  }

  return (
    <th className="px-4 py-3 font-semibold" aria-sort={ariaSort}>
      <button
        type="button"
        onClick={() => onSortColumnChange(column)}
        className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
      >
        <span>{label}</span>
        {isActive ? (
          sortOrder === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" aria-hidden="true" />
        )}
      </button>
    </th>
  );
}

/** Tabla ordenable de visitas con acciones CRUD. */
export function VisitasTable({
  rows,
  sortColumn,
  sortOrder,
  onSortColumnChange,
  onEdit,
  onFinalizar,
  onDelete,
}: VisitasTableProps) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="Sin visitas"
        description="No hay visitas registradas o no coinciden con los filtros aplicados."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-md border bg-card shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1280px] border-collapse text-left text-sm">
          <thead className="bg-muted text-xs uppercase tracking-normal text-muted-foreground">
            <tr>
              {SORTABLE_COLUMNS.map(({ id, label }) => (
                <SortableHeader
                  key={id}
                  column={id}
                  label={label}
                  sortColumn={sortColumn}
                  sortOrder={sortOrder}
                  onSortColumnChange={onSortColumnChange}
                />
              ))}
              <th className="px-4 py-3 font-semibold">Nº tarjeta</th>
              <th className="px-4 py-3 font-semibold">Color tarjeta</th>
              <th className="px-4 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((visita) => (
              <tr key={visita.id} className="hover:bg-muted/40">
                <td className="px-4 py-3 tabular-nums">{visita.id}</td>
                <td className="px-4 py-3 font-medium">{visita.visitante}</td>
                <td className="px-4 py-3">{visita.documento}</td>
                <td className="px-4 py-3">{visita.empresa ?? "—"}</td>
                <td className="px-4 py-3">{visita.motivo}</td>
                <td className="px-4 py-3">{visita.responsableNombre}</td>
                <td className="px-4 py-3">
                  <Badge variant={ESTADO_VARIANT[visita.estado]}>{VISITA_ESTADO_LABELS[visita.estado]}</Badge>
                </td>
                <td className="px-4 py-3 whitespace-nowrap tabular-nums">{formatTime(visita.entradaAt)}</td>
                <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                  {visita.estado === "activa" ? (
                    <span className="inline-block w-full text-center">-</span>
                  ) : (
                    formatTime(visita.salidaAt)
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums">{visita.credencialNumero ?? "—"}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <TarjetaColorCell color={visita.tarjetaColor} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-nowrap items-center gap-1.5">
                    <button
                      type="button"
                      aria-label="Editar"
                      title="Editar"
                      onClick={() => onEdit(visita)}
                      className={cn(actionIconButtonClass, "border-border hover:bg-muted")}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    {visita.estado === "activa" || visita.estado === "sin_salida" ? (
                      <button
                        type="button"
                        aria-label="Finalizar visita"
                        title="Finalizar visita"
                        onClick={() => onFinalizar(visita)}
                        className={cn(actionIconButtonClass, "border-red-300 text-red-700 hover:bg-red-50")}
                      >
                        <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    ) : null}
                    {isVisitaEliminable(visita.estado) ? (
                      <button
                        type="button"
                        aria-label={requiereCancelacionAlEliminar(visita.estado) ? "Eliminar visita activa" : "Eliminar"}
                        title={requiereCancelacionAlEliminar(visita.estado) ? "Eliminar visita activa" : "Eliminar"}
                        onClick={() => onDelete(visita)}
                        className={cn(actionIconButtonClass, "border-red-300 text-red-700 hover:bg-red-50")}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
