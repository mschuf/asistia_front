/**
 * @file TicketCloseDetailModal.tsx
 * @description Detalle de solo lectura de un candidato a cierre masivo (super admin, SQL-only).
 */
import { useEffect, useState, type ReactNode } from "react";
import { ApiError } from "@/api/apiClient";
import { getCloseCandidateDetail } from "@/api/ticketsClose";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Loading } from "@/components/ui/loading";
import { formatDate } from "@/lib/format";
import { isAbortError } from "@/lib/http";
import { formatTicketTitle, statusBadgeVariant, statusLabel, typeLabel } from "@/lib/tickets";
import type { AsistiaTicket } from "@/types/asistia";

interface TicketCloseDetailModalProps {
  ticketId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Fila de detalle con etiqueta y valor. */
function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid content-start gap-1 sm:grid-cols-[140px_1fr] sm:gap-3">
      <dt className="text-sm font-medium leading-snug text-muted-foreground">{label}</dt>
      <dd className="text-sm leading-snug">{children}</dd>
    </div>
  );
}

/**
 * Modal de solo lectura con el detalle de un candidato a cierre masivo, cargado 100% vía SQL.
 * @param props - ID del ticket, visibilidad y callback de cierre del modal.
 * @returns Diálogo con metadatos del ticket o null sin ID activo.
 */
export function TicketCloseDetailModal({
  ticketId,
  open,
  onOpenChange,
}: TicketCloseDetailModalProps) {
  const [ticket, setTicket] = useState<AsistiaTicket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || ticketId === null) {
      setTicket(null);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError("");
    setTicket(null);

    void getCloseCandidateDetail(ticketId, { signal: controller.signal })
      .then((fetched) => {
        if (!controller.signal.aborted) setTicket(fetched);
      })
      .catch((err) => {
        if (isAbortError(err) || controller.signal.aborted) return;
        const message =
          err instanceof ApiError || err instanceof Error
            ? err.message
            : "No se pudo cargar el ticket.";
        setError(message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [open, ticketId]);

  if (ticketId === null) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={ticket ? `Caso #${ticketId} - ${typeLabel(ticket.type)}` : `Caso #${ticketId}`}
      description={ticket ? formatTicketTitle(ticket) : undefined}
    >
      {loading && !ticket ? (
        <div className="flex min-h-32 items-center justify-center">
          <Loading label="Cargando detalles..." />
        </div>
      ) : error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : ticket ? (
        <dl className="space-y-4">
          <DetailRow label="Estado">
            <Badge variant={statusBadgeVariant(ticket.status)}>{statusLabel(ticket.status)}</Badge>
          </DetailRow>
          <DetailRow label="Tipo">{typeLabel(ticket.type)}</DetailRow>
          <DetailRow label="Solicitante">
            <div>
              <p>{ticket.requester.name ?? "—"}</p>
              {ticket.requester.email ? (
                <p className="text-muted-foreground">{ticket.requester.email}</p>
              ) : null}
            </div>
          </DetailRow>
          <DetailRow label="Ubicación">{ticket.location?.name ?? "—"}</DetailRow>
          <DetailRow label="Categoría">{ticket.category?.name ?? "—"}</DetailRow>
          <DetailRow label="Apertura">{formatDate(ticket.createdAt)}</DetailRow>
          <DetailRow label="Descripción">
            {ticket.description ? (
              <div className="whitespace-pre-wrap rounded-md border border-input bg-muted/30 p-3">
                {ticket.description}
              </div>
            ) : (
              "—"
            )}
          </DetailRow>
        </dl>
      ) : null}
    </Dialog>
  );
}
