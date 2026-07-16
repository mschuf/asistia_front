/**
 * @file ticketsService.ts
 * @description Cliente HTTP para tickets, catálogos, métricas y usuarios técnicos.
 */
import { apiClient } from "../api/apiClient";
import type {
  AsistiaCategory,
  AsistiaLocation,
  AsistiaTicket,
  AsistiaTicketListResponse,
  UpdateTicketStatusResponse,
  AsistiaUser,
  AsistiaUserListResponse,
  CreateTicketInput,
  CreateTicketResponse,
  TiMetricsResponse
} from "../types/asistia";
import type { HistorySortColumn, HistorySortOrder } from "../types/pages/tickets-page.types";

type ReadRequestOptions = { signal?: AbortSignal; showBackdrop?: boolean };

type ListLocationsOptions = ReadRequestOptions & { activeOnly?: boolean };

/** Normaliza la respuesta de ticket del envelope `{ success, data }`. */
function coerceTicketPayload(payload: unknown): AsistiaTicket {
  if (!payload || typeof payload !== "object") {
    throw new Error("La API no devolvió un ticket válido.");
  }

  const record = payload as Record<string, unknown>;
  if (
    record.success === true &&
    record.data &&
    typeof record.data === "object"
  ) {
    return record.data as AsistiaTicket;
  }

  return payload as AsistiaTicket;
}

/**
 * Lista categorías GLPI activas.
 * @param options - Señal de aborto y backdrop opcionales.
 * @returns Categorías disponibles.
 */
export async function listCategories(options?: ReadRequestOptions): Promise<AsistiaCategory[]> {
  return apiClient.get<AsistiaCategory[]>("/categories", options);
}

/**
 * Lista sedes/ubicaciones.
 * @param options - Filtro `activeOnly`, señal y backdrop opcionales.
 * @returns Sedes disponibles.
 */
export async function listLocations(options?: ListLocationsOptions): Promise<AsistiaLocation[]> {
  return apiClient.get<AsistiaLocation[]>("/locations", {
    ...options,
    query: {
      activeOnly: options?.activeOnly ? true : undefined,
    },
  });
}

/**
 * Obtiene métricas TI agregadas de tickets.
 * @param options - Señal, backdrop y timeout opcionales.
 * @returns Respuesta con indicadores por sede y usuario.
 */
export async function fetchTiMetrics(options?: ReadRequestOptions): Promise<TiMetricsResponse> {
  return apiClient.get<TiMetricsResponse>("/tickets/metrics", {
    ...options,
    showBackdrop: options?.showBackdrop ?? false,
    timeoutMs: 60_000,
  });
}

export interface ListTicketsParams {
  page?: number;
  limit?: number;
  technicianId?: number;
  requesterId?: number;
  locationId?: number;
  status?: AsistiaTicket["status"];
  statuses?: AsistiaTicket["status"][];
  type?: AsistiaTicket["type"];
  search?: string;
  createdFrom?: string;
  createdTo?: string;
  involvingMe?: boolean;
  sortBy?: HistorySortColumn;
  sortOrder?: HistorySortOrder;
  allStatuses?: boolean;
}

/**
 * Lista tickets con paginación y filtros.
 * @param params - Filtros de página, estado, técnico, sede y búsqueda.
 * @param options - Opciones de petición HTTP.
 * @returns Página de tickets e total.
 */
export async function listTickets(
  params?: ListTicketsParams,
  options?: ReadRequestOptions
): Promise<AsistiaTicketListResponse> {
  return apiClient.get<AsistiaTicketListResponse>("/tickets", {
    ...options,
    query: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 15,
      technicianId: params?.technicianId,
      requesterId: params?.requesterId,
      locationId: params?.locationId,
      status: params?.status,
      statuses: params?.statuses?.length ? params.statuses.join(",") : undefined,
      type: params?.type,
      search: params?.search,
    }
  });
}

/**
 * Lista tickets del historial con backdrop por defecto.
 * @param params - Filtros de listado.
 * @param options - Opciones de petición HTTP.
 * @returns Página de tickets del historial.
 */
export async function listHistoryTickets(
  params?: ListTicketsParams,
  options?: ReadRequestOptions
): Promise<AsistiaTicketListResponse> {
  return apiClient.get<AsistiaTicketListResponse>("/tickets/history", {
    ...options,
    showBackdrop: options?.showBackdrop ?? true,
    query: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 15,
      technicianId: params?.technicianId,
      requesterId: params?.requesterId,
      locationId: params?.locationId,
      status: params?.status,
      statuses: params?.statuses?.length ? params.statuses.join(",") : undefined,
      type: params?.type,
      search: params?.search,
      createdFrom: params?.createdFrom,
      createdTo: params?.createdTo,
      involvingMe: params?.involvingMe ? true : undefined,
      sortBy: params?.sortBy,
      sortOrder: params?.sortOrder,
      allStatuses: params?.allStatuses ? true : undefined,
    }
  });
}

/**
 * Obtiene un ticket por ID.
 * @param ticketId - ID del ticket.
 * @param options - Opciones de petición HTTP.
 * @returns Ticket completo.
 */
