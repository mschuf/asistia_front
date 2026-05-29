import { apiClient } from "../api/apiClient";
import type {
  AsistiaCategory,
  AsistiaLocation,
  AsistiaTicket,
  AsistiaTicketListResponse,
  AsistiaUser,
  AsistiaUserListResponse,
  CreateTicketInput,
  CreateTicketResponse,
  TiMetricsResponse
} from "../types/asistia";

type ReadRequestOptions = { signal?: AbortSignal };

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

export async function listCategories(options?: ReadRequestOptions): Promise<AsistiaCategory[]> {
  return apiClient.get<AsistiaCategory[]>("/categories", options);
}

export async function listLocations(options?: ReadRequestOptions): Promise<AsistiaLocation[]> {
  return apiClient.get<AsistiaLocation[]>("/locations", options);
}

export async function fetchTiMetrics(options?: ReadRequestOptions): Promise<TiMetricsResponse> {
  return apiClient.get<TiMetricsResponse>("/tickets/metrics", {
    ...options,
    showBackdrop: false,
    timeoutMs: 60_000,
  });
}

export interface ListTicketsParams {
  page?: number;
  limit?: number;
  technicianId?: number;
  locationId?: number;
  status?: AsistiaTicket["status"];
  statuses?: AsistiaTicket["status"][];
  type?: AsistiaTicket["type"];
  search?: string;
}

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
      locationId: params?.locationId,
      status: params?.status,
      statuses: params?.statuses?.length ? params.statuses.join(",") : undefined,
      type: params?.type,
      search: params?.search,
    }
  });
}

export async function listHistoryTickets(
  params?: ListTicketsParams,
  options?: ReadRequestOptions
): Promise<AsistiaTicketListResponse> {
  return apiClient.get<AsistiaTicketListResponse>("/tickets/history", {
    ...options,
    query: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 15,
      technicianId: params?.technicianId,
      locationId: params?.locationId,
      status: params?.status,
      statuses: params?.statuses?.length ? params.statuses.join(",") : undefined,
      type: params?.type,
      search: params?.search,
    }
  });
}

export async function createTicket(input: CreateTicketInput): Promise<CreateTicketResponse> {
  return apiClient.post<CreateTicketResponse>("/tickets", input);
}

export async function updateTicketStatus(
  ticketId: number,
  status: AsistiaTicket["status"]
): Promise<AsistiaTicket> {
  const response = await apiClient.patch<unknown>(
    `/tickets/${ticketId}/status`,
    { status },
    { showBackdrop: false, timeoutMs: 30_000 }
  );
  return coerceTicketPayload(response);
}

export async function assignTicketTechnician(
  ticketId: number,
  technicianId: number
): Promise<AsistiaTicket> {
  return apiClient.post<AsistiaTicket>(`/tickets/${ticketId}/assign`, { technicianId });
}

export async function searchTechnicians(
  search?: string,
  limit = 20,
  options?: ReadRequestOptions
): Promise<AsistiaUserListResponse> {
  return apiClient.get<AsistiaUserListResponse>("/users/technicians", {
    ...options,
    query: { search, limit }
  });
}

export async function searchUsers(
  search?: string,
  limit = 20,
  options?: ReadRequestOptions
): Promise<AsistiaUserListResponse> {
  return apiClient.get<AsistiaUserListResponse>("/users", {
    ...options,
    query: { search, limit }
  });
}

export async function getUserById(
  userId: number,
  options?: ReadRequestOptions
): Promise<AsistiaUser> {
  return apiClient.get<AsistiaUser>(`/users/${userId}`, options);
}
