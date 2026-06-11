/**
 * @file TicketCreatedReportTable.tsx
 * @description Tabla del reporte superadmin de logs ticket.created.
 */
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateParts } from "@/lib/format";
import { cn } from "@/lib/utils";
import { TICKET_TYPE_LABELS } from "@/lib/constants";
import type { TicketCreatedLog } from "@/types/pages/ticket-created-report.types";
import type {
  TicketCreatedReportSortColumn,
  TicketCreatedReportSortOrder,
} from "@/types/pages/ticket-created-report.types";

const TABLE_COLUMNS: Array<{ label: string; id: TicketCreatedReportSortColumn }> = [
  { label: "Fecha creación", id: "createdAt" },
  { label: "Empresa", id: "company" },
  { label: "Asunto", id: "subject" },
  { label: "Remitente", id: "fromAddress" },
  { label: "Solicitante", id: "requesterEmail" },
  { label: "Tipo", id: "type" },
  { label: "Categoría", id: "category" },
  { label: "Correo enviado", id: "mailSent" },
  { label: "HTTP status", id: "httpStatus" },
];

interface TicketCreatedReportTableProps {
  items: TicketCreatedLog[];
  sortColumn?: TicketCreatedReportSortColumn | null;
  sortOrder?: TicketCreatedReportSortOrder | null;
  onSortColumnChange?: (column: TicketCreatedReportSortColumn) => void;
}

/** @param props - Fecha ISO. @returns Celda con fecha y hora en dos líneas. */
function CreatedAtCell({ value }: { value: string }) {
  const { date, time } = formatDateParts(value);
  return (
    <div className="leading-tight">
      <span className="whitespace-nowrap">{date}</span>
      {time ? <span className="mt-1.5 block whitespace-nowrap">{time}</span> : null}
    </div>
  );
}

/** @param props - Columna, sort activo y callback. @returns Celda de cabecera ordenable. */
function SortableHeader({
  column,
  label,
  sortColumn,
  sortOrder,
  onSortColumnChange,
}: {
  column: TicketCreatedReportSortColumn;
  label: string;
  sortColumn?: TicketCreatedReportSortColumn | null;
  sortOrder?: TicketCreatedReportSortOrder | null;
  onSortColumnChange?: (column: TicketCreatedReportSortColumn) => void;
}) {
  const isActive = sortColumn === column;
  const ariaSort = isActive
    ? sortOrder === "asc"
      ? "ascending"
      : "descending"
    : "none";

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

/** @param value - Tipo crudo del log. @returns Etiqueta legible o valor original. */
function typeLabel(value: string | null): string {
  if (!value) return "—";
  return TICKET_TYPE_LABELS[value as keyof typeof TICKET_TYPE_LABELS] ?? value;
}

/**
 * Tabla de solo lectura del reporte ticket.created.
 * @param props - Lista de logs y callbacks de ordenación.
 * @returns Tabla o EmptyState si no hay resultados.
 */
export function TicketCreatedReportTable({
  items,
  sortColumn = null,
  sortOrder = null,
  onSortColumnChange,
}: TicketCreatedReportTableProps) {
  if (!items.length) {
    return (
      <EmptyState
        title="Sin registros"
        description="No hay tickets creados por IA para los filtros actuales."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-md border bg-card shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-separate border-spacing-0 text-left text-sm">
          <thead className="bg-muted text-xs uppercase tracking-normal text-muted-foreground">
            <tr>
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
            </tr>
          </thead>
          <tbody className="[&>tr:not(:last-child)>td]:border-b [&>tr:not(:last-child)>td]:border-muted-foreground/25">
            {items.map((item, index) => (
              <tr key={`${item.createdAt}-${item.company}-${index}`} className="hover:bg-muted/50">
                <td className="px-4 py-3 text-muted-foreground">
                  <CreatedAtCell value={item.createdAt} />
                </td>
                <td className="px-4 py-3">{item.company}</td>
                <td className="min-w-56 px-4 py-3">{item.subject ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.fromAddress ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{item.requesterEmail ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-3">{typeLabel(item.type)}</td>
                <td className="min-w-48 px-4 py-3">{item.category ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-3">{item.mailSent ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-3">{item.httpStatus ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
