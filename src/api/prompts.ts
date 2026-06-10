/**
 * @file prompts.ts
 * @description Cliente HTTP CRUD de prompts de clasificación por empresa.
 */
import { apiClient } from "./apiClient";

export interface Prompt {
  id: number;
  companyId: number;
  companyName: string;
  systemInstruction: string;
  promptTemplate: string;
  createdAt: string;
  updatedAt: string;
}

export interface PromptListado {
  items: Prompt[];
  total: number;
  page: number;
  limit: number;
}

export interface ListarPromptsQuery {
  page?: number;
  limit?: number;
  search?: string;
  companyId?: number;
}

export interface CrearPromptPayload {
  companyId: number;
  systemInstruction: string;
  promptTemplate: string;
}

export type ActualizarPromptPayload = Partial<CrearPromptPayload>;

/**
 * Lista prompts con paginación y búsqueda.
 * @param query - Filtros de página, límite, búsqueda y empresa.
 * @returns Página de prompts.
 */
export async function listarPrompts(query: ListarPromptsQuery = {}): Promise<PromptListado> {
  return apiClient.get<PromptListado>("/prompts", {
    query: query as Record<string, string | number | boolean | undefined | null>,
  });
}

/**
 * Obtiene un prompt por ID.
 * @param id - ID del prompt.
 * @returns Prompt solicitado.
 */
export async function obtenerPrompt(id: number): Promise<Prompt> {
  return apiClient.get<Prompt>(`/prompts/${id}`);
}

/**
 * Crea un prompt para una empresa.
 * @param payload - Empresa, instrucción y plantilla.
 * @returns Prompt creado.
 */
export async function crearPrompt(payload: CrearPromptPayload): Promise<Prompt> {
  return apiClient.post<Prompt>("/prompts", payload);
}

/**
 * Actualiza un prompt existente.
 * @param id - ID del prompt.
 * @param payload - Campos parciales a actualizar.
 * @returns Prompt actualizado.
 */
export async function actualizarPrompt(id: number, payload: ActualizarPromptPayload): Promise<Prompt> {
  return apiClient.patch<Prompt>(`/prompts/${id}`, payload);
}

/**
 * Elimina definitivamente un prompt.
 * @param id - ID del prompt.
 * @returns Confirmación de eliminación.
 */
export async function eliminarPrompt(id: number): Promise<{ id: number; deleted: true }> {
  return apiClient.delete<{ id: number; deleted: true }>(`/prompts/${id}`);
}