export async function getTicketById(
  ticketId: number,
  options?: ReadRequestOptions
): Promise<AsistiaTicket> {
  const response = await apiClient.get<unknown>(`/tickets/${ticketId}`, {
    ...options,
    showBackdrop: false,
  });
  return coerceTicketPayload(response);
}

/**
 * Crea un ticket nuevo.
 * @param input - Datos del ticket a crear.
 * @returns Ticket creado con metadatos de correo.
 */
export async function createTicket(input: CreateTicketInput): Promise<CreateTicketResponse> {
  return apiClient.post<CreateTicketResponse>("/tickets", input, { timeoutMs: 60_000 });
}

export type UpdateTicketStatusOptions = {
  resolutionNote?: string;
};

/**
 * Actualiza el estado de un ticket.
 * @param ticketId - ID del ticket.
 * @param status - Nuevo estado.
 * @param options - Nota de resolución opcional.
 * @returns Ticket actualizado.
 */
export async function updateTicketStatus(
  ticketId: number,
  status: AsistiaTicket["status"],
  options?: UpdateTicketStatusOptions
): Promise<UpdateTicketStatusResponse> {
  const body: { status: AsistiaTicket["status"]; resolutionNote?: string } = { status };
  const note = options?.resolutionNote?.trim();
  if (note) {
    body.resolutionNote = note;
  }

  const response = await apiClient.patch<unknown>(
    `/tickets/${ticketId}/status`,
    body,
    { showBackdrop: false, timeoutMs: 30_000 }
  );
  return coerceTicketPayload(response) as UpdateTicketStatusResponse;
}

/**
 * Asigna un técnico a un ticket.
 * @param ticketId - ID del ticket.
 * @param technicianId - ID del técnico.
 * @returns Ticket con asignación actualizada.
 */
export async function assignTicketTechnician(
  ticketId: number,
  technicianId: number
): Promise<AsistiaTicket> {
  const response = await apiClient.post<unknown>(
    `/tickets/${ticketId}/assign`,
    { technicianId },
    { showBackdrop: false, timeoutMs: 30_000 }
  );
  return coerceTicketPayload(response);
}

/**
 * Cambia la sede de un ticket.
 * @param ticketId - ID del ticket.
 * @param locationId - ID de la nueva sede.
 * @returns Ticket con sede actualizada.
 */
export async function updateTicketLocation(
  ticketId: number,
  locationId: number
): Promise<AsistiaTicket> {
  const response = await apiClient.patch<unknown>(
    `/tickets/${ticketId}/location`,
    { locationId },
    { showBackdrop: false, timeoutMs: 30_000 }
  );
  return coerceTicketPayload(response);
}

/**
 * Cambia el solicitante de un ticket.
 * @param ticketId - ID del ticket.
 * @param requesterId - ID del nuevo solicitante.
 * @returns Ticket con solicitante actualizado.
 */
export async function updateTicketRequester(
  ticketId: number,
  requesterId: number
): Promise<AsistiaTicket> {
  const response = await apiClient.patch<unknown>(
    `/tickets/${ticketId}/requester`,
    { requesterId },
    { showBackdrop: false, timeoutMs: 30_000 }
  );
  return coerceTicketPayload(response);
}

/**
 * Actualiza el tag (glpi_tickets.name) de un ticket. Solo super admin.
 * @param ticketId - ID del ticket.
 * @param tag - Nuevo tag (máx. 15 caracteres; vacío lo limpia).
 * @returns Ticket con el tag actualizado.
 */
export async function updateTicketTag(
  ticketId: number,
  tag: string
): Promise<AsistiaTicket> {
  const response = await apiClient.patch<unknown>(
    `/tickets/${ticketId}/tag`,
    { tag },
    { showBackdrop: false, timeoutMs: 30_000 }
  );
  return coerceTicketPayload(response);
}

/**
 * Busca técnicos activos por texto.
 * @param search - Texto de búsqueda opcional.
 * @param limit - Límite de resultados opcional.
 * @param options - Opciones de petición HTTP.
 * @returns Lista paginada de técnicos.
 */
export async function searchTechnicians(
  search?: string,
  limit?: number,
  options?: ReadRequestOptions
): Promise<AsistiaUserListResponse> {
  return apiClient.get<AsistiaUserListResponse>("/users/technicians", {
    ...options,
    query: { search, limit: limit ?? undefined }
  });
}

/**
 * Busca usuarios por texto.
 * @param search - Texto de búsqueda opcional.
 * @param limit - Límite de resultados opcional.
 * @param options - Opciones de petición HTTP.
 * @returns Lista paginada de usuarios.
 */
export async function searchUsers(
  search?: string,
  limit?: number,
  options?: ReadRequestOptions
): Promise<AsistiaUserListResponse> {
  return apiClient.get<AsistiaUserListResponse>("/users", {
    ...options,
    query: { search, limit: limit ?? undefined }
  });
}

/**
 * Obtiene un usuario por ID.
 * @param userId - ID del usuario.
 * @param options - Opciones de petición HTTP.
 * @returns Usuario solicitado.
 */
export async function getUserById(
  userId: number,
  options?: ReadRequestOptions
): Promise<AsistiaUser> {
  return apiClient.get<AsistiaUser>(`/users/${userId}`, options);
}
