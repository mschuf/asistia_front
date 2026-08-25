/**
 * @file TicketAttachmentsList.tsx
 * @description Lista de adjuntos de un ticket con miniaturas, descarga, alta y baja posterior.
 */
import { Download, Eye, FileText, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AttachmentImagePreview } from "@/components/tickets/AttachmentImagePreview";
import { TicketAttachmentDeleteConfirmDialog } from "@/components/tickets/TicketAttachmentDeleteConfirmDialog";
import {
  ATTACHMENT_ACCEPT,
  attachmentExtensionLabelFromFilename,
  formatAttachmentSize,
  isTicketAttachmentImage,
  MAX_ATTACHMENTS,
} from "@/lib/attachments";
import { cn } from "@/lib/utils";
import {
  downloadTicketAttachment,
  fetchTicketAttachmentBlob,
} from "@/services/attachmentsService";
import type { TicketAttachment } from "@/types/asistia";

interface TicketAttachmentsListProps {
  ticketId: number;
  enabled: boolean;
  attachments: TicketAttachment[];
  loading: boolean;
  /** Error de carga o de subida proveniente del hook de adjuntos. */
  error?: string;
  /** Muestra el botón para agregar adjuntos al ticket ya creado (solo TI). */
  canUpload?: boolean;
  /** Subida en curso; deshabilita el botón de agregar. */
  uploading?: boolean;
  /** Sube el archivo elegido; el hook se encarga de validar y refrescar. */
  onUpload?: (file: File) => Promise<boolean>;
  /** Muestra el botón de eliminar en cada adjunto (solo TI). */
  canDelete?: boolean;
  /** ID del adjunto que se está eliminando, o `null`. */
  removingId?: number | null;
  /** Elimina el adjunto indicado; el hook actualiza la lista. */
  onDelete?: (attachmentId: number) => Promise<boolean>;
}

/**
 * Muestra los adjuntos de un ticket con preview de imágenes y alta/baja opcionales.
 * @param props - Adjuntos, estados de carga y controles de subida y eliminación.
 * @returns Grilla de adjuntos, estados de carga o mensaje vacío.
 */
