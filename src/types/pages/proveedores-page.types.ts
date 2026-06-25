/**
 * @file proveedores-page.types.ts
 * @description Tipos para la página CRUD de proveedores.
 */
import type { Proveedor, ProveedorSortColumn, ProveedorSortOrder } from "@/api/proveedores";
import type { PorteriaPageSize } from "@/lib/porteria";

export interface ProveedoresFilterState {
  search: string;
  nombre: string;
  ruc: string;
  activo: "" | "true" | "false";
}

export interface ProveedoresSortState {
  column: ProveedorSortColumn;
  order: ProveedorSortOrder;
}

export interface ProveedoresPagination {
  page: number;
  limit: PorteriaPageSize;
  total: number;
  totalPages: number;
}

export interface UseProveedoresResult {
  items: Proveedor[];
  filters: ProveedoresFilterState;
  setFilters: (filters: ProveedoresFilterState) => void;
  applyFilters: (filters?: ProveedoresFilterState) => void;
  sort: ProveedoresSortState | null;
  setSortColumn: (column: ProveedorSortColumn) => void;
  pagination: ProveedoresPagination;
  setPage: (page: number) => void;
  setPageLimit: (limit: PorteriaPageSize) => void;
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
}
