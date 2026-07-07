/**
 * @file useTicketsCloseBulk.ts
 * @description Hook de cierre masivo de tickets (super admin, SQL-only sobre GLPI).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "@/api/apiClient";
import {
  closeBulk as closeBulkRequest,
  listCloseCandidates,
  type CloseBulkResult,
  type CloseCandidatesSortColumn,
  type ListCloseCandidatesQuery,
} from "@/api/ticketsClose";
import { useToast } from "@/context/ToastContext";
import { isAbortError } from "@/lib/http";
import {
  TICKETS_PAGE_SIZE,
  isTicketsAllPageSize,
  isValidTicketsPageSize,
  resolveTicketsApiLimit,
  type TicketsPageSize,
} from "@/lib/tickets";
import type { AsistiaTicket } from "@/types/asistia";
import type {
  TicketsCloseFilterState,
  TicketsCloseSortState,
  UseTicketsCloseBulkResult,
} from "@/types/pages/tickets-close.types";

/** @param date - Fecha y hora local. @returns Valor para input type="datetime-local". */
function formatDateTimeInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/** @returns Filtros iniciales: día completo (00:00 a 23:59) de hace 2 días, solo "Resueltos". */
function buildInitialCloseFilters(): TicketsCloseFilterState {
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const start = new Date(
    twoDaysAgo.getFullYear(),
    twoDaysAgo.getMonth(),
    twoDaysAgo.getDate(),
    0,
    0,
    0,
    0,
  );
  const end = new Date(
    twoDaysAgo.getFullYear(),
    twoDaysAgo.getMonth(),
    twoDaysAgo.getDate(),
    23,
    59,
    0,
    0,
  );
  return {
    dateFrom: formatDateTimeInput(start),
    dateTo: formatDateTimeInput(end),
    includeOpen: false,
    includeSolved: true,
  };
}

/** Convierte datetime-local del formulario a ISO8601, forzando inicio de minuto (:00.000). */
function toApiDateTimeFrom(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return undefined;
  parsed.setSeconds(0, 0);
  return parsed.toISOString();
}

/** Convierte datetime-local del formulario a ISO8601, forzando fin de minuto (:59.999). */
function toApiDateTimeTo(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return undefined;
  parsed.setSeconds(59, 999);
  return parsed.toISOString();
}

/**
 * Orquesta filtros, paginación, ordenación, selección y cierre masivo de tickets.
 * @returns Estado y handlers expuestos a la página de cierre masivo.
 */
