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

export async function listarPrompts(query: ListarPromptsQuery = {}): Promise<PromptListado> {
  return apiClient.get<PromptListado>("/prompts", {
    query: query as Record<string, string | number | boolean | undefined | null>,
  });
}

export async function obtenerPrompt(id: number): Promise<Prompt> {
  return apiClient.get<Prompt>(`/prompts/${id}`);
}

export async function crearPrompt(payload: CrearPromptPayload): Promise<Prompt> {
  return apiClient.post<Prompt>("/prompts", payload);
}

export async function actualizarPrompt(id: number, payload: ActualizarPromptPayload): Promise<Prompt> {
  return apiClient.patch<Prompt>(`/prompts/${id}`, payload);
}

export async function eliminarPrompt(id: number): Promise<{ id: number; deleted: true }> {
  return apiClient.delete<{ id: number; deleted: true }>(`/prompts/${id}`);
}
