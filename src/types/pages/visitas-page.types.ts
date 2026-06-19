/**
 * @file visitas-page.types.ts
 * @description Tipos para la página CRUD de visitas.
 */
import type { Visita, VisitaEstado, VisitaSortColumn, VisitaSortOrder } from "@/api/visitas";
import type { PorteriaPageSize } from "@/lib/porteria";

export interface VisitasFilterState {
  search: string;
  visitante: string;
  documento: string;
  empresa: string;
  motivo: string;
  responsable: string;
  estado: VisitaEstado | "";
}

export interface VisitasSortState {
  column: VisitaSortColumn;
  order: VisitaSortOrder;
}

export interface VisitasPagination {
  page: number;
  limit: PorteriaPageSize;
  total: number;
  totalPages: number;
}

export interface UseVisitasResult {
  items: Visita[];
  filters: VisitasFilterState;
  setFilters: (filters: VisitasFilterState) => void;
  applyFilters: (filters?: VisitasFilterState) => Promise<void>;
  sort: VisitasSortState | null;
  setSortColumn: (column: VisitaSortColumn) => void;
  pagination: VisitasPagination;
  setPage: (page: number) => void;
  setPageLimit: (limit: PorteriaPageSize) => void;
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
}