export function useTicketsCloseBulk(): UseTicketsCloseBulkResult {
  const toast = useToast();
  const [items, setItems] = useState<AsistiaTicket[]>([]);
  const [filters, setFiltersState] = useState<TicketsCloseFilterState>(() =>
    buildInitialCloseFilters(),
  );
  const [appliedFilters, setAppliedFilters] = useState<TicketsCloseFilterState | null>(null);
  const [search, setSearchState] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [hasQueried, setHasQueried] = useState(false);
  const [page, setPageState] = useState(1);
  const [pageLimit, setPageLimitState] = useState<TicketsPageSize>(TICKETS_PAGE_SIZE);
  const [sort, setSortState] = useState<TicketsCloseSortState>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [closing, setClosing] = useState(false);

  const listParams = useMemo<ListCloseCandidatesQuery | null>(() => {
    if (!appliedFilters) return null;
    return {
      page,
      limit: resolveTicketsApiLimit(pageLimit, total),
      includeOpen: appliedFilters.includeOpen,
      includeSolved: appliedFilters.includeSolved,
      dateFrom: toApiDateTimeFrom(appliedFilters.dateFrom),
      dateTo: toApiDateTimeTo(appliedFilters.dateTo),
      search: appliedSearch || undefined,
      sortBy: sort?.column,
      sortOrder: sort?.order,
    };
  }, [appliedFilters, appliedSearch, page, pageLimit, sort, total]);

  const fetchKey = listParams ? JSON.stringify(listParams) : null;
  const loadedFetchKeyRef = useRef<string | null>(null);

  const totalPages = isTicketsAllPageSize(pageLimit)
    ? 1
    : Math.max(1, Math.ceil(total / pageLimit));

  const setFilters = useCallback((value: TicketsCloseFilterState) => {
    setFiltersState(value);
  }, []);

  const applyFilters = useCallback(() => {
    setAppliedFilters(filters);
    setHasQueried(true);
    setPageState(1);
    setSelectedIds(new Set());
    loadedFetchKeyRef.current = null;
  }, [filters]);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
  }, []);

  const applySearch = useCallback(() => {
    setAppliedSearch(search);
    setPageState(1);
    loadedFetchKeyRef.current = null;
  }, [search]);

  const setPage = useCallback((nextPage: number) => {
    setPageState(Math.max(1, nextPage));
  }, []);

  const setPageLimit = useCallback((limit: TicketsPageSize) => {
    if (!isValidTicketsPageSize(limit)) return;
    setPageLimitState(limit);
    setPageState(1);
    loadedFetchKeyRef.current = null;
  }, []);

  const setSortColumn = useCallback((column: CloseCandidatesSortColumn) => {
    setSortState((current) => {
      if (!current || current.column !== column) {
        return { column, order: "desc" };
      }
      if (current.order === "desc") {
        return { column, order: "asc" };
      }
      return null;
    });
    setPageState(1);
    loadedFetchKeyRef.current = null;
  }, []);

  const fetchItems = useCallback(
    async (signal?: AbortSignal) => {
      if (!listParams) return;
      setLoading(true);
      setError("");
      try {
        const response = await listCloseCandidates(listParams, { signal, showBackdrop: false });
        if (signal?.aborted) return;
        setItems(response.items);
        setTotal(response.total);
        setPageState(response.page);
        loadedFetchKeyRef.current = fetchKey;
      } catch (err) {
        if (signal?.aborted || isAbortError(err)) return;
        const message =
          err instanceof ApiError || err instanceof Error
            ? err.message
            : "Error al cargar los tickets";
        setError(message);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [fetchKey, listParams],
  );

  const refresh = useCallback(async () => {
    loadedFetchKeyRef.current = null;
    await fetchItems();
  }, [fetchItems]);

  const toggleSelected = useCallback((id: number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAllVisible = useCallback(() => {
    setSelectedIds((current) => {
      const visibleIds = items.map((item) => item.id);
      const allSelected = visibleIds.length > 0 && visibleIds.every((id) => current.has(id));
      const next = new Set(current);
      if (allSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [items]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const closeSelected = useCallback(async (): Promise<CloseBulkResult | null> => {
    if (selectedIds.size === 0) return null;
    setClosing(true);
    try {
      const result = await closeBulkRequest(Array.from(selectedIds));
      setSelectedIds(new Set());
      loadedFetchKeyRef.current = null;
      await fetchItems();
      return result;
    } catch (err) {
      const message =
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "No se pudo cerrar los tickets seleccionados";
      toast.error(message, "Cierre masivo");
      return null;
    } finally {
      setClosing(false);
    }
  }, [selectedIds, fetchItems, toast]);

  useEffect(() => {
    if (!hasQueried || !fetchKey) return;
    if (loadedFetchKeyRef.current === fetchKey) return;

    const controller = new AbortController();
    void fetchItems(controller.signal);
    return () => controller.abort();
  }, [fetchItems, fetchKey, hasQueried]);

  return {
    items,
    filters,
    setFilters,
    applyFilters,
    hasQueried,
    search,
    setSearch,
    applySearch,
    pagination: {
      page,
      limit: pageLimit,
      total,
      totalPages,
    },
    setPage,
    setPageLimit,
    sort,
    setSortColumn,
    loading,
    error,
    refresh,
    selectedIds,
    toggleSelected,
    toggleSelectAllVisible,
    clearSelection,
    closing,
    closeSelected,
  };
}
