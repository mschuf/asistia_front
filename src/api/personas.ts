/**
 * @file personas.ts
 * @description Cliente HTTP CRUD de personas para el módulo Portería.
 */
import { apiClient } from "./apiClient";

export interface Persona {
  id: number;
  nombre: string;
  documento: string;
  empresa: string | null;
  email: string | null;
  telefono: string | null;
  glpiUserId: number | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export type VisitPersonCandidateSource = "postgres" | "glpi";

export interface VisitPersonCandidate {
  source: VisitPersonCandidateSource;
  id: number;
  fullName: string;
  subtitle: string;
}

export interface VisitPersonCandidateListado {
  items: VisitPersonCandidate[];
  total: number;
}

export interface PersonaListado {
  items: Persona[];
  total: number;
  page: number;
  limit: number;
}

export type PersonaSortColumn = "id" | "nombre" | "documento" | "empresa" | "createdAt";
export type PersonaSortOrder = "asc" | "desc";

export interface ListarPersonasQuery {
  page?: number;
  limit?: number;
  search?: string;
  nombre?: string;
  documento?: string;
  empresa?: string;
  activo?: boolean;
  sortBy?: PersonaSortColumn;
  sortOrder?: PersonaSortOrder;
}

export interface CrearPersonaPayload {
  nombre: string;
  documento: string;
  empresa?: string;
  email?: string;
  telefono?: string;
  activo?: boolean;
  glpiUserId?: number;
}

export interface GlpiPersonaPreview {
  glpiUserId: number;
  nombre: string;
  documento: string;
  email: string | null;
  telefono: string | null;
  empresa: string | null;
}

export type ActualizarPersonaPayload = Partial<CrearPersonaPayload>;

/** Lista personas con paginación, filtros y orden. */
export async function listarPersonas(query: ListarPersonasQuery = {}): Promise<PersonaListado> {
  return apiClient.get<PersonaListado>("/personas", {
    query: query as Record<string, string | number | boolean | undefined | null>,
  });
}

/** Obtiene una persona por ID. */
export async function obtenerPersona(
  id: number,
  options?: { signal?: AbortSignal },
): Promise<Persona> {
  return apiClient.get<Persona>(`/personas/${id}`, options);
}

/** Crea una persona nueva. */
export async function crearPersona(payload: CrearPersonaPayload): Promise<Persona> {
  return apiClient.post<Persona>("/personas", payload);
}

/** Actualiza una persona existente. */
export async function actualizarPersona(id: number, payload: ActualizarPersonaPayload): Promise<Persona> {
  return apiClient.patch<Persona>(`/personas/${id}`, payload);
}

/** Desactiva una persona (soft delete). */
export async function desactivarPersona(id: number): Promise<Persona> {
  return apiClient.patch<Persona>(`/personas/${id}/deactivate`);
}

/** Reactiva una persona previamente desactivada. */
export async function activarPersona(id: number): Promise<Persona> {
  return actualizarPersona(id, { activo: true });
}

/** Elimina definitivamente una persona. */
export async function eliminarPersona(id: number): Promise<{ id: number; deleted: true }> {
  return apiClient.delete<{ id: number; deleted: true }>(`/personas/${id}`);
}

/** Busca candidatos unificados (Postgres + GLPI) para el selector de visitas. */
export async function searchVisitPersonCandidates(
  search: string,
  limit = 20,
  options?: { signal?: AbortSignal },
): Promise<VisitPersonCandidateListado> {
  return apiClient.get<VisitPersonCandidateListado>("/personas/visit-candidates", {
    ...options,
    query: { search: search.trim() || undefined, limit },
  });
}

/** Obtiene o crea una persona vinculada a un usuario GLPI. */
export async function ensurePersonaFromGlpi(glpiUserId: number): Promise<Persona> {
  return apiClient.post<Persona>(`/personas/from-glpi/${glpiUserId}`);
}

/** Vista previa de persona a partir de un usuario GLPI sin persistir. */
export async function previewPersonaFromGlpi(
  glpiUserId: number,
  options?: { signal?: AbortSignal },
): Promise<GlpiPersonaPreview> {
  return apiClient.get<GlpiPersonaPreview>(`/personas/glpi-preview/${glpiUserId}`, options);
}
