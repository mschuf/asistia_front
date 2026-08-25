/**
 * @file ticketActivityService.ts
 * @description Servicio HTTP del historial de un ticket (adjuntos agregados y ediciones de texto).
 */
import { apiClient } from "@/api/apiClient";
import type { TicketActivityEntry } from "@/types/asistia";

/**
 * Lista el historial de un ticket, de lo más reciente a lo más antiguo.
 * @param ticketId - ID del ticket.
 * @param options - Señal de aborto opcional.
 * @returns Entradas de adjuntos y ediciones con autor y fecha.
 */
export async function listTicketActivity(
  ticketId: number,
  options?: { signal?: AbortSignal },
): Promise<TicketActivityEntry[]> {
  return apiClient.get<TicketActivityEntry[]>(`/tickets/${ticketId}/activity`, {
    signal: options?.signal,
    showBackdrop: false,
  });
}
