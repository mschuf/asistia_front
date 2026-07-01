/**
 * @file ErsTable.tsx
 * @description Tabla de ERS con cabeceras ordenables y acción editar para TI.
 */
import { ArrowDown, ArrowUp, ArrowUpDown, History, Pencil } from "lucide-react";
import type { ErsListItem, ErsSortColumn, ErsSortOrder } from "@/api/ers";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

const actionButtonClass =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1";
const actionIconClass = "h-4 w-4";

interface ErsTableProps {
  rows: ErsListItem[];
  isTechnician: boolean;
  sortColumn?: ErsSortColumn | null;
  sortOrder?: ErsSortOrder | null;
  onSortColumnChange?: (column: ErsSortColumn) => void;
  onEdit?: (row: ErsListItem) => void;
  onHistory?: (row: ErsListItem) => void;
}

function getSortableColumns(isTechnician: boolean): Array<{ id: ErsSortColumn; label: string }> {
  return [
    { id: "projectId", label: isTechnician ? "Proyecto" : "ID" },
    { id: "projectName", label: "Nombre proyecto" },
    { id: "ticketId", label: isTechnician ? "Ticket" : "Caso" },
    { id: "requesterName", label: "Solicitante" },
    { id: "locationName", label: "Sede" },
    { id: "stateName", label: "Estado" },
    { id: "progress", label: "Avance" },
  ];
}

function SortableHeader({
  column,
  label,
  sortColumn,
  sortOrder,
  onSortColumnChange,
}: {
  column: ErsSortColumn;
  label: string;
  sortColumn?: ErsSortColumn | null;
  sortOrder?: ErsSortOrder | null;
  onSortColumnChange?: (column: ErsSortColumn) => void;
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

/** Tabla principal de ERS. */
export function ErsTable({
  rows,
  isTechnician,
  sortColumn,
  sortOrder,
  onSortColumnChange,
  onEdit,
  onHistory,
}: ErsTableProps) {
  const sortableColumns = getSortableColumns(isTechnician);

  if (rows.length === 0) {
    return (
      <EmptyState
        title="Sin ERS"
        description="No hay proyectos ERS para los filtros aplicados."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-md border bg-card shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead className="bg-muted text-xs uppercase tracking-normal text-muted-foreground">
            <tr>
              {sortableColumns.map(({ id, label }) => (
                <SortableHeader
                  key={id}
                  column={id}
                  label={label}
                  sortColumn={sortColumn}
                  sortOrder={sortOrder}
                  onSortColumnChange={onSortColumnChange}
                />
              ))}
              <th className="px-4 py-3 font-semibold normal-case">Aprobado por</th>
              <th className="px-4 py-3 font-semibold normal-case">Creado</th>
              {isTechnician ? <th className="px-4 py-3 font-semibold">Acciones</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.projectId} className="hover:bg-muted/40">
                <td className="px-4 py-3 font-medium tabular-nums">#{row.projectId}</td>
                <td className="px-4 py-3">{row.projectName}</td>
                <td className="px-4 py-3 tabular-nums">#{row.ticketId}</td>
                <td className="px-4 py-3">{row.requesterName ?? "—"}</td>
                <td className="px-4 py-3">{row.locationName ?? "—"}</td>
                <td className="px-4 py-3">{row.projectStateName ?? "—"}</td>
                <td className="px-4 py-3">{row.progress}%</td>
                <td className="px-4 py-3">{row.approverName ?? "—"}</td>
                <td className="px-4 py-3">{formatCreatedDate(row.createdAt)}</td>
                {isTechnician ? (
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="Historial"
                        title="Historial"
                        onClick={() => onHistory?.(row)}
                        className={cn(
                          actionButtonClass,
                          "border-violet-200/80 bg-violet-50/60 text-violet-700 hover:border-violet-300 hover:bg-violet-100/80",
                          "dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-300 dark:hover:border-violet-800 dark:hover:bg-violet-950/50",
                        )}
                      >
                        <History className={actionIconClass} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        aria-label="Editar"
                        title="Editar"
                        onClick={() => onEdit?.(row)}
                        className={cn(
                          actionButtonClass,
                          "border-sky-200/80 bg-sky-50/60 text-sky-700 hover:border-sky-300 hover:bg-sky-100/80",
                          "dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300 dark:hover:border-sky-800 dark:hover:bg-sky-950/50",
                        )}
                      >
                        <Pencil className={actionIconClass} aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatCreatedDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