export function TicketAttachmentsList({
  ticketId,
  enabled,
  attachments,
  loading,
  error = "",
  canUpload = false,
  uploading = false,
  onUpload,
  canDelete = false,
  removingId = null,
  onDelete,
}: TicketAttachmentsListProps) {
  const [downloadError, setDownloadError] = useState("");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({});
  const [previewLoadingIds, setPreviewLoadingIds] = useState<Set<number>>(new Set());
  const [viewingAttachment, setViewingAttachment] = useState<TicketAttachment | null>(null);
  const [attachmentToDelete, setAttachmentToDelete] = useState<TicketAttachment | null>(null);
  const previewUrlsRef = useRef<Record<number, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    const imageAttachments = attachments.filter(isTicketAttachmentImage);

    if (!enabled || imageAttachments.length === 0) {
      Object.values(previewUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current = {};
      setPreviewUrls({});
      setPreviewLoadingIds(new Set());
    } else {
      setPreviewLoadingIds(new Set(imageAttachments.map((attachment) => attachment.id)));

      void Promise.all(
        imageAttachments.map(async (attachment) => {
          try {
            const blob = await fetchTicketAttachmentBlob(ticketId, attachment.id, {
              signal: controller.signal,
            });
            if (controller.signal.aborted) return null;
            return { id: attachment.id, url: URL.createObjectURL(blob) };
          } catch {
            return null;
          }
        }),
      ).then((results) => {
        if (controller.signal.aborted) return;

        Object.values(previewUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));

        const nextUrls = results.reduce<Record<number, string>>((acc, result) => {
          if (result) acc[result.id] = result.url;
          return acc;
        }, {});

        previewUrlsRef.current = nextUrls;
        setPreviewUrls(nextUrls);
        setPreviewLoadingIds(new Set());
      });
    }

    return () => {
      controller.abort();
      Object.values(previewUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current = {};
    };
  }, [attachments, enabled, ticketId]);

  /**
   * Descarga un adjunto al disco local.
   * @param attachment - Metadatos del adjunto.
   * @returns void
   */
  const handleDownload = async (attachment: TicketAttachment) => {
    setDownloadingId(attachment.id);
    try {
      await downloadTicketAttachment(ticketId, attachment.id, attachment.filename);
      setDownloadError("");
    } catch {
      setDownloadError("No se pudo descargar el adjunto.");
    } finally {
      setDownloadingId(null);
    }
  };

  /**
   * Sube el archivo elegido en el input y limpia la selección.
   * @param selected - FileList del input de archivos.
   * @returns void
   */
  const handleSelectFile = async (selected: FileList | null) => {
    const file = selected?.[0];
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (!file || !onUpload) return;
    await onUpload(file);
  };

  /**
   * Confirma la eliminación del adjunto seleccionado y cierra el diálogo si tuvo éxito.
   * @returns void
   */
  const handleConfirmDelete = async () => {
    if (!attachmentToDelete || !onDelete) return;
    const deleted = await onDelete(attachmentToDelete.id);
    if (deleted) {
      setAttachmentToDelete(null);
    }
  };

  const showAddButton = canUpload && attachments.length < MAX_ATTACHMENTS;
  const displayError = error || downloadError;

  /**
   * Botón (o tile) para agregar un adjunto nuevo al ticket.
   * @returns Elemento del input oculto más su disparador.
   */
  const renderAddTile = () => (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={ATTACHMENT_ACCEPT}
        className="sr-only"
        disabled={uploading}
        onChange={(event) => void handleSelectFile(event.target.files)}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        aria-label="Agregar adjunto"
        className="flex aspect-square w-28 shrink-0 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-input bg-muted/10 text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        {uploading ? (
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
        ) : (
          <Plus className="h-6 w-6" aria-hidden="true" />
        )}
        <span className="text-xs font-medium">
          {uploading ? "Subiendo..." : "Agregar"}
        </span>
      </button>
    </>
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Cargando adjuntos...
      </div>
    );
  }

  if (attachments.length === 0) {
    return (
      <div className="space-y-2">
        {displayError ? (
          <p className="text-sm text-amber-700 dark:text-amber-200">{displayError}</p>
        ) : null}
        {showAddButton ? (
          <div className="flex flex-wrap gap-3">{renderAddTile()}</div>
        ) : (
          <span className="text-sm text-muted-foreground">Sin adjuntos</span>
        )}
      </div>
    );
  }

  return (
    <>
      {displayError ? (
        <p className="mb-2 text-sm text-amber-700 dark:text-amber-200">{displayError}</p>
      ) : null}

      <ul className="flex flex-wrap gap-3">
        {attachments.map((attachment) => {
          const isImage = isTicketAttachmentImage(attachment);
          const previewUrl = previewUrls[attachment.id];
          const isPreviewLoading = isImage && previewLoadingIds.has(attachment.id);

          return (
            <li
              key={attachment.id}
              className="group relative aspect-square w-28 shrink-0"
            >
              <div
                className={cn(
                  "relative h-full w-full overflow-hidden rounded-md border border-input bg-muted/20",
                  isImage && previewUrl ? "bg-muted" : "flex flex-col items-center justify-center gap-1 p-2",
                )}
              >
                {isImage && previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={attachment.filename}
                    className="h-full w-full object-cover"
                  />
                ) : isPreviewLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
                ) : (
                  <>
                    <FileText className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                    <span className="text-xs font-semibold uppercase text-muted-foreground">
                      {attachmentExtensionLabelFromFilename(attachment.filename)}
                    </span>
                  </>
                )}

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-6">
                  <p className="truncate text-xs font-medium text-white" title={attachment.filename}>
                    {attachment.filename}
                  </p>
                  <p className="text-[10px] text-white/80">{formatAttachmentSize(attachment.size)}</p>
                </div>
              </div>

              <div className="absolute -right-2 -top-2 flex gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                {isImage && previewUrl ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    title="Ver imagen"
                    aria-label={`Ver ${attachment.filename}`}
                    onClick={() => setViewingAttachment(attachment)}
                    className="h-7 w-7 rounded-full shadow-sm"
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  title="Descargar"
                  disabled={downloadingId === attachment.id}
                  aria-label={`Descargar ${attachment.filename}`}
                  onClick={() => void handleDownload(attachment)}
                  className="h-7 w-7 rounded-full shadow-sm"
                >
                  {downloadingId === attachment.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Download className="h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
                {canDelete ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    title="Eliminar"
                    disabled={removingId === attachment.id}
                    aria-label={`Eliminar ${attachment.filename}`}
                    onClick={() => setAttachmentToDelete(attachment)}
                    className="h-7 w-7 rounded-full text-destructive shadow-sm hover:text-destructive"
                  >
                    {removingId === attachment.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    )}
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}

        {showAddButton ? <li className="shrink-0">{renderAddTile()}</li> : null}
      </ul>

      {viewingAttachment && previewUrls[viewingAttachment.id] ? (
        <AttachmentImagePreview
          src={previewUrls[viewingAttachment.id]}
          alt={viewingAttachment.filename}
          filename={viewingAttachment.filename}
          onClose={() => setViewingAttachment(null)}
        />
      ) : null}

      <TicketAttachmentDeleteConfirmDialog
        filename={attachmentToDelete?.filename ?? null}
        deleting={removingId !== null}
        onOpenChange={(open) => {
          if (!open) setAttachmentToDelete(null);
        }}
        onConfirm={() => void handleConfirmDelete()}
      />
    </>
  );
}
