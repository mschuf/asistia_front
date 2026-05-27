import { TICKET_STATUS_LABELS, TICKET_TYPE_LABELS } from "../../lib/constants";
import { formatDate } from "../../lib/format";
import type { AsistiaTicket, AsistiaTicketStatus } from "../../types/asistia";

interface TicketTableProps {
  tickets: AsistiaTicket[];
  isTechnician: boolean;
  onStatusChange: (ticketId: number, status: AsistiaTicketStatus) => Promise<void>;
}

const STATUS_OPTIONS: AsistiaTicketStatus[] = [
  "new",
  "assigned",
  "planned",
  "waiting",
  "solved",
  "closed"
];

export default function TicketTable({ tickets, isTechnician, onStatusChange }: TicketTableProps) {
  if (tickets.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        No hay tickets para mostrar con los filtros actuales.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Solicitante</th>
              <th className="px-4 py-3">Técnico</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Creado</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-semibold text-brand-700">#{ticket.id}</td>
                <td className="px-4 py-3">{TICKET_TYPE_LABELS[ticket.type] ?? ticket.type}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{ticket.subject}</p>
                  <p className="text-xs text-slate-500">{ticket.category?.name ?? "Sin categoría"}</p>
                </td>
                <td className="px-4 py-3">{ticket.requester.name ?? "—"}</td>
                <td className="px-4 py-3">{ticket.technician?.name ?? "Sin asignar"}</td>
                <td className="px-4 py-3">
                  {isTechnician ? (
                    <select
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                      value={ticket.status}
                      onChange={(event) =>
                        void onStatusChange(ticket.id, event.target.value as AsistiaTicketStatus)
                      }
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {TICKET_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    TICKET_STATUS_LABELS[ticket.status] ?? ticket.status
                  )}
                </td>
                <td className="px-4 py-3">{formatDate(ticket.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
