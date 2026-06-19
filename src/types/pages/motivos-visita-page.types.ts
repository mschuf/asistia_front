/**
 * @file motivos-visita-page.types.ts
 * @description Tipos para la página CRUD de motivos de visita.
 */
import type { MotivoVisita, MotivoVisitaSortColumn, MotivoVisitaSortOrder } from "@/api/motivos-visita";
import type { PorteriaPageSize } from "@/lib/porteria";

export interface MotivosVisitaFilterState {
  search: string;
  nombre: string;
  activo: "" | "true" | "false";
}

export interface MotivosVisitaSortState {
  column: MotivoVisitaSortColumn;
  order: MotivoVisitaSortOrder;
}

export interface MotivosVisitaPagination {
  page: number;
  limit: PorteriaPageSize;
  total: number;
  totalPages: number;
}

export interface UseMotivosVisitaResult {
  items: MotivoVisita[];
  filters: MotivosVisitaFilterState;
  setFilters: (filters: MotivosVisitaFilterState) => void;
  applyFilters: (filters?: MotivosVisitaFilterState) => void;
  sort: MotivosVisitaSortState | null;
  setSortColumn: (column: MotivoVisitaSortColumn) => void;
  pagination: MotivosVisitaPagination;
  setPage: (page: number) => void;
  setPageLimit: (limit: PorteriaPageSize) => void;
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
}
