/**
 * @file ers-page.types.ts
 * @description Tipos de estado para pantalla de listado ERS.
 */
import type { ErsDetail, ErsListItem, ErsProjectState, ErsSortColumn } from "@/api/ers";
import type { ErsPageSize, ErsSortState } from "@/lib/ers";

/** Filtros del listado de ERS (borrador/aplicados). */
export interface ErsFilterState {
  search: string;
  projectName: string;
  requesterName: string;
  locationName: string;
  approverName: string;
  projectStateId: string;
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
  approverId: string;
  projectStateId: string;
  teamMemberIds: string[];
  tasks: Array<{
    id?: number;
    name: string;
    content: string;
    percentDone: number;
    projectStateId: string;
    userId: string;
    planStartDate: string;
    planEndDate: string;
  }>;
}

/** Props base para diálogo de edición TI. */
export interface ErsEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: ErsDetail | null;
  states: ErsProjectState[];
  loadingStates: boolean;
  onSaved: (detail: ErsDetail) => void;
}

