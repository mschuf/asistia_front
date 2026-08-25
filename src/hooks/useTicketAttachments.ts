/**
 * @file useTicketAttachments.ts
 * @description Hook de carga y subida de adjuntos de un ticket ya creado.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/api/apiClient";
import { useToast } from "@/context/ToastContext";
import { MAX_ATTACHMENTS, validateAttachmentFile } from "@/lib/attachments";
import { isAbortError } from "@/lib/http";
import {
  deleteTicketAttachment,
  listTicketAttachments,
  uploadTicketAttachment,
} from "@/services/attachmentsService";
import type { TicketAttachment } from "@/types/asistia";

/** Estado y acciones expuestos por `useTicketAttachments`. */
export interface UseTicketAttachmentsResult {
  attachments: TicketAttachment[];
  loading: boolean;
  uploading: boolean;
  /** ID del adjunto que se está eliminando, o `null`. */
  removingId: number | null;
  error: string;
  /** Sube un archivo y refresca la lista; devuelve `true` si se subió. */
  upload: (file: File) => Promise<boolean>;
  /** Elimina un adjunto y lo quita de la lista; devuelve `true` si se eliminó. */
  remove: (attachmentId: number) => Promise<boolean>;
}

/**
 * Carga los adjuntos de un ticket y permite agregar nuevos tras su creación.
 * @param ticketId - ID del ticket.
 * @param enabled - Habilita la carga (p. ej. modal abierto).
 * @returns Lista de adjuntos, estados de carga/subida y acción de subida.
 */
export function useTicketAttachments(
  ticketId: number | null,
  enabled: boolean,
): UseTicketAttachmentsResult {
  const toast = useToast();
  const [attachments, setAttachments] = useState<TicketAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const attachmentsRef = useRef<TicketAttachment[]>([]);

  attachmentsRef.current = attachments;

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

  /**
   * Valida y sube un archivo al ticket, agregándolo a la lista local.
   * @param file - Archivo seleccionado por el usuario.
   * @returns `true` si la subida fue correcta.
   */
  const upload = useCallback(
    async (file: File): Promise<boolean> => {
      if (!ticketId) return false;

      if (attachmentsRef.current.length >= MAX_ATTACHMENTS) {
        setError(`El caso ya tiene el máximo de ${MAX_ATTACHMENTS} adjuntos.`);
        return false;
      }

      const validationError = validateAttachmentFile(file);
      if (validationError) {
        setError(validationError);
        return false;
      }

      setUploading(true);
      setError("");
      try {
        const created = await uploadTicketAttachment(ticketId, file);
        setAttachments((current) => [...current, created]);
        toast.success(`Adjunto "${created.filename}" agregado correctamente.`);
        return true;
      } catch (err) {
        const message =
          err instanceof ApiError || err instanceof Error
            ? err.message
            : "No se pudo subir el adjunto.";
        setError(message);
        return false;
      } finally {
        setUploading(false);
      }
    },
    [ticketId, toast],
  );

  /**
   * Elimina un adjunto del ticket y lo quita de la lista local.
   * @param attachmentId - ID del adjunto a eliminar.
   * @returns `true` si la eliminación fue correcta.
   */
  const remove = useCallback(
    async (attachmentId: number): Promise<boolean> => {
      if (!ticketId) return false;

      setRemovingId(attachmentId);
      setError("");
      try {
        const removed = await deleteTicketAttachment(ticketId, attachmentId);
        setAttachments((current) => current.filter((item) => item.id !== attachmentId));
        toast.success(`Adjunto "${removed.filename}" eliminado correctamente.`);
        return true;
      } catch (err) {
        const message =
          err instanceof ApiError || err instanceof Error
            ? err.message
            : "No se pudo eliminar el adjunto.";
        setError(message);
        return false;
      } finally {
        setRemovingId(null);
      }
    },
    [ticketId, toast],
  );

  return {
    attachments,
    loading,
    uploading,
    removingId,
    error,
    upload,
    remove,
  };
}
