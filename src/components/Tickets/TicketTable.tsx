import { TicketActions } from "@/components/tickets/TicketActions";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format";
import { statusBadgeVariant, statusLabel, typeLabel } from "@/lib/tickets";
import type { AsistiaTicket, AsistiaTicketStatus } from "@/types/asistia";

interface TicketTableProps {
  tickets: AsistiaTicket[];
  onStatusChange?: (ticketId: number, status: AsistiaTicketStatus) => void;
}

export function TicketTable({ tickets, onStatusChange }: TicketTableProps) {
  if (!tickets.length) {
    return <EmptyState title="Sin tickets" description="No hay tickets para los filtros actuales." />;
  }

  return (
    <div className="overflow-hidden rounded-md border bg-card shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left text-sm">
          <thead className="bg-muted text-xs uppercase tracking-normal text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Ticket</th>
              <th className="px-4 py-3 font-semibold">Apertura</th>
              <th className="px-4 py-3 font-semibold">Tipo</th>
              <th className="px-4 py-3 font-semibold">Título</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Asignado a</th>
              <th className="px-4 py-3 font-semibold">Categoría</th>
              <th className="px-4 py-3 font-semibold">Ubicación</th>
              <th className="px-4 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-muted/50">
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
                <td className="px-4 py-3 text-muted-foreground">{ticket.category?.name ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{ticket.location?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <TicketActions ticket={ticket} onStatusChange={onStatusChange} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
