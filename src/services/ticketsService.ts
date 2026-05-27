import { apiClient } from "../api/apiClient";
import type {
  AsistiaCategory,
  AsistiaLocation,
  AsistiaTicket,
  AsistiaTicketListResponse,
  AsistiaUserListResponse,
  CreateTicketInput,
  CreateTicketResponse
} from "../types/asistia";

export async function listCategories(): Promise<AsistiaCategory[]> {
  return apiClient.get<AsistiaCategory[]>("/categories");
}

export async function listLocations(): Promise<AsistiaLocation[]> {
  return apiClient.get<AsistiaLocation[]>("/locations");
}

export async function listTickets(assignedToMe: boolean): Promise<AsistiaTicketListResponse> {
  return apiClient.get<AsistiaTicketListResponse>("/tickets", {
    query: {
      assignedToMe: assignedToMe ? "true" : undefined,
      limit: 100
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
  return apiClient.patch<AsistiaTicket>(`/tickets/${ticketId}/status`, { status });
}

export async function assignTicketTechnician(
  ticketId: number,
  technicianId: number
): Promise<AsistiaTicket> {
  return apiClient.post<AsistiaTicket>(`/tickets/${ticketId}/assign`, { technicianId });
}

export async function searchTechnicians(search?: string): Promise<AsistiaUserListResponse> {
  return apiClient.get<AsistiaUserListResponse>("/users/technicians", {
    query: { search, limit: 20 }
  });
}
