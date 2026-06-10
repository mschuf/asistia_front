/**
 * @file TicketDetailModal.tsx
 * @description Modal de detalle de ticket con carga lazy y adjuntos.
 */
import { useEffect, useState, type ReactNode } from "react";
import { TicketActions } from "@/components/tickets/TicketActions";
import { TicketAttachmentsList } from "@/components/tickets/TicketAttachmentsList";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Loading } from "@/components/ui/loading";
import { formatDate } from "@/lib/format";
import { isAbortError } from "@/lib/http";
import { statusBadgeVariant, statusLabel, typeLabel, urgencyLabel } from "@/lib/tickets";
import { getTicketById } from "@/services/ticketsService";
import type { AsistiaTicket, AsistiaTicketStatus } from "@/types/asistia";

type TicketStatusActionId = "solved" | "closed" | "waiting";

interface TicketDetailModalProps {
  ticket: AsistiaTicket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (ticketId: number, status: AsistiaTicketStatus) => void;
  pendingStatus?: AsistiaTicketStatus | null;
  onAssignClick?: (ticket: AsistiaTicket) => void;
  assigning?: { ticketId: number } | null;
  statusActionIds?: TicketStatusActionId[];
}

/**
 * Fila de detalle con etiqueta y valor.
 * @param props - Etiqueta y contenido hijo.
 * @returns Elemento dl/dt/dd.
 */
function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:gap-3">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

/**
 * Modal que carga el detalle completo del ticket al abrirse.
 * @param props - Ticket, visibilidad, callbacks de estado y asignación.
 * @returns Diálogo con metadatos y acciones o null.
 */
export function TicketDetailModal({
  ticket,
  open,
  onOpenChange,
  onStatusChange,
  pendingStatus = null,
  onAssignClick,
  assigning = null,
  statusActionIds,
}: TicketDetailModalProps) {
  const [detail, setDetail] = useState<AsistiaTicket | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    if (!open || !ticket) {
      setDetail(null);
      setLoadingDetail(false);
      setDetailError("");
      return;
    }

    const controller = new AbortController();
    setLoadingDetail(true);
    setDetailError("");
    setDetail(null);

    void getTicketById(ticket.id, { signal: controller.signal })
      .then((fetched) => {
        if (!controller.signal.aborted) {
          setDetail(fetched);
        }
      })
      .catch((err) => {
        if (isAbortError(err) || controller.signal.aborted) return;
        setDetailError("No se pudieron cargar todos los detalles.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingDetail(false);
        }
      });

    return () => controller.abort();
  }, [open, ticket?.id]);

  useEffect(() => {
    if (!open || !ticket?.description) return;
    setDetail((current) => (current?.id === ticket.id ? ticket : current));
  }, [ticket, open]);

  if (!ticket) return null;

  const displayTicket = detail ?? ticket;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Ticket #${displayTicket.id}`}
      description={displayTicket.subject}
    >
      {loadingDetail && !detail ? (
        <div className="flex min-h-32 items-center justify-center">
          <Loading label="Cargando detalles..." />
        </div>
      ) : (
        <>
          {detailError ? (
            <p className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-200">
              {detailError}
            </p>
          ) : null}

          <dl className="space-y-4">
            <DetailRow label="Estado">
              <Badge variant={statusBadgeVariant(displayTicket.status)}>
                {statusLabel(displayTicket.status)}
              </Badge>
            </DetailRow>
            <DetailRow label="Tipo">{typeLabel(displayTicket.type)}</DetailRow>
            <DetailRow label="Urgencia">{urgencyLabel(displayTicket.urgency) || "—"}</DetailRow>
            <DetailRow label="Categoría">{displayTicket.category?.name ?? "—"}</DetailRow>
            <DetailRow label="Ubicación">{displayTicket.location?.name ?? "—"}</DetailRow>
            <DetailRow label="Solicitante">
              <div>
                <p>{displayTicket.requester.name ?? "—"}</p>
                {displayTicket.requester.email ? (
                  <p className="text-muted-foreground">{displayTicket.requester.email}</p>
                ) : null}
              </div>
            </DetailRow>
            <DetailRow label="Asignado a">
              <div>
                <p>{displayTicket.technician?.name ?? "—"}</p>
                {displayTicket.technician?.email ? (
                  <p className="text-muted-foreground">{displayTicket.technician.email}</p>
                ) : null}
              </div>
            </DetailRow>
            <DetailRow label="Apertura">{formatDate(displayTicket.createdAt)}</DetailRow>
            <DetailRow label="Última actualización">{formatDate(displayTicket.updatedAt)}</DetailRow>
            <DetailRow label="Descripción">
              {displayTicket.description ? (
                <div className="rich-description whitespace-pre-wrap rounded-md border border-input bg-muted/30 p-3">
                  {displayTicket.description}
                </div>
              ) : (
                "—"
              )}
            </DetailRow>
            <DetailRow label="Adjuntos">
              <TicketAttachmentsList ticketId={displayTicket.id} enabled={open} />
            </DetailRow>
          </dl>

          {onStatusChange || onAssignClick ? (
            <div className="mt-6 flex items-center justify-between gap-3 border-t pt-4">
              <p className="text-sm font-medium text-muted-foreground">Acciones</p>
              <TicketActions
                ticket={displayTicket}
                onStatusChange={onStatusChange}
                pendingStatus={pendingStatus}
                onAssignClick={
                  onAssignClick ? () => onAssignClick(displayTicket) : undefined
                }
                assignPending={assigning?.ticketId === Number(displayTicket.id)}
                statusActionIds={statusActionIds}
              />
            </div>
          ) : null}
        </>
      )}
    </Dialog>
  );
}
