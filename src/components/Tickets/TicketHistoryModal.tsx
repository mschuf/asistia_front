/**
 * @file TicketHistoryModal.tsx
 * @description Modal con el historial del ticket: adjuntos agregados o eliminados y ediciones
 * de la descripción, en orden cronológico inverso.
 */
import { FileText, Loader2, Pencil, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { attachmentExtensionLabelFromFilename, formatAttachmentSize } from "@/lib/attachments";
import { formatDate } from "@/lib/format";
import { isAbortError } from "@/lib/http";
import { listTicketActivity } from "@/services/ticketActivityService";
import type { TicketActivityEntry } from "@/types/asistia";

/** Texto mostrado para cada tipo de movimiento del historial. */
const ACTION_LABEL: Record<TicketActivityEntry["type"], string> = {
  attachment_added: "agregó un adjunto",
  attachment_removed: "eliminó un adjunto",
  description_updated: "editó la descripción",
};

interface TicketHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: number;
}

/**
 * Bloque de texto de una edición (versión anterior o nueva).
 * @param props - Etiqueta, contenido y estilo de resaltado.
 * @returns Bloque con scroll propio para textos largos.
 */
function EditValueBlock({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "previous" | "next";
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div
        className={
          tone === "previous"
            ? "max-h-40 overflow-y-auto whitespace-pre-wrap break-words rounded-md border border-input bg-muted/30 p-2 text-sm text-muted-foreground line-through decoration-muted-foreground/40 [overflow-wrap:anywhere]"
            : "max-h-40 overflow-y-auto whitespace-pre-wrap break-words rounded-md border border-input bg-muted/30 p-2 text-sm [overflow-wrap:anywhere]"
        }
      >
        {value}
      </div>
    </div>
  );
}

/**
 * Nombre visible del autor de una entrada del historial.
 * @param entry - Entrada del historial.
 * @returns Nombre resuelto, o el ID como respaldo.
 */
function authorLabel(entry: TicketActivityEntry): string {
  const name = entry.authorName?.trim();
  if (name) return name;
  return entry.authorId !== null ? `Usuario #${entry.authorId}` : "Autor desconocido";
}

/**
 * Carga y muestra el historial completo del ticket al abrirse.
 * @param props - Visibilidad y ticket a consultar.
 * @returns Diálogo con la línea de tiempo de adjuntos y ediciones.
 */
export function TicketHistoryModal({ open, onOpenChange, ticketId }: TicketHistoryModalProps) {
  const [entries, setEntries] = useState<TicketActivityEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !ticketId) {
      setEntries([]);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError("");

    void listTicketActivity(ticketId, { signal: controller.signal })
      .then((items) => {
        if (!controller.signal.aborted) {
          setEntries(items);
        }
      })
      .catch((err) => {
        if (isAbortError(err) || controller.signal.aborted) return;
        setError("No se pudo cargar el historial.");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [open, ticketId]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Historial"
      description={`Caso #${ticketId} — adjuntos, eliminaciones y ediciones de la descripción`}
    >
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Cargando historial...
        </div>
      ) : (
        <>
          {error ? (
            <p className="mb-3 text-sm text-amber-700 dark:text-amber-200">{error}</p>
          ) : null}

          {entries.length === 0 && !error ? (
            <p className="text-sm text-muted-foreground">
              Todavía no hay movimientos registrados en este caso.
            </p>
          ) : (
            <ol className="space-y-3">
              {entries.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-md border border-input bg-muted/20 p-3"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={
                        entry.type === "attachment_removed"
                          ? "flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive"
                          : "flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
                      }
                    >
                      {entry.type === "attachment_added" ? (
                        <FileText className="h-4 w-4" aria-hidden="true" />
                      ) : entry.type === "attachment_removed" ? (
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{authorLabel(entry)}</span>{" "}
                        {ACTION_LABEL[entry.type]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(entry.createdAt)}
                      </p>
                    </div>
                  </div>

                  {entry.type === "description_updated" ? (
                    <div className="mt-2 space-y-2 pl-12">
                      <EditValueBlock
                        label="Texto anterior"
                        value={entry.previousValue?.trim() || "(sin descripción)"}
                        tone="previous"
                      />
                      <EditValueBlock
                        label="Texto nuevo"
                        value={entry.newValue ?? ""}
                        tone="next"
                      />
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-2 pl-12">
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                        {attachmentExtensionLabelFromFilename(entry.filename ?? "")}
                      </span>
                      <span
                        className={
                          entry.type === "attachment_removed"
                            ? "min-w-0 truncate text-sm text-muted-foreground line-through"
                            : "min-w-0 truncate text-sm"
                        }
                        title={entry.filename}
                      >
                        {entry.filename}
                      </span>
                      {typeof entry.size === "number" ? (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatAttachmentSize(entry.size)}
                        </span>
                      ) : null}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </Dialog>
  );
}
