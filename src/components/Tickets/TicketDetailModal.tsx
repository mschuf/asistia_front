/**
 * @file TicketDetailModal.tsx
 * @description Modal de detalle de ticket con carga lazy y adjuntos.
 */
import { History, Pencil } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { TicketActions } from "@/components/tickets/TicketActions";
import { TicketAttachmentsList } from "@/components/tickets/TicketAttachmentsList";
import { TicketHistoryModal } from "@/components/tickets/TicketHistoryModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import { Textarea } from "@/components/ui/textarea";
import { useTicketAttachments } from "@/hooks/useTicketAttachments";
import { useToast } from "@/context/ToastContext";
import { formatDate } from "@/lib/format";
import { isAbortError } from "@/lib/http";
import { ApiError } from "@/api/apiClient";
import {
  formatTicketTitle,
  getTicketTag,
  statusBadgeVariant,
  statusLabel,
  ticketCategoryTitle,
  TICKET_DESCRIPTION_MAX_LENGTH,
  typeLabel,
} from "@/lib/tickets";
import {
  getTicketById,
  updateTicketDescription,
  updateTicketTag,
} from "@/services/ticketsService";
import type { AsistiaTicket, AsistiaTicketStatus } from "@/types/asistia";

type TicketStatusActionId = "solved" | "closed" | "waiting";

