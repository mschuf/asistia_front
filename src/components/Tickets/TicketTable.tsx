import { useEffect, useState } from "react";
import { TicketActions } from "@/components/Tickets/TicketActions";
import { TicketDetailModal } from "@/components/Tickets/TicketDetailModal";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { statusBadgeVariant, statusLabel, typeLabel } from "@/lib/tickets";
import type { AsistiaTicket, AsistiaTicketStatus } from "@/types/asistia";

interface TicketTableProps {
  tickets: AsistiaTicket[];
  onStatusChange?: (ticketId: number, status: AsistiaTicketStatus) => void;
  statusChanging?: { ticketId: number; status: AsistiaTicketStatus } | null;
}

export function TicketTable({ tickets, onStatusChange, statusChanging = null }: TicketTableProps) {
  const [selectedTicket, setSelectedTicket] = useState<AsistiaTicket | null>(null);

  useEffect(() => {
    setSelectedTicket((current) => {
      if (!current) return current;
      return tickets.find((ticket) => ticket.id === current.id) ?? current;
    });
  }, [tickets]);

  if (!tickets.length) {
    return <EmptyState title="Sin tickets" description="No hay tickets para los filtros actuales." />;
  }

  return (
    <>
    <div className="overflow-hidden rounded-md border bg-card shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-left text-sm">
          <thead className="bg-muted text-xs uppercase tracking-normal text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Ticket</th>
              <th className="px-4 py-3 font-semibold">Apertura</th>
              <th className="px-4 py-3 font-semibold">Tipo</th>
              <th className="px-4 py-3 font-semibold">Título</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Asignado a</th>
              <th className="px-4 py-3 font-semibold">Ubicación</th>
              <th className="px-4 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tickets.map((ticket) => (
              <tr
                key={ticket.id}
                className={cn(
                  "cursor-pointer hover:bg-muted/50",
                  selectedTicket?.id === ticket.id && "bg-muted/40"
                )}
                onClick={() => setSelectedTicket(ticket)}
              >
                <td className="whitespace-nowrap px-4 py-3 font-medium">#{ticket.id}</td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {formatDate(ticket.createdAt)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">{typeLabel(ticket.type)}</td>
                <td className="min-w-56 px-4 py-3">{ticket.subject}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <Badge variant={statusBadgeVariant(ticket.status)}>{statusLabel(ticket.status)}</Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-3">{ticket.technician?.name ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{ticket.location?.name ?? "—"}</td>
                <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                  <TicketActions
                    ticket={ticket}
                    onStatusChange={onStatusChange}
                    pendingStatus={
                      statusChanging?.ticketId === Number(ticket.id) ? statusChanging.status : null
                    }
                  />
                </td>
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
      onStatusChange={onStatusChange}
      pendingStatus={
        selectedTicket && statusChanging?.ticketId === Number(selectedTicket.id)
          ? statusChanging.status
          : null
      }
    />
    </>
  );
}
