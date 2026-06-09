import { apiClient } from "./apiClient";

export interface Empresa {
  id: number;
  name: string;
  isActive: boolean;
  msTenantId: string;
  msClientId: string;
  hasClientSecret: boolean;
  clientSecretMasked: string | null;
  msMailbox: string;
  msMailFolder: string;
  geminiModel: string;
  daemonMaxEmails: number;
  daemonIntervalSeconds: number;
  createdAt: string;
  updatedAt: string;
}

export interface EmpresaListado {
  items: Empresa[];
  total: number;
  page: number;
  limit: number;
}

export interface ListarEmpresasQuery {
  page?: number;
  limit?: number;
  search?: string;
  activeOnly?: boolean;
}

export interface CrearEmpresaPayload {
  name: string;
  isActive?: boolean;
  msTenantId: string;
  msClientId: string;
  msClientSecret: string;
  msMailbox: string;
  msMailFolder?: string;
  geminiModel?: string;
  daemonMaxEmails?: number;
  daemonIntervalSeconds?: number;
}

export type ActualizarEmpresaPayload = Partial<
  Omit<CrearEmpresaPayload, "msClientSecret"> & { msClientSecret?: string }
>;

export async function listarEmpresas(query: ListarEmpresasQuery = {}): Promise<EmpresaListado> {
  return apiClient.get<EmpresaListado>("/companies", {
    query: query as Record<string, string | number | boolean | undefined | null>,
  });
}

export async function obtenerEmpresa(id: number): Promise<Empresa> {
  return apiClient.get<Empresa>(`/companies/${id}`);
}

export async function crearEmpresa(payload: CrearEmpresaPayload): Promise<Empresa> {
  return apiClient.post<Empresa>("/companies", payload);
}

export async function actualizarEmpresa(
  id: number,
  payload: ActualizarEmpresaPayload,
): Promise<Empresa> {
  return apiClient.patch<Empresa>(`/companies/${id}`, payload);
}

export async function desactivarEmpresa(id: number): Promise<Empresa> {
  return apiClient.patch<Empresa>(`/companies/${id}/deactivate`);
}

export async function activarEmpresa(id: number): Promise<Empresa> {
  return apiClient.patch<Empresa>(`/companies/${id}/activate`);
}

export async function eliminarEmpresaDefinitiva(id: number): Promise<{ id: number; deleted: true }> {
  return apiClient.delete<{ id: number; deleted: true }>(`/companies/${id}/permanent`);
}
