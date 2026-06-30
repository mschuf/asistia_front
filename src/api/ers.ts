/**
 * @file ers.ts
 * @description Cliente HTTP para ERS (ticket escalado a proyecto GLPI).
 */
import { apiClient } from "./apiClient";

export interface ErsListItem {
  projectId: number;
  projectName: string;
  ticketId: number;
  requesterId: number | null;
  requesterName: string | null;
  locationId: number | null;
  locationName: string | null;
  approverId: number | null;
  approverName: string | null;
  projectStateId: number | null;
  projectStateName: string | null;
  progress: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ErsTeamMember {
  userId: number;
  fullName: string;
}

export interface ErsTask {
  id: number;
  name: string;
  content: string | null;
  percentDone: number;
  projectStateId: number | null;
  projectStateName: string | null;
  userId: number | null;
  userName: string | null;
  planStartDate: string | null;
  planEndDate: string | null;
}

export interface ErsDetail {
  projectId: number;
  projectName: string;
  ticketId: number;
  requesterId: number | null;
  requesterName: string | null;
  locationId: number | null;
  locationName: string | null;
  objective: string | null;
  description: string | null;
  impact: string | null;
  approverId: number | null;
  approverName: string | null;
  projectStateId: number | null;
  projectStateName: string | null;
  progress: number;
  updatedAt: string | null;
  team: ErsTeamMember[];
  tasks: ErsTask[];
}

export interface ErsListResponse {
  items: ErsListItem[];
  total: number;
  page: number;
  limit: number;
}

export type ErsSortColumn =
  | "projectId"
  | "projectName"
  | "ticketId"
  | "requesterName"
  | "locationName"
  | "stateName"
  | "progress"
  | "updatedAt";

export type ErsSortOrder = "asc" | "desc";

export interface ListarErsQuery {
  page?: number;
  limit?: number;
  search?: string;
  projectName?: string;
  requesterName?: string;
  locationName?: string;
  approverName?: string;
  projectStateId?: number;
  sortBy?: ErsSortColumn;
  sortOrder?: ErsSortOrder;
}

export interface EscalarTicketErsPayload {
  ticketId: number;
  projectName: string;
  objective?: string;
  description?: string;
  impact?: string;
  responsibleIds: number[];
}

export interface SaveErsTaskPayload {
  name: string;
  content?: string;
  percentDone: number;
  projectStateId?: number;
  userId?: number;
  planStartDate?: string;
  planEndDate?: string;
}

export interface SaveErsPayload {
  projectName?: string;
  objective?: string;
  description?: string;
  impact?: string;
  approverId?: number;
  projectStateId?: number;
  teamMemberIds: number[];
  tasks: SaveErsTaskPayload[];
}

export interface ErsProjectState {
  id: number;
  name: string;
  color: string | null;
  isFinished: boolean;
}

export interface ErsTechnician {
  id: number;
  fullName: string;
  locationId: number | null;
}

export interface ErsTechnicianListResponse {
  items: ErsTechnician[];
  total: number;
  page: number;
  limit: number;
}

export interface ListarErsTechniciansQuery {
  page?: number;
  limit?: number;
  locationId?: number;
  search?: string;
}

/** Lista ERS con paginación, filtros y orden server-side. */
export async function listarErs(query: ListarErsQuery = {}): Promise<ErsListResponse> {
  return apiClient.get<ErsListResponse>("/ers", {
    query: query as Record<string, string | number | boolean | undefined | null>,
  });
}

/** Obtiene un ERS por ID de proyecto. */
export async function obtenerErs(projectId: number, options?: { signal?: AbortSignal }): Promise<ErsDetail> {
  return apiClient.get<ErsDetail>(`/ers/${projectId}`, options);
}

/** Transacción 1: escala ticket a proyecto ERS. */
export async function escalarTicket(payload: EscalarTicketErsPayload): Promise<ErsDetail> {
  return apiClient.post<ErsDetail>("/ers/escalar", payload, { timeoutMs: 60_000 });
}

/** Transacción 2: guardado único de edición TI. */
export async function guardarErs(projectId: number, payload: SaveErsPayload): Promise<ErsDetail> {
  return apiClient.put<ErsDetail>(`/ers/${projectId}`, payload, { timeoutMs: 60_000 });
}

/** Lista estados de proyecto disponibles en GLPI. */
export async function listarEstadosProyecto(): Promise<ErsProjectState[]> {
  return apiClient.get<ErsProjectState[]>("/ers/states");
}

/** Lista técnicos elegibles, opcionalmente filtrados por sede. */
export async function listarTecnicosPorSede(
  query: ListarErsTechniciansQuery = {},
  options?: { signal?: AbortSignal },
): Promise<ErsTechnicianListResponse> {
  return apiClient.get<ErsTechnicianListResponse>("/ers/technicians", {
    ...options,
    query: query as Record<string, string | number | boolean | undefined | null>,
  });
}

