/**
 * @file useErsList.ts
 * @description Hook de listado ERS con filtros, orden y paginación server-side.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/api/apiClient";
import { listarErs, type ErsSortColumn, type ListarErsQuery } from "@/api/ers";
import {
  ERS_PAGE_SIZE,
  isErsAllPageSize,
  isValidErsPageSize,
  resolveErsApiLimit,
  type ErsPageSize,
  type ErsSortState,
} from "@/lib/ers";
import type { ErsFilterState, UseErsListResult } from "@/types/pages/ers-page.types";

/** @returns Filtros ERS en estado inicial. */
function createInitialFilters(): ErsFilterState {
  return {
    search: "",
    projectName: "",
    requesterName: "",
    locationName: "",
    approverName: "",
    projectStateId: "",
  };
}

/** Mapea filtros UI a query params del backend. */
function toListParams(
  filters: ErsFilterState,
  page: number,
  limit: number,
  sort: ErsSortState | null,
): ListarErsQuery {
  return {
    page,
    limit,
    search: filters.search || undefined,
    projectName: filters.projectName || undefined,
    requesterName: filters.requesterName || undefined,
    locationName: filters.locationName || undefined,
    approverName: filters.approverName || undefined,
    projectStateId: filters.projectStateId ? Number(filters.projectStateId) : undefined,
    sortBy: sort?.column,
    sortOrder: sort?.order,
  };
}

/** Hook principal para la pantalla `/ers`. */
export function useErsList(): UseErsListResult {
  const [items, setItems] = useState<UseErsListResult["items"]>([]);
  const [filters, setFiltersState] = useState<ErsFilterState>(createInitialFilters);
  const [appliedFilters, setAppliedFilters] = useState<ErsFilterState>(createInitialFilters);
  const [page, setPageState] = useState(1);
  const [pageLimit, setPageLimitState] = useState<ErsPageSize>(ERS_PAGE_SIZE);
  const [sort, setSortState] = useState<ErsSortState | null>({
    column: "projectId",
    order: "desc",
  });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const listParams = useMemo(
    () => toListParams(appliedFilters, page, resolveErsApiLimit(pageLimit, total), sort),
    [appliedFilters, page, pageLimit, sort, total],
  );

  const totalPages = isErsAllPageSize(pageLimit) ? 1 : Math.max(1, Math.ceil(total / pageLimit));

  const setFilters = useCallback((next: ErsFilterState) => {
    setFiltersState(next);
  }, []);

  const applyFilters = useCallback((next?: ErsFilterState) => {
    setAppliedFilters(next ?? filters);
    setPageState(1);
  }, [filters]);

  const setPage = useCallback((nextPage: number) => {
    setPageState(Math.max(1, nextPage));
  }, []);

  const setPageLimit = useCallback((limit: ErsPageSize) => {
    if (!isValidErsPageSize(limit)) return;
    setPageLimitState(limit);
    setPageState(1);
  }, []);

  const setSortColumn = useCallback((column: ErsSortColumn) => {
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
  }, []);

  const reload = useCallback(async () => {
    setReloadToken((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchItems() {
      setLoading(true);
      setError("");
      try {
        const result = await listarErs(listParams);
        if (cancelled) return;
        setItems(result.items);
        setTotal(result.total);
      } catch (fetchError) {
        if (cancelled) return;
        const message = fetchError instanceof ApiError ? fetchError.message : "No se pudieron cargar los ERS.";
        setError(message);
        setItems([]);
        setTotal(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchItems();
    return () => {
      cancelled = true;
    };
  }, [listParams, reloadToken]);

  return {
    items,
    filters,
    setFilters,
    applyFilters,
    sort,
    setSortColumn,
    pagination: {
      page,
      limit: pageLimit,
      total,
      totalPages,
    },
    setPage,
    setPageLimit,
    loading,
    error,
    reload,
  };
}

