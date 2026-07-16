/**
 * @file TicketTable.tsx
 * @description Tabla de historial de tickets con modal de detalle.
 */
import { Fragment, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown } from "lucide-react";
import { TicketActions } from "@/components/tickets/TicketActions";
import { TicketDetailModal } from "@/components/tickets/TicketDetailModal";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateParts, formatNameParts, formatOpenDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import { formatTicketTitle, statusBadgeVariant, statusLabel, typeLabel, TICKETS_HISTORIAL_LAYOUT_MIN_WIDTH_CLASS } from "@/lib/tickets";
import type { AsistiaTicket, AsistiaTicketStatus } from "@/types/asistia";
import type { HistorySortColumn, HistorySortOrder } from "@/types/pages/tickets-page.types";

type TicketStatusActionId = "solved" | "closed" | "waiting";
type HistoryTableColumn = HistorySortColumn;

const HISTORY_COLUMN_LABELS: Record<HistoryTableColumn, string> = {
  id: "Ticket",
  createdAt: "Apertura",
  openFor: "Desde",
  requester: "Solicitante",
  location: "Ubicación",
  type: "Tipo",
  subject: "Título",
  status: "Estado",
  technician: "Asignado a",
};

const HISTORY_COLUMN_ORDER_DESKTOP: HistoryTableColumn[] = [
  "id",
  "createdAt",
  "openFor",
  "requester",
  "location",
  "type",
  "subject",
  "status",
  "technician",
];

/** Mobile: estado visible temprano al hacer scroll horizontal. */
const HISTORY_COLUMN_ORDER_MOBILE: HistoryTableColumn[] = [
  "id",
  "createdAt",
  "openFor",
  "requester",
  "status",
  "type",
  "subject",
  "technician",
];

function useIsMobileHistorialLayout() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const syncLayout = () => setIsMobile(mediaQuery.matches);
    syncLayout();
    mediaQuery.addEventListener("change", syncLayout);
    return () => mediaQuery.removeEventListener("change", syncLayout);
  }, []);

  return isMobile;
}

interface TicketTableProps {
  tickets: AsistiaTicket[];
  sortColumn?: HistorySortColumn | null;
  sortOrder?: HistorySortOrder | null;
  onSortColumnChange?: (column: HistorySortColumn) => void;
  onStatusChange?: (ticketId: number, status: AsistiaTicketStatus) => void;
  statusChanging?: { ticketId: number; status: AsistiaTicketStatus } | null;
  onAssignClick?: (ticket: AsistiaTicket) => void;
  onEscalate?: (ticket: AsistiaTicket) => void;
  assigning?: { ticketId: number } | null;
  statusActionIds?: TicketStatusActionId[];
  /** Habilita edición del tag en el modal de detalle. */
  isSuperAdmin?: boolean;
  /** Propaga a la lista un ticket actualizado (p. ej. tras editar el tag). */
  onTicketUpdated?: (ticket: AsistiaTicket) => void;
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

/** @param props - Ticket mostrado en mobile. @returns Solicitante y ubicación en dos líneas. */
function MobileRequesterCell({ ticket }: { ticket: AsistiaTicket }) {
  return (
    <div className="leading-tight">
      <span className="block whitespace-nowrap">{ticket.requester.name ?? "—"}</span>
      <span className="mt-1.5 block whitespace-nowrap text-muted-foreground">
        {ticket.location?.name ?? "—"}
      </span>
    </div>
  );
}

/** @param ticket - Ticket de la fila. @param column - Columna a renderizar. @returns Contenido de celda de datos. */
function renderTicketCell(
  ticket: AsistiaTicket,
  column: HistoryTableColumn,
  isMobileLayout: boolean,
) {
  switch (column) {
    case "id":
      return <>#{ticket.id}</>;
    case "createdAt":
      return <AperturaCell value={ticket.createdAt} />;
    case "openFor": {
      const endAt =
        ticket.status === "closed"
          ? ticket.closedAt
          : ticket.status === "solved"
            ? ticket.solvedAt
            : undefined;
      return <span className="whitespace-nowrap">{formatOpenDuration(ticket.createdAt, endAt)}</span>;
    }
    case "requester":
      return isMobileLayout ? (
        <MobileRequesterCell ticket={ticket} />
      ) : (
        <NameCell value={ticket.requester.name} />
      );
    case "location":
      return <span className="line-clamp-2">{ticket.location?.name ?? "—"}</span>;
    case "type":
      return typeLabel(ticket.type);
    case "subject":
      return formatTicketTitle(ticket);
    case "status":
      return <Badge variant={statusBadgeVariant(ticket.status)}>{statusLabel(ticket.status)}</Badge>;
    case "technician":
      return <NameCell value={ticket.technician?.name} />;
  }
}

function ticketCellClassName(column: HistoryTableColumn) {
  switch (column) {
    case "id":
      return "whitespace-nowrap px-4 py-3 font-medium";
    case "createdAt":
      return "px-4 py-3 text-muted-foreground";
    case "openFor":
      return "whitespace-nowrap px-4 py-3 text-center text-muted-foreground";
    case "requester":
      return "px-4 py-3";
    case "location":
      return "max-w-xs px-4 py-3 text-muted-foreground";
    case "type":
      return "whitespace-nowrap px-4 py-3";
    case "subject":
      return "min-w-56 px-4 py-3";
    case "status":
      return "whitespace-nowrap px-4 py-3";
    case "technician":
      return "px-4 py-3";
  }
}

/** @param props - Columna, sort activo y callback. @returns Celda de cabecera ordenable. */
function SortableHeader({
  column,
  label,
  sortColumn,
  sortOrder,
  onSortColumnChange,
}: {
  column: HistoryTableColumn;
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
        <span className={cn(column === "openFor" && "whitespace-nowrap")}>{label}</span>
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
  onEscalate,
  assigning = null,
  statusActionIds,
  isSuperAdmin = false,
  onTicketUpdated,
}: TicketTableProps) {
  const showActionsColumn = Boolean(onStatusChange || onAssignClick || onEscalate);
  const isMobileLayout = useIsMobileHistorialLayout();
  const columnOrder = isMobileLayout ? HISTORY_COLUMN_ORDER_MOBILE : HISTORY_COLUMN_ORDER_DESKTOP;
  const [selectedTicket, setSelectedTicket] = useState<AsistiaTicket | null>(null);
  const [expandedTicketId, setExpandedTicketId] = useState<number | null>(null);

  /** @param ticketId - ID del ticket. @returns void */
  const toggleExpanded = (ticketId: number) => {
    setExpandedTicketId((current) => (current === ticketId ? null : ticketId));
  };

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
    return <EmptyState title="Sin casos" description="No hay casos para los filtros actuales." />;
  }

