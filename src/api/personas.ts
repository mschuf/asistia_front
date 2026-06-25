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

  proveedorId: number;

  proveedorNombre: string;

  email: string | null;

  telefono: string | null;

  activo: boolean;

  hasFoto: boolean;

  ultimoMotivo: number | null;

  ultimoResponsable: number | null;

  createdAt: string;

  updatedAt: string;

}



export interface VisitPersonCandidate {

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



export type PersonaSortColumn = "id" | "nombre" | "documento" | "proveedorNombre" | "createdAt";

export type PersonaSortOrder = "asc" | "desc";



export interface ListarPersonasQuery {

  page?: number;

  limit?: number;

  search?: string;

  nombre?: string;

  documento?: string;

  proveedor?: string;

  proveedorId?: number;

  activo?: boolean;

  sortBy?: PersonaSortColumn;

  sortOrder?: PersonaSortOrder;

}



export interface CrearPersonaPayload {

  nombre: string;

  documento: string;

  proveedorId: number;

  email?: string;

  telefono?: string;

  activo?: boolean;

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



/** Busca personas activas para el selector de visitas. */

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


