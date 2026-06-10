/**
 * @file attachmentsService.ts
 * @description Servicio HTTP para adjuntos de tickets: subida, listado y descarga.
 */
import { apiClient } from "@/api/apiClient";
import type { TicketAttachment } from "@/types/asistia";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const API_URL = configuredApiUrl || (import.meta.env.DEV ? "/api/v1" : "");

const UPLOAD_TIMEOUT_MS = 180_000;

/**
 * Sube un archivo adjunto a un ticket.
 * @param ticketId - ID del ticket destino.
 * @param file - Archivo a subir.
 * @param options - Señal de aborto opcional.
 * @returns Metadatos del adjunto creado.
 */
export async function uploadTicketAttachment(
  ticketId: number,
  file: File,
  options?: { signal?: AbortSignal },
): Promise<TicketAttachment> {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.post<TicketAttachment>(`/tickets/${ticketId}/attachments`, formData, {
    timeoutMs: UPLOAD_TIMEOUT_MS,
    signal: options?.signal,
  });
}

/**
 * Lista los adjuntos de un ticket.
 * @param ticketId - ID del ticket.
 * @param options - Señal de aborto opcional.
 * @returns Array de adjuntos.
 */
export async function listTicketAttachments(
  ticketId: number,
  options?: { signal?: AbortSignal },
): Promise<TicketAttachment[]> {
  return apiClient.get<TicketAttachment[]>(`/tickets/${ticketId}/attachments`, {
    signal: options?.signal,
    showBackdrop: false,
  });
}

/**
 * Construye la URL de descarga de un adjunto con credenciales de cookie.
 * @param ticketId - ID del ticket.
 * @param attachmentId - ID del adjunto.
 * @returns URL absoluta del endpoint de descarga.
 */
export function buildTicketAttachmentDownloadUrl(ticketId: number, attachmentId: number): string {
  if (!API_URL) {
    throw new Error("VITE_API_URL no está configurado.");
  }

  const base = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
  return `${base}/tickets/${ticketId}/attachments/${attachmentId}/download`;
}

/**
 * Obtiene el blob de un adjunto autenticado por cookie.
 * @param ticketId - ID del ticket.
 * @param attachmentId - ID del adjunto.
 * @param options - Señal de aborto opcional.
 * @returns Blob del archivo.
 */
export async function fetchTicketAttachmentBlob(
  ticketId: number,
  attachmentId: number,
  options?: { signal?: AbortSignal },
): Promise<Blob> {
  const response = await fetch(buildTicketAttachmentDownloadUrl(ticketId, attachmentId), {
    credentials: "include",
    signal: options?.signal,
  });

  if (!response.ok) {
    throw new Error("No se pudo obtener el adjunto.");
  }

  return response.blob();
}

/**
 * Descarga un adjunto disparando un enlace temporal en el navegador.
 * @param ticketId - ID del ticket.
 * @param attachmentId - ID del adjunto.
 * @param filename - Nombre sugerido para el archivo descargado.
 * @returns void
 */
export async function downloadTicketAttachment(
  ticketId: number,
  attachmentId: number,
  filename: string,
): Promise<void> {
  const blob = await fetchTicketAttachmentBlob(ticketId, attachmentId);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
