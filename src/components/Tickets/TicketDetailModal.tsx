import type { ReactNode } from "react";
import { TicketActions } from "@/components/tickets/TicketActions";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { formatDate } from "@/lib/format";
import { statusBadgeVariant, statusLabel, typeLabel, urgencyLabel } from "@/lib/tickets";
import type { AsistiaTicket, AsistiaTicketStatus } from "@/types/asistia";

interface TicketDetailModalProps {
  ticket: AsistiaTicket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (ticketId: number, status: AsistiaTicketStatus) => void;
  pendingStatus?: AsistiaTicketStatus | null;
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:gap-3">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

export function TicketDetailModal({
  ticket,
  open,
  onOpenChange,
  onStatusChange,
  pendingStatus = null
}: TicketDetailModalProps) {
  if (!ticket) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Ticket #${ticket.id}`}
      description={ticket.subject}
    >
      <dl className="space-y-4">
        <DetailRow label="Estado">
          <Badge variant={statusBadgeVariant(ticket.status)}>{statusLabel(ticket.status)}</Badge>
        </DetailRow>
        <DetailRow label="Tipo">{typeLabel(ticket.type)}</DetailRow>
        <DetailRow label="Urgencia">{urgencyLabel(ticket.urgency) || "—"}</DetailRow>
        <DetailRow label="Categoría">{ticket.category?.name ?? "—"}</DetailRow>
        <DetailRow label="Ubicación">{ticket.location?.name ?? "—"}</DetailRow>
        <DetailRow label="Solicitante">
          <div>
            <p>{ticket.requester.name ?? "—"}</p>
            {ticket.requester.email ? (
              <p className="text-muted-foreground">{ticket.requester.email}</p>
            ) : null}
          </div>
        </DetailRow>
        <DetailRow label="Asignado a">
          <div>
            <p>{ticket.technician?.name ?? "—"}</p>
            {ticket.technician?.email ? (
              <p className="text-muted-foreground">{ticket.technician.email}</p>
            ) : null}
          </div>
        </DetailRow>
        <DetailRow label="Apertura">{formatDate(ticket.createdAt)}</DetailRow>
        <DetailRow label="Última actualización">{formatDate(ticket.updatedAt)}</DetailRow>
        <DetailRow label="Descripción">
          {ticket.description ? (
            <div
              className="rich-description rounded-md border border-input bg-muted/30 p-3"
              dangerouslySetInnerHTML={{ __html: ticket.description }}
            />
          ) : (
            "—"
          )}
        </DetailRow>
      </dl>

      {onStatusChange ? (
        <div className="mt-6 flex items-center justify-between gap-3 border-t pt-4">
          <p className="text-sm font-medium text-muted-foreground">Acciones</p>
          <TicketActions
            ticket={ticket}
            onStatusChange={onStatusChange}
            pendingStatus={pendingStatus}
          />
        </div>
      ) : null}
    </Dialog>
  );
}
