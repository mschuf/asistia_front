/**
 * @file tickets-close.types.ts
 * @description Tipos del hook y componentes de cierre masivo de tickets (super admin, SQL-only).
 */
import type { CloseCandidatesSortColumn, CloseCandidatesSortOrder, CloseBulkResult } from "@/api/ticketsClose";
import type { TicketsPageSize } from "@/lib/tickets";
import type { AsistiaTicket } from "../asistia";

export type TicketsCloseSortColumn = CloseCandidatesSortColumn;
export type TicketsCloseSortOrder = CloseCandidatesSortOrder;

/** Estado de filtros de cierre masivo (valores de input datetime-local). */
export interface TicketsCloseFilterState {
  /** Valor de input datetime-local (YYYY-MM-DDTHH:mm). */
  dateFrom: string;
  /** Valor de input datetime-local (YYYY-MM-DDTHH:mm). */
  dateTo: string;
  includeOpen: boolean;
  includeSolved: boolean;
}

/** Estado de ordenación activa (`null` = orden por defecto del backend). */
export type TicketsCloseSortState = {
  column: TicketsCloseSortColumn;
  order: TicketsCloseSortOrder;
} | null;

/** Estado de paginación de candidatos a cierre masivo. */
export interface TicketsClosePaginationState {
  page: number;
  limit: TicketsPageSize;
  total: number;
  totalPages: number;
}

/** Resultado expuesto por useTicketsCloseBulk. */
export interface UseTicketsCloseBulkResult {
  items: AsistiaTicket[];
  filters: TicketsCloseFilterState;
  setFilters: (filters: TicketsCloseFilterState) => void;
  applyFilters: () => void;
  hasQueried: boolean;
  search: string;
  setSearch: (value: string) => void;
  applySearch: () => void;
  pagination: TicketsClosePaginationState;
  setPage: (page: number) => void;
  setPageLimit: (limit: TicketsPageSize) => void;
  sort: TicketsCloseSortState;
  setSortColumn: (column: TicketsCloseSortColumn) => void;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  selectedIds: Set<number>;
  toggleSelected: (id: number) => void;
  toggleSelectAllVisible: () => void;
  clearSelection: () => void;
  closing: boolean;
  closeSelected: () => Promise<CloseBulkResult | null>;
}