/** Longitud mínima exigida por la API para la descripción del ticket. */
const MIN_DESCRIPTION_LENGTH = 10;

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
  /** Habilita editar la descripción y agregar adjuntos (usuarios TI). */
  isTechnician?: boolean;
  /** Muestra el software seleccionado; disponible solo para TI/superadmin. */
  showSoftware?: boolean;
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
  isTechnician = false,
  showSoftware = false,
  onTicketUpdated,
}: TicketDetailModalProps) {
  const toast = useToast();
  const [detail, setDetail] = useState<AsistiaTicket | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [tagValue, setTagValue] = useState("");
  const [savingTag, setSavingTag] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState("");
  const [savingDescription, setSavingDescription] = useState(false);
  const [descriptionError, setDescriptionError] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const attachments = useTicketAttachments(ticket?.id ?? null, open);

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

  useEffect(() => {
    if (editingDescription) return;
    setDescriptionValue(currentTicket?.description ?? "");
  }, [currentTicket?.id, currentTicket?.description, editingDescription]);

  useEffect(() => {
    if (open) return;
    setEditingDescription(false);
    setDescriptionError("");
    setHistoryOpen(false);
  }, [open]);

  useLayoutEffect(() => {
    const textarea = descriptionTextareaRef.current;
    if (!editingDescription || !textarea) return;

    textarea.style.height = "auto";
    const borderHeight = textarea.offsetHeight - textarea.clientHeight;
    textarea.style.height = `${textarea.scrollHeight + borderHeight}px`;
  }, [descriptionValue, editingDescription]);

  if (!ticket) return null;

  const displayTicket = detail ?? ticket;
  const softwareName = showSoftware
    ? (displayTicket.software?.name ?? ticket.software?.name)?.trim()
    : "";
  const tag = getTicketTag(displayTicket);
  const headerDescription = softwareName
    ? `${ticketCategoryTitle(displayTicket)} {${softwareName}}${tag ? ` [${tag}]` : ""}`
    : formatTicketTitle(displayTicket);

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

  /**
   * Abre el editor de descripción con el valor actual del ticket.
   * @returns void
   */
  const handleStartEditDescription = () => {
    setDescriptionValue(displayTicket.description ?? "");
    setDescriptionError("");
    setEditingDescription(true);
  };

  /**
   * Descarta los cambios y vuelve a la vista de solo lectura.
   * @returns void
   */
  const handleCancelEditDescription = () => {
    setDescriptionValue(displayTicket.description ?? "");
    setDescriptionError("");
    setEditingDescription(false);
  };

  /**
   * Persiste la nueva descripción del ticket (solo TI).
   * @returns void
   */
  const handleSaveDescription = async () => {
    if (savingDescription) return;

    const next = descriptionValue.trim();
    if (next.length < MIN_DESCRIPTION_LENGTH) {
      setDescriptionError(`La descripción debe tener al menos ${MIN_DESCRIPTION_LENGTH} caracteres.`);
      return;
    }

    if (next.length > TICKET_DESCRIPTION_MAX_LENGTH) {
      setDescriptionError(
        `La descripción no puede superar ${TICKET_DESCRIPTION_MAX_LENGTH} caracteres (actual: ${next.length}).`,
      );
      return;
    }

    if (next === (displayTicket.description ?? "").trim()) {
      setEditingDescription(false);
      setDescriptionError("");
      return;
    }

    setSavingDescription(true);
    setDescriptionError("");
    try {
      const updated = await updateTicketDescription(displayTicket.id, next);
      setDetail(updated);
      setDescriptionValue(updated.description ?? next);
      setEditingDescription(false);
      onTicketUpdated?.(updated);
      toast.success("Descripción actualizada.");
    } catch (err) {
      const message =
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "No se pudo guardar la descripción.";
      setDescriptionError(message);
    } finally {
      setSavingDescription(false);
    }
  };

  return (
    <>
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Caso #${displayTicket.id} - ${typeLabel(displayTicket.type)}`}
      description={headerDescription}
      headerActions={
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          title="Historial"
          aria-label="Ver historial del caso"
          onClick={() => setHistoryOpen(true)}
        >
          <History className="h-4 w-4" aria-hidden="true" />
        </Button>
      }
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
            <div className="relative grid content-start gap-1 sm:grid-cols-[140px_1fr] sm:gap-3">
              <div className="space-y-2 sm:relative sm:space-y-0">
                <dt className="flex items-center gap-1 text-sm font-medium leading-snug text-muted-foreground">
                  <span>Descripción</span>
                  {!editingDescription && isTechnician ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      title="Editar descripción"
                      aria-label="Editar descripción"
                      onClick={handleStartEditDescription}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  ) : null}
                </dt>

              </div>
              <dd className="text-sm leading-snug">
                {editingDescription ? (
                  <div className="space-y-2">
                    <Textarea
                      ref={descriptionTextareaRef}
                      value={descriptionValue}
                      onChange={(event) => setDescriptionValue(event.target.value)}
                      rows={2}
                      disabled={savingDescription}
                      aria-label="Descripción del caso"
                      placeholder="Describí el caso con el mayor detalle posible."
                      className="min-h-16 resize-none overflow-hidden"
                      maxLength={TICKET_DESCRIPTION_MAX_LENGTH}
                    />
                    <p className="text-right text-xs text-muted-foreground">
                      {descriptionValue.length} / {TICKET_DESCRIPTION_MAX_LENGTH}
                    </p>
                    {descriptionError ? (
                      <p className="text-sm text-destructive">{descriptionError}</p>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={savingDescription}
                        onClick={() => void handleSaveDescription()}
                      >
                        {savingDescription ? "Guardando..." : "Guardar"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={savingDescription}
                        onClick={handleCancelEditDescription}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {displayTicket.description ? (
                      <div className="rich-description min-h-0 whitespace-pre-wrap rounded-md border border-input bg-muted/30 p-3">
                        {displayTicket.description}
                      </div>
                    ) : (
                      "—"
                    )}
                  </div>
                )}
              </dd>
            </div>
            <DetailRow label="Adjuntos">
              <TicketAttachmentsList
                ticketId={displayTicket.id}
                enabled={open}
                attachments={attachments.attachments}
                loading={attachments.loading}
                error={attachments.error}
                canUpload={isTechnician}
                uploading={attachments.uploading}
                onUpload={attachments.upload}
                canDelete={isTechnician}
                removingId={attachments.removingId}
                onDelete={attachments.remove}
              />
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

    <TicketHistoryModal
      open={historyOpen}
      onOpenChange={setHistoryOpen}
      ticketId={displayTicket.id}
    />
    </>
  );
}
