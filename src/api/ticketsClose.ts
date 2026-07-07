/**
 * @file ticketsClose.ts
 * @description Cliente HTTP de cierre masivo de tickets (super admin, SQL-only sobre GLPI).
 */
import { apiClient } from "./apiClient";
import type { AsistiaTicket, AsistiaTicketListResponse } from "@/types/asistia";

/** Columnas ordenables de GET /tickets/close-candidates. */
export type CloseCandidatesSortColumn =
  | "id"
  | "createdAt"
  | "subject"
  | "requester"
  | "location"
  | "status";

export type CloseCandidatesSortOrder = "asc" | "desc";

export interface ListCloseCandidatesQuery {
  page?: number;
  limit?: number;
  includeOpen?: boolean;
  includeSolved?: boolean;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sortBy?: CloseCandidatesSortColumn;
  sortOrder?: CloseCandidatesSortOrder;
}

/** Conteo devuelto por POST /tickets/close-bulk. */
export interface CloseBulkResult {
  requested: number;
  closed: number;
  skipped: number;
  failed: number;
}

type ReadRequestOptions = { signal?: AbortSignal; showBackdrop?: boolean };

/**
 * Lista tickets candidatos a cierre masivo con filtros y paginación.
 * @param query - Filtros de estado, fecha, búsqueda, orden y paginación.
 * @param options - Opciones de petición HTTP.
 * @returns Página de tickets y total.
 */
export async function listCloseCandidates(
  query: ListCloseCandidatesQuery = {},
  options?: ReadRequestOptions,
): Promise<AsistiaTicketListResponse> {
  return apiClient.get<AsistiaTicketListResponse>("/tickets/close-candidates", {
    ...options,
    query: {
      page: query.page ?? 1,
      limit: query.limit ?? 25,
      includeOpen: query.includeOpen ? true : undefined,
      includeSolved: query.includeSolved ? true : undefined,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      search: query.search || undefined,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    },
  });
}

/**
 * Obtiene el detalle de un candidato a cierre masivo.
 * @param ticketId - ID del ticket.
 * @param options - Opciones de petición HTTP.
 * @returns Ticket enriquecido.
 */
export async function getCloseCandidateDetail(
  ticketId: number,
  options?: ReadRequestOptions,
): Promise<AsistiaTicket> {
  return apiClient.get<AsistiaTicket>(`/tickets/close-candidates/${ticketId}`, {
    ...options,
    showBackdrop: options?.showBackdrop ?? false,
  });
}

/**
 * Cierra en bloque los tickets indicados, 100% vía SQL.
 * @param ticketIds - IDs de tickets a cerrar.
 * @returns Conteo de solicitados, cerrados, omitidos y fallidos.
 */
export async function closeBulk(ticketIds: number[]): Promise<CloseBulkResult> {
  return apiClient.post<CloseBulkResult>(
    "/tickets/close-bulk",
    { ticketIds },
    { showBackdrop: false, timeoutMs: 60_000 },
  );
}
