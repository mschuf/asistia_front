/**
 * @file motivos-visita.ts
 * @description Cliente HTTP CRUD de motivos de visita para el módulo Portería.
 */
import { apiClient } from "./apiClient";

export interface MotivoVisita {
  id: number;
  nombre: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MotivoVisitaListado {
  items: MotivoVisita[];
  total: number;
  page: number;
  limit: number;
}

export interface MotivoVisitCandidate {
  id: number;
  fullName: string;
  subtitle: string;
}

export interface MotivoVisitCandidateListado {
  items: MotivoVisitCandidate[];
  total: number;
}

export type MotivoVisitaSortColumn = "id" | "nombre" | "createdAt";
export type MotivoVisitaSortOrder = "asc" | "desc";

export interface ListarMotivosVisitaQuery {
  page?: number;
  limit?: number;
  search?: string;
  nombre?: string;
  activo?: boolean;
  sortBy?: MotivoVisitaSortColumn;
  sortOrder?: MotivoVisitaSortOrder;
}

export interface CrearMotivoVisitaPayload {
  nombre: string;
  activo?: boolean;
}

export type ActualizarMotivoVisitaPayload = Partial<CrearMotivoVisitaPayload>;

/** Lista motivos de visita con paginación, filtros y orden. */
export async function listarMotivosVisita(
  query: ListarMotivosVisitaQuery = {},
  options?: { signal?: AbortSignal },
): Promise<MotivoVisitaListado> {
  return apiClient.get<MotivoVisitaListado>("/motivos-visita", {
    ...options,
    query: query as Record<string, string | number | boolean | undefined | null>,
  });
}

/** Obtiene un motivo de visita por ID. */
export async function obtenerMotivoVisita(
  id: number,
  options?: { signal?: AbortSignal },
): Promise<MotivoVisita> {
  return apiClient.get<MotivoVisita>(`/motivos-visita/${id}`, options);
}

/** Busca motivos activos para el selector de visitas. */
export async function searchMotivoVisitCandidates(
  search = "",
  limit = 20,
  options?: { signal?: AbortSignal },
): Promise<MotivoVisitCandidateListado> {
  return apiClient.get<MotivoVisitCandidateListado>("/motivos-visita/visit-candidates", {
    ...options,
    query: { search: search || undefined, limit },
  });
}

/** Crea un motivo de visita nuevo. */
export async function crearMotivoVisita(payload: CrearMotivoVisitaPayload): Promise<MotivoVisita> {
  return apiClient.post<MotivoVisita>("/motivos-visita", payload);
}

/** Actualiza un motivo de visita existente. */
export async function actualizarMotivoVisita(
  id: number,
  payload: ActualizarMotivoVisitaPayload,
): Promise<MotivoVisita> {
  return apiClient.patch<MotivoVisita>(`/motivos-visita/${id}`, payload);
}

/** Desactiva un motivo de visita (soft delete). */
export async function desactivarMotivoVisita(id: number): Promise<MotivoVisita> {
  return apiClient.patch<MotivoVisita>(`/motivos-visita/${id}/deactivate`);
}

/** Reactiva un motivo de visita previamente desactivado. */
export async function activarMotivoVisita(id: number): Promise<MotivoVisita> {
  return apiClient.patch<MotivoVisita>(`/motivos-visita/${id}/activate`);
}

/** Elimina definitivamente un motivo de visita sin visitas asociadas. */
export async function eliminarMotivoVisita(id: number): Promise<{ id: number; deleted: true }> {
  return apiClient.delete<{ id: number; deleted: true }>(`/motivos-visita/${id}`);
}
