/**
 * @file ers-page.types.ts
 * @description Tipos de estado para pantalla de listado ERS.
 */
import type { ErsListItem, ErsSortColumn } from "@/api/ers";
import type { ErsPageSize, ErsSortState } from "@/lib/ers";

/** Filtros del listado de ERS (borrador/aplicados). */
export interface ErsFilterState {
  search: string;
  projectName: string;
  createdFrom: string;
  createdTo: string;
  requesterId: string;
  approverName: string;
  projectStateId: string;
  lifecycle: '' | 'active' | 'finished';
  approved: '' | 'approved' | 'unapproved';
  locationId: string;
  assignedMemberId: string;
}

/** Paginación del listado ERS. */
export interface ErsPaginationState {
  page: number;
  limit: ErsPageSize;
  total: number;
  totalPages: number;
}

/** Retorno del hook principal de listado ERS. */
export interface UseErsListResult {
  items: ErsListItem[];
  filters: ErsFilterState;
  setFilters: (next: ErsFilterState) => void;
  applyFilters: (next?: ErsFilterState) => void;
  sort: ErsSortState | null;
  setSortColumn: (column: ErsSortColumn) => void;
  pagination: ErsPaginationState;
  setPage: (page: number) => void;
  setPageLimit: (limit: ErsPageSize) => void;
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
}

/** Estado del editor TI de ERS. */
export interface ErsEditState {
  projectName: string;
  objective: string;
  description: string;
  impact: string;
  requestType: string;
  priority: number;
  approved: boolean;
  approverId: string;
  projectStateId: string;
  projectTypeId: string;
  teamMemberIds: string[];
  tasks: Array<{
    id?: number;
    name: string;
    content: string;
    percentDone: number;
    projectStateId: string;
    projectStateName?: string;
    userId: string;
    planStartDate: string;
    planEndDate: string;
  }>;
}

