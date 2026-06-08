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

type ReadRequestOptions = { signal?: AbortSignal; showBackdrop?: boolean };

type ListLocationsOptions = ReadRequestOptions & { activeOnly?: boolean };

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

export async function listLocations(options?: ListLocationsOptions): Promise<AsistiaLocation[]> {
  return apiClient.get<AsistiaLocation[]>("/locations", {
    ...options,
    query: {
      activeOnly: options?.activeOnly ? true : undefined,
    },
  });
}

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
    showBackdrop: options?.showBackdrop ?? true,
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

export async function createTicket(input: CreateTicketInput): Promise<CreateTicketResponse> {
  return apiClient.post<CreateTicketResponse>("/tickets", input, { timeoutMs: 60_000 });
}

export type UpdateTicketStatusOptions = {
  resolutionNote?: string;
};

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

export async function getUserById(
  userId: number,
  options?: ReadRequestOptions
): Promise<AsistiaUser> {
  return apiClient.get<AsistiaUser>(`/users/${userId}`, options);
}
