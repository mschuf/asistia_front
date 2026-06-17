/**
 * @file personas.ts
 * @description Cliente HTTP CRUD de personas para el módulo Portería.
 */
import { apiClient } from "./apiClient";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const API_URL = configuredApiUrl || (import.meta.env.DEV ? "/api/v1" : "");

const PERSONA_PHOTO_UPLOAD_TIMEOUT_MS = 180_000;

export interface Persona {
  id: number;
  nombre: string;
  documento: string;
  empresa: string | null;
  email: string | null;
  telefono: string | null;
  glpiUserId: number | null;
  activo: boolean;
  hasFoto: boolean;
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

/** Construye la URL del endpoint binario de foto de persona. */
export function obtenerFotoPersonaUrl(personaId: number): string {
  if (!API_URL) {
    throw new Error("VITE_API_URL no está configurado.");
  }

  const base = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
  return `${base}/personas/${personaId}/foto`;
}

/** Obtiene la foto de una persona como blob autenticado por cookie. */
export async function obtenerFotoPersonaBlob(
  personaId: number,
  options?: { signal?: AbortSignal },
): Promise<Blob> {
  const { blob } = await apiClient.download(`/personas/${personaId}/foto`, {
    signal: options?.signal,
    showBackdrop: false,
  });
  return blob;
}

/** Sube o reemplaza la foto de una persona. */
export async function subirFotoPersona(
  personaId: number,
  file: File,
  options?: { signal?: AbortSignal },
): Promise<Persona> {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.post<Persona>(`/personas/${personaId}/foto`, formData, {
    timeoutMs: PERSONA_PHOTO_UPLOAD_TIMEOUT_MS,
    signal: options?.signal,
  });
}

/** Elimina la foto almacenada de una persona. */
export async function eliminarFotoPersona(
  personaId: number,
  options?: { signal?: AbortSignal },
): Promise<Persona> {
  return apiClient.delete<Persona>(`/personas/${personaId}/foto`, options);
}

