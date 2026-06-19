/**
 * @file PorteriaAuditReportTable.tsx
 * @description Tabla de auditoría de portería con orden por columnas.
 */
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateParts } from "@/lib/format";
import { formatPorteriaAuditActorLabel } from "@/lib/porteria-audit-state";
import { cn } from "@/lib/utils";
import type {
  PorteriaAuditLog,
  PorteriaAuditSortColumn,
  PorteriaAuditSortOrder,
} from "@/types/pages/porteria-audit-report.types";

interface PorteriaAuditReportTableProps {
  items: PorteriaAuditLog[];
  selectedId: number | null;
  sortColumn?: PorteriaAuditSortColumn | null;
  sortOrder?: PorteriaAuditSortOrder | null;
  onSortColumnChange?: (column: PorteriaAuditSortColumn) => void;
  onRowClick: (record: PorteriaAuditLog) => void;
}

const SORTABLE_COLUMNS: Array<{ id: PorteriaAuditSortColumn; label: string }> = [
  { id: "visitaId", label: "Visita" },
  { id: "occurredAt", label: "Fecha" },
  { id: "action", label: "Acción" },
  { id: "actorUserId", label: "Actor" },
  { id: "visitante", label: "Visitante" },
  { id: "documento", label: "Documento" },
];

const ACTION_LABELS: Record<PorteriaAuditLog["action"], string> = {
  "visita.created": "Registro",
  "visita.updated": "Edición",
  "visita.closed": "Cierre",
  "visita.deleted": "Eliminación",
};

const ACTION_BADGE_VARIANT: Record<
  PorteriaAuditLog["action"],
  "success" | "info" | "warning" | "danger"
> = {
  "visita.created": "success",
  "visita.updated": "info",
  "visita.closed": "warning",
  "visita.deleted": "danger",
};

function SortableHeader({
  column,
  label,
  sortColumn,
  sortOrder,
  onSortColumnChange,
}: {
  column: PorteriaAuditSortColumn;
  label: string;
  sortColumn?: PorteriaAuditSortColumn | null;
  sortOrder?: PorteriaAuditSortOrder | null;
  onSortColumnChange?: (column: PorteriaAuditSortColumn) => void;
}) {
  const isActive = sortColumn === column;
  const ariaSort = isActive ? (sortOrder === "asc" ? "ascending" : "descending") : "none";

  if (!onSortColumnChange) return <th className="px-4 py-3 font-semibold">{label}</th>;

  return (
    <th className="px-4 py-3 font-semibold" aria-sort={ariaSort}>
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1 rounded-sm text-left transition-colors",
          "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isActive ? "text-foreground" : "text-muted-foreground",
        )}
        onClick={() => onSortColumnChange(column)}
      >
        <span>{label}</span>
        {isActive && sortOrder === "asc" ? (
          <ArrowUp className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        ) : isActive && sortOrder === "desc" ? (
          <ArrowDown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden="true" />
        )}
      </button>
    </th>
  );
}

/** Tabla de auditoría, con estilo de historial y fila clickeable para detalle. */
export function PorteriaAuditReportTable({
  items,
  selectedId,
  sortColumn = null,
  sortOrder = null,
  onSortColumnChange,
  onRowClick,
}: PorteriaAuditReportTableProps) {
  if (!items.length) {
    return <EmptyState title="Sin eventos" description="No hay auditoría para los filtros actuales." />;
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-soft">
      <div className="border-b bg-muted/40 px-4 py-3 sm:px-5">
        <h2 className="text-sm font-semibold">Auditoría de visitas</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {SORTABLE_COLUMNS.map((column) => (
                <SortableHeader
                  key={column.id}
                  column={column.id}
                  label={column.label}
                  sortColumn={sortColumn}
                  sortOrder={sortOrder}
                  onSortColumnChange={onSortColumnChange}
                />
              ))}
              <th className="px-4 py-3 font-semibold">Campos</th>
              <th className="w-10 px-2 py-3" aria-hidden="true" />
            </tr>
          </thead>
          <tbody className="[&>tr:not(:last-child)>td]:border-b [&>tr:not(:last-child)>td]:border-muted-foreground/20">
            {items.map((item) => {
              const isActive = item.id === selectedId;
              const occurred = formatDateParts(item.occurredAt);
              const actorLabel = formatPorteriaAuditActorLabel(item.actorUserId, item.actorName);
              return (
                <tr
                  key={item.id}
                  className={cn(
                    "group cursor-pointer transition-colors hover:bg-muted/50",
                    isActive && "bg-primary/5 hover:bg-primary/10",
                  )}
                  onClick={() => onRowClick(item)}
                >
                  <td className="whitespace-nowrap px-4 py-3.5 font-medium text-muted-foreground">#{item.visitaId}</td>
                  <td className="px-4 py-3.5 text-muted-foreground">
                    <div className="leading-tight">
                      <span className="whitespace-nowrap">{occurred.date}</span>
                      {occurred.time ? <span className="mt-1.5 block whitespace-nowrap">{occurred.time}</span> : null}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <Badge variant={ACTION_BADGE_VARIANT[item.action]}>{ACTION_LABELS[item.action]}</Badge>
                  </td>
                  <td className="px-4 py-3.5">{actorLabel}</td>
                  <td className="px-4 py-3.5">{item.visitante ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3.5">{item.documento ?? "—"}</td>
                  <td className="px-4 py-3.5 text-muted-foreground">
                    {item.changedFields.length > 0 ? item.changedFields.slice(0, 3).join(", ") : "—"}
                  </td>
                  <td className="px-2 py-3.5 text-muted-foreground">
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 transition-transform group-hover:translate-x-0.5",
                        isActive && "text-primary",
                      )}
                      aria-hidden="true"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
