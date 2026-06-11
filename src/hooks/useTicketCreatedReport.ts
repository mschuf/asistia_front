/**
 * @file useTicketCreatedReport.ts
 * @description Hook del reporte superadmin de logs ticket.created.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "@/api/apiClient";
import { listarEmpresas, type Empresa } from "@/api/empresas";
import {
  downloadTicketCreatedReport,
  listTicketCreatedLogs,
  triggerBrowserDownload,
  type ExportTicketCreatedLogsQuery,
  type ListTicketCreatedLogsQuery,
  type TicketCreatedReportExportFormat,
} from "@/api/reports";
import { useToast } from "@/context/ToastContext";
import { isAbortError } from "@/lib/http";
import {
  TICKETS_PAGE_SIZE,
  isTicketsAllPageSize,
  isValidTicketsPageSize,
  resolveTicketsApiLimit,
  type TicketsPageSize,
} from "@/lib/tickets";
import { listCategories } from "@/services/ticketsService";
import type { AsistiaCategory } from "@/types/asistia";
import type {
  TicketCreatedLog,
  TicketCreatedReportFilterState,
  TicketCreatedReportSortColumn,
  TicketCreatedReportSortState,
  UseTicketCreatedReportResult,
} from "@/types/pages/ticket-created-report.types";

/** @param date - Fecha y hora local. @returns Valor para input type="datetime-local". */
function formatDateTimeInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/** @returns Filtros iniciales con el mes actual (00:00) hasta ahora. */
function buildInitialReportFilters(): TicketCreatedReportFilterState {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  return {
    createdFrom: formatDateTimeInput(firstDay),
    createdTo: formatDateTimeInput(now),
    categoryName: "",
    companyId: "",
  };
}

