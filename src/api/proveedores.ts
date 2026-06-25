/**
 * @file proveedores.ts
 * @description Cliente HTTP CRUD de proveedores para el módulo Portería.
 */
import { apiClient } from "./apiClient";

export interface Proveedor {
  id: number;
  nombre: string;
  ruc: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProveedorListado {
  items: Proveedor[];
  total: number;
  page: number;
  limit: number;
}

export type ProveedorSortColumn = "id" | "nombre" | "ruc" | "createdAt";
export type ProveedorSortOrder = "asc" | "desc";

export interface ListarProveedoresQuery {
  page?: number;
  limit?: number;
  search?: string;
  nombre?: string;
  ruc?: string;
  activo?: boolean;
  sortBy?: ProveedorSortColumn;
  sortOrder?: ProveedorSortOrder;
}

export interface CrearProveedorPayload {
  nombre: string;
  ruc: string;
  activo?: boolean;
}

export type ActualizarProveedorPayload = Partial<CrearProveedorPayload>;

/** Lista proveedores con paginación, filtros y orden. */
export async function listarProveedores(
  query: ListarProveedoresQuery = {},
  options?: { signal?: AbortSignal },
): Promise<ProveedorListado> {
  return apiClient.get<ProveedorListado>("/proveedores", {
    ...options,
    query: query as Record<string, string | number | boolean | undefined | null>,
  });
}

/** Obtiene un proveedor por ID. */
export async function obtenerProveedor(
  id: number,
  options?: { signal?: AbortSignal },
): Promise<Proveedor> {
  return apiClient.get<Proveedor>(`/proveedores/${id}`, options);
}

/** Crea un proveedor nuevo. */
export async function crearProveedor(payload: CrearProveedorPayload): Promise<Proveedor> {
  return apiClient.post<Proveedor>("/proveedores", payload);
}

/** Actualiza un proveedor existente. */
export async function actualizarProveedor(
  id: number,
  payload: ActualizarProveedorPayload,
): Promise<Proveedor> {
  return apiClient.patch<Proveedor>(`/proveedores/${id}`, payload);
}

/** Desactiva un proveedor (soft delete). */
export async function desactivarProveedor(id: number): Promise<Proveedor> {
  return apiClient.patch<Proveedor>(`/proveedores/${id}/deactivate`);
}

/** Reactiva un proveedor previamente desactivado. */
export async function activarProveedor(id: number): Promise<Proveedor> {
  return apiClient.patch<Proveedor>(`/proveedores/${id}/activate`);
}

/** Elimina definitivamente un proveedor sin personas asociadas. */
export async function eliminarProveedor(id: number): Promise<{ id: number; deleted: true }> {
  return apiClient.delete<{ id: number; deleted: true }>(`/proveedores/${id}`);
}
