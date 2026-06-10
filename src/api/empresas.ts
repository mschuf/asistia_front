/**
 * @file empresas.ts
 * @description Cliente HTTP CRUD de empresas (tenants) para super-admin.
 */
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

/**
 * Lista empresas con paginación y búsqueda.
 * @param query - Filtros de página, límite y búsqueda.
 * @returns Página de empresas.
 */
export async function listarEmpresas(query: ListarEmpresasQuery = {}): Promise<EmpresaListado> {
  return apiClient.get<EmpresaListado>("/companies", {
    query: query as Record<string, string | number | boolean | undefined | null>,
  });
}

/**
 * Obtiene una empresa por ID.
 * @param id - ID de la empresa.
 * @returns Empresa solicitada.
 */
export async function obtenerEmpresa(id: number): Promise<Empresa> {
  return apiClient.get<Empresa>(`/companies/${id}`);
}

/**
 * Crea una empresa nueva.
 * @param payload - Datos de integración Microsoft y daemon.
 * @returns Empresa creada.
 */
export async function crearEmpresa(payload: CrearEmpresaPayload): Promise<Empresa> {
  return apiClient.post<Empresa>("/companies", payload);
}

/**
 * Actualiza una empresa existente.
 * @param id - ID de la empresa.
 * @param payload - Campos parciales a actualizar.
 * @returns Empresa actualizada.
 */
export async function actualizarEmpresa(
  id: number,
  payload: ActualizarEmpresaPayload,
): Promise<Empresa> {
  return apiClient.patch<Empresa>(`/companies/${id}`, payload);
}

/**
 * Desactiva una empresa (soft delete).
 * @param id - ID de la empresa.
 * @returns Empresa desactivada.
 */
export async function desactivarEmpresa(id: number): Promise<Empresa> {
  return apiClient.patch<Empresa>(`/companies/${id}/deactivate`);
}

/**
 * Reactiva una empresa inactiva.
 * @param id - ID de la empresa.
 * @returns Empresa activada.
 */
export async function activarEmpresa(id: number): Promise<Empresa> {
  return apiClient.patch<Empresa>(`/companies/${id}/activate`);
}

/**
 * Elimina definitivamente una empresa y su configuración.
 * @param id - ID de la empresa.
 * @returns Confirmación de eliminación.
 */
export async function eliminarEmpresaDefinitiva(id: number): Promise<{ id: number; deleted: true }> {
  return apiClient.delete<{ id: number; deleted: true }>(`/companies/${id}/permanent`);
}