/** Convierte datetime-local del formulario a ISO8601 para la API. */
function toApiDateTime(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

/** Convierte fechas del formulario a ISO8601 para la API. */
function toApiDateRange(filters: TicketCreatedReportFilterState): {
  createdFrom?: string;
  createdTo?: string;
} {
  return {
    createdFrom: toApiDateTime(filters.createdFrom),
    createdTo: toApiDateTime(filters.createdTo),
  };
}

/** Mapea filtros aplicados y sort a query de exportación. */
function toExportParams(
  filters: TicketCreatedReportFilterState,
  sort: TicketCreatedReportSortState,
): Omit<ExportTicketCreatedLogsQuery, "format"> {
  const { createdFrom, createdTo } = toApiDateRange(filters);

  return {
    createdFrom,
    createdTo,
    categoryName: filters.categoryName || undefined,
    companyId: filters.companyId ? Number(filters.companyId) : undefined,
    sortBy: sort?.column,
    sortOrder: sort?.order,
  };
}

/** Mapea filtros UI, paginación y sort a query params del backend. */
function toListParams(
  filters: TicketCreatedReportFilterState,
  page: number,
  limit: number,
  sort: TicketCreatedReportSortState,
): ListTicketCreatedLogsQuery {
  const { createdFrom, createdTo } = toApiDateRange(filters);

  return {
    page,
    limit,
    createdFrom,
    createdTo,
    categoryName: filters.categoryName || undefined,
    companyId: filters.companyId ? Number(filters.companyId) : undefined,
    sortBy: sort?.column,
    sortOrder: sort?.order,
  };
}

/**
 * Orquesta estado, catálogos, listado y paginación del reporte ticket.created.
 * @returns Estado y handlers expuestos a la página del reporte.
 */
export function useTicketCreatedReport(): UseTicketCreatedReportResult {
  const toast = useToast();
  const [items, setItems] = useState<TicketCreatedLog[]>([]);
  const [filters, setFiltersState] = useState<TicketCreatedReportFilterState>(() =>
    buildInitialReportFilters(),
  );
  const [appliedFilters, setAppliedFilters] = useState<TicketCreatedReportFilterState>(() =>
    buildInitialReportFilters(),
  );
  const [page, setPageState] = useState(1);
  const [pageLimit, setPageLimitState] = useState<TicketsPageSize>(TICKETS_PAGE_SIZE);
  const [sort, setSortState] = useState<TicketCreatedReportSortState>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<AsistiaCategory[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [catalogsLoading, setCatalogsLoading] = useState(true);
  const [catalogsError, setCatalogsError] = useState("");
  const [catalogsLoaded, setCatalogsLoaded] = useState(false);
  const [exporting, setExporting] = useState<TicketCreatedReportExportFormat | null>(null);

  const exportParams = useMemo(
    () => toExportParams(appliedFilters, sort),
    [appliedFilters, sort],
  );

  const listParams = useMemo(
    () => toListParams(appliedFilters, page, resolveTicketsApiLimit(pageLimit, total), sort),
    [appliedFilters, page, pageLimit, sort, total],
  );
  const fetchKey = JSON.stringify(listParams);
  const loadedFetchKeyRef = useRef<string | null>(null);

  const totalPages = isTicketsAllPageSize(pageLimit)
    ? 1
    : Math.max(1, Math.ceil(total / pageLimit));

  const setFilters = useCallback((value: TicketCreatedReportFilterState) => {
    setFiltersState(value);
  }, []);

  const applyFilters = useCallback((nextFilters?: TicketCreatedReportFilterState) => {
    setAppliedFilters(nextFilters ?? filters);
    setPageState(1);
    loadedFetchKeyRef.current = null;
  }, [filters]);

  const setPage = useCallback((nextPage: number) => {
    setPageState(Math.max(1, nextPage));
  }, []);

  const setPageLimit = useCallback((limit: TicketsPageSize) => {
    if (!isValidTicketsPageSize(limit)) return;
    setPageLimitState(limit);
    setPageState(1);
    loadedFetchKeyRef.current = null;
  }, []);

  const setSortColumn = useCallback((column: TicketCreatedReportSortColumn) => {
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
        const response = await listTicketCreatedLogs(listParams, { signal });
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
            : "Error al cargar el reporte";
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

  const downloadReport = useCallback(
    async (format: TicketCreatedReportExportFormat) => {
      setExporting(format);
      try {
        const { blob, filename } = await downloadTicketCreatedReport({
          ...exportParams,
          format,
        });
        triggerBrowserDownload(blob, filename);
        toast.success(
          format === "pdf" ? "PDF descargado." : "Excel descargado.",
          "Reporte",
        );
      } catch (err) {
        const message =
          err instanceof ApiError || err instanceof Error
            ? err.message
            : "No se pudo descargar el reporte";
        toast.error(message, "Reporte");
      } finally {
        setExporting(null);
      }
    },
    [exportParams, toast],
  );

  useEffect(() => {
    if (catalogsLoaded) return;

    const controller = new AbortController();
    const { signal } = controller;

    async function loadCatalogs() {
      setCatalogsLoading(true);
      setCatalogsError("");
      try {
        const [categoryResult, empresaResult] = await Promise.all([
          listCategories({ signal }),
          listarEmpresas({ page: 1, limit: 200 }),
        ]);
        if (signal.aborted) return;
        setCategories(categoryResult);
        setEmpresas(empresaResult.items);
        setCatalogsLoaded(true);
      } catch (err) {
        if (signal.aborted || isAbortError(err)) return;
        const message =
          err instanceof ApiError || err instanceof Error
            ? err.message
            : "No se pudieron cargar los catálogos";
        setCatalogsError(message);
      } finally {
        if (!signal.aborted) {
          setCatalogsLoading(false);
        }
      }
    }

    void loadCatalogs();
    return () => controller.abort();
  }, [catalogsLoaded]);

  useEffect(() => {
    if (loadedFetchKeyRef.current === fetchKey) return;

    const controller = new AbortController();
    void fetchItems(controller.signal);
    return () => controller.abort();
  }, [fetchItems, fetchKey]);

  return {
    items,
    filters,
    appliedFilters,
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
    exporting,
    downloadReport,
    categories,
    empresas,
    catalogsLoading,
    catalogsError,
  };
}
