/**
 * @file personas-page.types.ts
 * @description Tipos para la página CRUD de personas.
 */
import type { Persona, PersonaSortColumn, PersonaSortOrder } from "@/api/personas";
import type { PorteriaPageSize } from "@/lib/porteria";

export interface PersonasFilterState {
  search: string;
  nombre: string;
  documento: string;
  proveedor: string;
  activo: "" | "true" | "false";
}

export interface PersonasSortState {
  column: PersonaSortColumn;
  order: PersonaSortOrder;
}

export interface PersonasPagination {
  page: number;
  limit: PorteriaPageSize;
  total: number;
  totalPages: number;
}

export interface UsePersonasResult {
  items: Persona[];
  filters: PersonasFilterState;
  setFilters: (filters: PersonasFilterState) => void;
  applyFilters: (filters?: PersonasFilterState) => void;
  sort: PersonasSortState | null;
  setSortColumn: (column: PersonaSortColumn) => void;
  pagination: PersonasPagination;
  setPage: (page: number) => void;
  setPageLimit: (limit: PorteriaPageSize) => void;
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
}

