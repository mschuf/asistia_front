/**
 * @file TicketDetailModal.tsx
 * @description Modal de detalle de ticket con carga lazy y adjuntos.
 */
import { useEffect, useState, type ReactNode } from "react";
import { TicketActions } from "@/components/tickets/TicketActions";
import { TicketAttachmentsList } from "@/components/tickets/TicketAttachmentsList";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import { useToast } from "@/context/ToastContext";
import { formatDate } from "@/lib/format";
import { isAbortError } from "@/lib/http";
import { ApiError } from "@/api/apiClient";
import { formatTicketTitle, getTicketTag, statusBadgeVariant, statusLabel, typeLabel } from "@/lib/tickets";
import { getTicketById, updateTicketTag } from "@/services/ticketsService";
import type { AsistiaTicket, AsistiaTicketStatus } from "@/types/asistia";

type TicketStatusActionId = "solved" | "closed" | "waiting";

interface TicketDetailModalProps {
  ticket: AsistiaTicket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (ticketId: number, status: AsistiaTicketStatus) => void;
  pendingStatus?: AsistiaTicketStatus | null;
  onAssignClick?: (ticket: AsistiaTicket) => void;
  onEscalate?: (ticket: AsistiaTicket) => void;
  assigning?: { ticketId: number } | null;
  statusActionIds?: TicketStatusActionId[];
  /** Habilita la edición del tag (solo super admin). */
  isSuperAdmin?: boolean;
  /** Propaga a la lista el ticket con el tag actualizado. */
  onTicketUpdated?: (ticket: AsistiaTicket) => void;
}

/**
 * Fila de detalle con etiqueta y valor.
 * @param props - Etiqueta y contenido hijo.
 * @returns Elemento dl/dt/dd.
 */
function DetailRow({
  label,
  children,
  inline = false,
}: {
  label: string;
  children: ReactNode;
  inline?: boolean;
}) {
  return (
    <div
      className={
        inline
          ? "grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-0 sm:grid-cols-[140px_1fr] sm:gap-3"
          : "grid content-start gap-1 sm:grid-cols-[140px_1fr] sm:gap-3"
      }
    >
      <dt className="text-sm font-medium leading-snug text-muted-foreground">{label}</dt>
      <dd className="text-sm leading-snug">{children}</dd>
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
  onEscalate,
  assigning = null,
  statusActionIds,
  isSuperAdmin = false,
  onTicketUpdated,
}: TicketDetailModalProps) {
  const toast = useToast();
  const [detail, setDetail] = useState<AsistiaTicket | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [tagValue, setTagValue] = useState("");
  const [savingTag, setSavingTag] = useState(false);

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

  const currentTicket = detail ?? ticket;

  useEffect(() => {
    setTagValue(currentTicket ? getTicketTag(currentTicket) ?? "" : "");
  }, [currentTicket?.id, currentTicket?.tag]);

  if (!ticket) return null;

  const displayTicket = detail ?? ticket;

  /**
   * Persiste el tag al presionar Enter o perder el foco (solo super admin).
   * @returns void
   */
  const handleSaveTag = async () => {
    const next = tagValue.trim().slice(0, 15);
    const current = getTicketTag(displayTicket) ?? "";
    if (next === current || savingTag) return;

    setSavingTag(true);
    try {
      const updated = await updateTicketTag(displayTicket.id, next);
      setDetail(updated);
      setTagValue(getTicketTag(updated) ?? "");
      onTicketUpdated?.(updated);
      toast.success("Tag guardado correctamente.");
    } catch (err) {
      const message =
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "No se pudo guardar el tag.";
      toast.error(message);
      setTagValue(getTicketTag(displayTicket) ?? "");
    } finally {
      setSavingTag(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Caso #${displayTicket.id} - ${typeLabel(displayTicket.type)}`}
      description={formatTicketTitle(displayTicket)}
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
            <DetailRow label="Estado" inline>
              <Badge variant={statusBadgeVariant(displayTicket.status)}>
                {statusLabel(displayTicket.status)}
              </Badge>
            </DetailRow>
            <DetailRow label="Tag" inline>
              {isSuperAdmin ? (
                <Input
                  value={tagValue}
                  onChange={(event) => setTagValue(event.target.value.slice(0, 15))}
                  onBlur={() => void handleSaveTag()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      event.currentTarget.blur();
                    }
                  }}
                  maxLength={15}
                  disabled={savingTag}
                  placeholder="Sin tag"
                  aria-label="Tag del caso"
                  className="h-8 max-w-[12rem]"
                />
              ) : (
                <span>{getTicketTag(displayTicket) ?? "—"}</span>
              )}
            </DetailRow>
            <div className="grid grid-cols-[40%_1fr] gap-x-4 gap-y-4 sm:block sm:space-y-4">
              <DetailRow label="Solicitante">
                <div>
                  <p>{displayTicket.requester.name ?? "—"}</p>
                  {displayTicket.requester.email ? (
                    <p className="text-muted-foreground">{displayTicket.requester.email}</p>
                  ) : null}
                </div>
              </DetailRow>
              <DetailRow label="Ubicación">{displayTicket.location?.name ?? "—"}</DetailRow>
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
            </div>
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

          {onStatusChange || onAssignClick || onEscalate ? (
            <div className="mt-6 flex items-center justify-between gap-3 border-t pt-4 pr-6 sm:pr-0">
              <p className="text-sm font-medium text-muted-foreground">Acciones</p>
              <TicketActions
                ticket={displayTicket}
                onStatusChange={onStatusChange}
                pendingStatus={pendingStatus}
                onAssignClick={
                  onAssignClick ? () => onAssignClick(displayTicket) : undefined
                }
                onEscalate={onEscalate ? () => onEscalate(displayTicket) : undefined}
                assignPending={assigning?.ticketId === Number(displayTicket.id)}
                statusActionIds={statusActionIds}
                className="flex flex-row flex-nowrap items-center"
              />
            </div>
          ) : null}
        </>
      )}
    </Dialog>
  );
}