  return (
    <>
    <div className="w-full min-w-0 overflow-hidden rounded-md border bg-card shadow-soft">
      <div className="w-full min-w-0 overflow-x-auto">
        <table
          className={cn(
            "w-full border-separate border-spacing-0 text-left text-sm",
            TICKETS_HISTORIAL_LAYOUT_MIN_WIDTH_CLASS,
          )}
        >
          <thead className="bg-muted text-xs uppercase tracking-normal text-muted-foreground">
            <tr>
              <th className="w-10 px-2 py-3" aria-hidden="true" />
              {columnOrder.map((column) => (
                <SortableHeader
                  key={column}
                  column={column}
                  label={HISTORY_COLUMN_LABELS[column]}
                  sortColumn={sortColumn}
                  sortOrder={sortOrder}
                  onSortColumnChange={onSortColumnChange}
                />
              ))}
              {showActionsColumn ? (
                <th className={cn("hidden px-4 py-3 font-semibold md:table-cell", actionsColumnClass, "bg-muted")}>
                  Acciones
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="[&>tr:not(:last-child)>td]:border-b [&>tr:not(:last-child)>td]:border-muted-foreground/25 [&>tr[data-expanded-row]>td]:!border-b-0">
            {tickets.map((ticket) => {
              const isExpanded = expandedTicketId === ticket.id;
              const detailColSpan = columnOrder.length + (showActionsColumn ? 1 : 0) + 1;

              return (
              <Fragment key={ticket.id}>
              <tr
                data-expanded-row={isExpanded ? "" : undefined}
                className={cn(
                  "group cursor-pointer hover:bg-muted/50",
                  selectedTicket?.id === ticket.id && "bg-muted/40",
                  isExpanded && "bg-muted/30",
                )}
                onClick={() => setSelectedTicket(ticket)}
              >
                <td
                  className="w-10 px-2 py-3"
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    className={cn(
                      "inline-flex rounded-sm p-1 text-muted-foreground transition-colors",
                      "hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    )}
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? "Ocultar descripción" : "Mostrar descripción"}
                    onClick={() => toggleExpanded(ticket.id)}
                  >
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        isExpanded && "rotate-180"
                      )}
                      aria-hidden="true"
                    />
                  </button>
                </td>
                {columnOrder.map((column) => (
                  <td key={column} className={ticketCellClassName(column)}>
                    {renderTicketCell(ticket, column, isMobileLayout)}
                  </td>
                ))}
                {showActionsColumn ? (
                  <td
                    className={cn(
                      "hidden px-4 py-3 md:table-cell",
                      actionsColumnClass,
                      "max-md:group-hover:bg-muted md:group-hover:bg-muted/50",
                      selectedTicket?.id === ticket.id && "max-md:bg-muted md:bg-muted/40"
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
                      onEscalate={onEscalate ? () => onEscalate(ticket) : undefined}
                      assignPending={assigning?.ticketId === Number(ticket.id)}
                      statusActionIds={statusActionIds}
                    />
                  </td>
                ) : null}
              </tr>
              {isExpanded ? (
                <tr data-expanded-detail className="bg-muted/20">
                  <td
                    colSpan={detailColSpan}
                    className="border-b border-t-0 border-muted-foreground/25 px-4 py-3 align-top"
                  >
                    <div className="min-w-0 space-y-1 pl-8">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Descripción
                      </p>
                      <p className="whitespace-pre-wrap break-words text-sm text-foreground [overflow-wrap:anywhere]">
                        {ticket.description?.trim() || "Sin descripción"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : null}
              </Fragment>
            );
            })}
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
      onEscalate={showActionsColumn && onEscalate ? onEscalate : undefined}
      assigning={assigning}
      statusActionIds={statusActionIds}
      isSuperAdmin={isSuperAdmin}
      onTicketUpdated={onTicketUpdated}
    />
    </>
  );
}
