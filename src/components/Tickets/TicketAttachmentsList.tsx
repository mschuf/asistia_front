/**
 * @file TicketAttachmentsList.tsx
 * @description Lista de adjuntos de un ticket con miniaturas y descarga.
 */
import { Download, Eye, FileText, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AttachmentImagePreview } from "@/components/tickets/AttachmentImagePreview";
import {
  attachmentExtensionLabelFromFilename,
  formatAttachmentSize,
  isTicketAttachmentImage,
} from "@/lib/attachments";
import { isAbortError } from "@/lib/http";
import { cn } from "@/lib/utils";
import {
  downloadTicketAttachment,
  fetchTicketAttachmentBlob,
  listTicketAttachments,
} from "@/services/attachmentsService";
import type { TicketAttachment } from "@/types/asistia";

interface TicketAttachmentsListProps {
  ticketId: number;
  enabled: boolean;
}

/**
 * Carga y muestra adjuntos de un ticket con preview de imágenes.
 * @param props - ID del ticket y flag de carga habilitada.
 * @returns Lista de adjuntos, estados de carga o mensaje vacío.
 */
export function TicketAttachmentsList({ ticketId, enabled }: TicketAttachmentsListProps) {
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({});
  const [previewLoadingIds, setPreviewLoadingIds] = useState<Set<number>>(new Set());
  const [viewingAttachment, setViewingAttachment] = useState<TicketAttachment | null>(null);
  const previewUrlsRef = useRef<Record<number, string>>({});

  useEffect(() => {
    if (!enabled || !ticketId) {
      setAttachments([]);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError("");

    void listTicketAttachments(ticketId, { signal: controller.signal })
      .then((items) => {
        if (!controller.signal.aborted) {
          setAttachments(items);
        }
      })
      .catch((err) => {
        if (isAbortError(err) || controller.signal.aborted) return;
        setError("No se pudieron cargar los adjuntos.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [enabled, ticketId]);

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
    } catch {
      setError("No se pudo descargar el adjunto.");
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Cargando adjuntos...
      </div>
    );
  }

  if (error && attachments.length === 0) {
    return <p className="text-sm text-amber-700 dark:text-amber-200">{error}</p>;
  }

  if (attachments.length === 0) {
    return <span className="text-sm text-muted-foreground">Sin adjuntos</span>;
  }

  return (
    <>
      {error ? <p className="mb-2 text-sm text-amber-700 dark:text-amber-200">{error}</p> : null}

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
              </div>
            </li>
          );
        })}
      </ul>

      {viewingAttachment && previewUrls[viewingAttachment.id] ? (
        <AttachmentImagePreview
          src={previewUrls[viewingAttachment.id]}
          alt={viewingAttachment.filename}
          filename={viewingAttachment.filename}
          onClose={() => setViewingAttachment(null)}
        />
      ) : null}
    </>
  );
}
