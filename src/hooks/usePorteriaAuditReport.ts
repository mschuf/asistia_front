/**
 * @file usePorteriaAuditReport.ts
 * @description Hook del reporte superadmin de auditoría de portería.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "@/api/apiClient";
import {
  listPorteriaAuditLogs,
  type ListPorteriaAuditLogsQuery,
} from "@/api/reports";
import { isAbortError } from "@/lib/http";
import {
  TICKETS_PAGE_SIZE,
  isTicketsAllPageSize,
  isValidTicketsPageSize,
  resolveTicketsApiLimit,
  type TicketsPageSize,
} from "@/lib/tickets";
import type {
  PorteriaAuditFilterState,
  PorteriaAuditSortColumn,
  PorteriaAuditSortState,
  UsePorteriaAuditReportResult,
} from "@/types/pages/porteria-audit-report.types";
import type { VisitaEstado } from "@/api/visitas";

function buildInitialFilters(): PorteriaAuditFilterState {
  return {
    q: "",
    action: "",
    actorUserId: "",
    visitaId: "",
    visitante: "",
    documento: "",
    occurredFrom: "",
    occurredTo: "",
    estadoBefore: "",
    estadoAfter: "",
  };
}

function toApiDateFrom(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

function toApiDateTo(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = new Date(`${trimmed}T23:59:59.999`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

function parsePositiveNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function toListParams(
  filters: PorteriaAuditFilterState,
  page: number,
  limit: number,
  sort: PorteriaAuditSortState,
): ListPorteriaAuditLogsQuery {
  return {
    page,
    limit,
    q: filters.q || undefined,
    action: filters.action || undefined,
    actorUserId: parsePositiveNumber(filters.actorUserId),
    visitaId: parsePositiveNumber(filters.visitaId),
    visitante: filters.visitante || undefined,
    documento: filters.documento || undefined,
    occurredFrom: toApiDateFrom(filters.occurredFrom),
    occurredTo: toApiDateTo(filters.occurredTo),
    estadoBefore: (filters.estadoBefore || undefined) as VisitaEstado | undefined,
    estadoAfter: (filters.estadoAfter || undefined) as VisitaEstado | undefined,
    sortBy: sort?.column,
    sortOrder: sort?.order,
  };
}

/** Gestiona estado, filtros, orden y paginación del reporte de auditoría de portería. */
export function usePorteriaAuditReport(): UsePorteriaAuditReportResult {
  const [items, setItems] = useState<UsePorteriaAuditReportResult["items"]>([]);
  const [filters, setFiltersState] = useState<PorteriaAuditFilterState>(() => buildInitialFilters());
  const [appliedFilters, setAppliedFilters] = useState<PorteriaAuditFilterState>(() =>
    buildInitialFilters(),
  );
  const [page, setPageState] = useState(1);
  const [pageLimit, setPageLimitState] = useState<TicketsPageSize>(TICKETS_PAGE_SIZE);
  const [sort, setSortState] = useState<PorteriaAuditSortState>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const listParams = useMemo(
    () => toListParams(appliedFilters, page, resolveTicketsApiLimit(pageLimit, total), sort),
    [appliedFilters, page, pageLimit, sort, total],
  );
  const fetchKey = JSON.stringify(listParams);
  const loadedFetchKeyRef = useRef<string | null>(null);

  const totalPages = isTicketsAllPageSize(pageLimit) ? 1 : Math.max(1, Math.ceil(total / pageLimit));

  const setFilters = useCallback((value: PorteriaAuditFilterState) => {
    setFiltersState(value);
  }, []);

  const applyFilters = useCallback(
    (nextFilters?: PorteriaAuditFilterState) => {
      setAppliedFilters(nextFilters ?? filters);
      setPageState(1);
      loadedFetchKeyRef.current = null;
    },
    [filters],
  );

  const setPage = useCallback((nextPage: number) => {
    setPageState(Math.max(1, nextPage));
  }, []);

  const setPageLimit = useCallback((limit: TicketsPageSize) => {
    if (!isValidTicketsPageSize(limit)) return;
    setPageLimitState(limit);
    setPageState(1);
    loadedFetchKeyRef.current = null;
  }, []);

  const setSortColumn = useCallback((column: PorteriaAuditSortColumn) => {
    setSortState((current) => {
      if (!current || current.column !== column) {
        return { column, order: "asc" };
      }
      if (current.order === "asc") {
        return { column, order: "desc" };
      }
      return null;
    });
    setPageState(1);
    loadedFetchKeyRef.current = null;
  }, []);

  const fetchItems = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError("");
      try {
        const response = await listPorteriaAuditLogs(listParams, { signal });
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
            : "Error al cargar la auditoría de portería";
        setError(message);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [fetchKey, listParams],
  );

  const refresh = useCallback(async () => {
    loadedFetchKeyRef.current = null;
    await fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    if (loadedFetchKeyRef.current === fetchKey) return;
    const controller = new AbortController();
    void fetchItems(controller.signal);
    return () => controller.abort();
  }, [fetchItems, fetchKey]);

  return {
    items,
    filters,
    setFilters,
    applyFilters,
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
  };
}
