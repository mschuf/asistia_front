/**
 * @file TicketTable.tsx
 * @description Tabla de historial de tickets con modal de detalle.
 */
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { TicketActions } from "@/components/tickets/TicketActions";
import { TicketDetailModal } from "@/components/tickets/TicketDetailModal";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateParts, formatNameParts } from "@/lib/format";
import { cn } from "@/lib/utils";
import { statusBadgeVariant, statusLabel, typeLabel } from "@/lib/tickets";
import type { AsistiaTicket, AsistiaTicketStatus } from "@/types/asistia";
import type { HistorySortColumn, HistorySortOrder } from "@/types/pages/tickets-page.types";

type TicketStatusActionId = "solved" | "closed" | "waiting";

const SORTABLE_COLUMNS: Array<{ id: HistorySortColumn; label: string }> = [
  { id: "id", label: "Ticket" },
  { id: "createdAt", label: "Apertura" },
  { id: "requester", label: "Solicitante" },
  { id: "location", label: "Ubicación" },
  { id: "type", label: "Tipo" },
  { id: "subject", label: "Título" },
  { id: "status", label: "Estado" },
  { id: "technician", label: "Asignado a" },
];

interface TicketTableProps {
  tickets: AsistiaTicket[];
  sortColumn?: HistorySortColumn | null;
  sortOrder?: HistorySortOrder | null;
  onSortColumnChange?: (column: HistorySortColumn) => void;
  onStatusChange?: (ticketId: number, status: AsistiaTicketStatus) => void;
  statusChanging?: { ticketId: number; status: AsistiaTicketStatus } | null;
  onAssignClick?: (ticket: AsistiaTicket) => void;
  assigning?: { ticketId: number } | null;
  statusActionIds?: TicketStatusActionId[];
}

/** @param props - Fecha ISO de apertura. @returns Celda con fecha y hora en dos líneas. */
function AperturaCell({ value }: { value: string | null }) {
  const { date, time } = formatDateParts(value);
  return (
    <div className="leading-tight">
      <span className="whitespace-nowrap">{date}</span>
      {time ? <span className="mt-1.5 block whitespace-nowrap">{time}</span> : null}
    </div>
  );
}

const actionsColumnClass =
  "sticky right-0 z-10 min-w-[7rem] border-l border-border/60 bg-card shadow-[-4px_0_8px_-2px_hsl(var(--border)/0.35)] md:static md:z-auto md:min-w-0 md:border-l-0 md:bg-transparent md:shadow-none";

/** @param props - Nombre completo. @returns Celda con nombre partido en dos líneas. */
function NameCell({ value }: { value: string | null | undefined }) {
  const { firstLine, secondLine } = formatNameParts(value);
  return (
    <div className="leading-tight">
      <span className="whitespace-nowrap">{firstLine}</span>
      {secondLine ? <span className="mt-1.5 block whitespace-nowrap">{secondLine}</span> : null}
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
  column: HistorySortColumn;
  label: string;
  sortColumn?: HistorySortColumn | null;
  sortOrder?: HistorySortOrder | null;
  onSortColumnChange?: (column: HistorySortColumn) => void;
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
          isActive ? "text-foreground" : "text-muted-foreground"
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
 * Tabla clickeable de tickets con acciones inline y detalle modal.
 * @param props - Lista de tickets y callbacks de estado/asignación.
 * @returns Tabla o EmptyState si no hay resultados.
 */
export function TicketTable({
  tickets,
  sortColumn = null,
  sortOrder = null,
  onSortColumnChange,
  onStatusChange,
  statusChanging = null,
  onAssignClick,
  assigning = null,
  statusActionIds,
}: TicketTableProps) {
  const showActionsColumn = Boolean(onStatusChange || onAssignClick);
  const [selectedTicket, setSelectedTicket] = useState<AsistiaTicket | null>(null);

  useEffect(() => {
    setSelectedTicket((current) => {
      if (!current) return current;
      return tickets.find((ticket) => ticket.id === current.id) ?? current;
    });
  }, [tickets]);

  /**
   * Propaga cambio de estado cerrando modal si se resuelve.
   * @param ticketId - ID del ticket.
   * @param status - Nuevo estado.
   * @returns void
   */
  const handleStatusChange = (ticketId: number, status: AsistiaTicketStatus) => {
    if (status === "solved" || status === "closed") {
      setSelectedTicket(null);
    }
    onStatusChange?.(ticketId, status);
  };

  /** @param ticket - Ticket a asignar. @returns void */
  const handleAssignClick = (ticket: AsistiaTicket) => {
    setSelectedTicket(null);
    onAssignClick?.(ticket);
  };

  if (!tickets.length) {
    return <EmptyState title="Sin tickets" description="No hay tickets para los filtros actuales." />;
  }

  return (
    <>
    <div className="overflow-hidden rounded-md border bg-card shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-separate border-spacing-0 text-left text-sm">
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
              {showActionsColumn ? (
                <th className={cn("px-4 py-3 font-semibold", actionsColumnClass, "bg-muted")}>
                  Acciones
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="[&>tr:not(:last-child)>td]:border-b [&>tr:not(:last-child)>td]:border-muted-foreground/25">
            {tickets.map((ticket) => (
              <tr
                key={ticket.id}
                className={cn(
                  "group cursor-pointer hover:bg-muted/50",
                  selectedTicket?.id === ticket.id && "bg-muted/40"
                )}
                onClick={() => setSelectedTicket(ticket)}
              >
                <td className="whitespace-nowrap px-4 py-3 font-medium">#{ticket.id}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  <AperturaCell value={ticket.createdAt} />
                </td>
                <td className="px-4 py-3">
                  <NameCell value={ticket.requester.name} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">{ticket.location?.name ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-3">{typeLabel(ticket.type)}</td>
                <td className="min-w-56 px-4 py-3">{ticket.subject}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <Badge variant={statusBadgeVariant(ticket.status)}>{statusLabel(ticket.status)}</Badge>
                </td>
                <td className="px-4 py-3">
                  <NameCell value={ticket.technician?.name} />
                </td>
                {showActionsColumn ? (
                  <td
                    className={cn(
                      "px-4 py-3",
                      actionsColumnClass,
                      "group-hover:bg-muted/50",
                      selectedTicket?.id === ticket.id && "bg-muted/40"
                    )}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <TicketActions
                      ticket={ticket}
                      onStatusChange={handleStatusChange}
                      pendingStatus={
                        statusChanging?.ticketId === Number(ticket.id) ? statusChanging.status : null
                      }
                      onAssignClick={
                        onAssignClick ? () => handleAssignClick(ticket) : undefined
                      }
                      assignPending={assigning?.ticketId === Number(ticket.id)}
                      statusActionIds={statusActionIds}
                    />
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <TicketDetailModal
      ticket={selectedTicket}
      open={selectedTicket !== null}
      onOpenChange={(open) => {
        if (!open) setSelectedTicket(null);
      }}
      onStatusChange={showActionsColumn ? handleStatusChange : undefined}
      pendingStatus={
        showActionsColumn &&
        selectedTicket &&
        statusChanging?.ticketId === Number(selectedTicket.id)
          ? statusChanging.status
          : null
      }
      onAssignClick={showActionsColumn && onAssignClick ? handleAssignClick : undefined}
      assigning={assigning}
      statusActionIds={statusActionIds}
    />
    </>
  );
}
