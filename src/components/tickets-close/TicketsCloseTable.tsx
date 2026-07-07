/**
 * @file TicketsCloseTable.tsx
 * @description Tabla de candidatos a cierre masivo: selección, orden y acceso a detalle (super admin).
 */
import { ArrowDown, ArrowUp, ArrowUpDown, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateParts } from "@/lib/format";
import { statusBadgeVariant, statusLabel } from "@/lib/tickets";
import { cn } from "@/lib/utils";
import type { AsistiaTicket } from "@/types/asistia";
import type {
  TicketsCloseSortColumn,
  TicketsCloseSortOrder,
} from "@/types/pages/tickets-close.types";

const TABLE_COLUMNS: Array<{ label: string; id: TicketsCloseSortColumn }> = [
  { label: "Ticket", id: "id" },
  { label: "Apertura", id: "createdAt" },
  { label: "Asunto", id: "subject" },
  { label: "Solicitante", id: "requester" },
  { label: "Ubicación", id: "location" },
  { label: "Estado", id: "status" },
];

interface TicketsCloseTableProps {
  items: AsistiaTicket[];
  selectedIds: Set<number>;
  onToggleRow: (id: number) => void;
  onToggleAllVisible: () => void;
  onViewDetail: (id: number) => void;
  sortColumn?: TicketsCloseSortColumn | null;
  sortOrder?: TicketsCloseSortOrder | null;
  onSortColumnChange?: (column: TicketsCloseSortColumn) => void;
}

/** @param props - Fecha ISO de apertura. @returns Celda con fecha y hora en dos líneas. */
function CreatedAtCell({ value }: { value: string | null }) {
  const { date, time } = formatDateParts(value);
  return (
    <div className="leading-tight">
      <span className="whitespace-nowrap">{date}</span>
      {time ? <span className="mt-1.5 block whitespace-nowrap">{time}</span> : null}
    </div>
  );
}

/** @param props - Columna, sort activo y callback. @returns Celda de cabecera ordenable (DESC → ASC → reset). */
function SortableHeader({
  column,
  label,
  sortColumn,
  sortOrder,
  onSortColumnChange,
}: {
  column: TicketsCloseSortColumn;
  label: string;
  sortColumn?: TicketsCloseSortColumn | null;
  sortOrder?: TicketsCloseSortOrder | null;
  onSortColumnChange?: (column: TicketsCloseSortColumn) => void;
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

/**
 * Tabla de candidatos a cierre masivo con checkbox por fila, orden y botón de detalle.
 * @param props - Items, selección activa y callbacks de selección/orden/detalle.
 * @returns Tabla o EmptyState si no hay resultados.
 */
export function TicketsCloseTable({
  items,
  selectedIds,
  onToggleRow,
  onToggleAllVisible,
  onViewDetail,
  sortColumn = null,
  sortOrder = null,
  onSortColumnChange,
}: TicketsCloseTableProps) {
  if (!items.length) {
    return (
      <EmptyState
        title="Sin resultados"
        description="No hay tickets candidatos a cierre para los filtros actuales."
      />
    );
  }

  const visibleIds = items.map((item) => item.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someSelected = !allSelected && visibleIds.some((id) => selectedIds.has(id));

  return (
    <div className="overflow-hidden rounded-md border bg-card shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-separate border-spacing-0 text-left text-sm">
          <thead className="bg-muted text-xs uppercase tracking-normal text-muted-foreground">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  aria-label="Seleccionar todos los tickets visibles"
                  checked={allSelected}
                  ref={(element) => {
                    if (element) element.indeterminate = someSelected;
                  }}
                  onChange={onToggleAllVisible}
                />
              </th>
              {TABLE_COLUMNS.map((column) => (
                <SortableHeader
                  key={column.id}
                  column={column.id}
                  label={column.label}
                  sortColumn={sortColumn}
                  sortOrder={sortOrder}
                  onSortColumnChange={onSortColumnChange}
                />
              ))}
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="[&>tr:not(:last-child)>td]:border-b [&>tr:not(:last-child)>td]:border-muted-foreground/25">
            {items.map((item) => (
              <tr
                key={item.id}
                className={cn("hover:bg-muted/50", selectedIds.has(item.id) && "bg-muted/40")}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label={`Seleccionar ticket #${item.id}`}
                    checked={selectedIds.has(item.id)}
                    onChange={() => onToggleRow(item.id)}
                  />
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-medium">#{item.id}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  <CreatedAtCell value={item.createdAt} />
                </td>
                <td className="min-w-56 px-4 py-3">{item.subject}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.requester.name ?? "—"}</td>
                <td className="min-w-40 px-4 py-3">{item.location?.name ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <Badge variant={statusBadgeVariant(item.status)}>{statusLabel(item.status)}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Ver detalle del ticket #${item.id}`}
                    onClick={() => onViewDetail(item.id)}
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
