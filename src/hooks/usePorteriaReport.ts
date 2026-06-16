/**
 * @file usePorteriaReport.ts
 * @description Hook del reporte superadmin de visitas de portería.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "@/api/apiClient";
import {
  downloadVisitasReport,
  listVisitasReport,
  triggerBrowserDownload,
  type ExportVisitasReportQuery,
  type ListVisitasReportQuery,
  type PorteriaReportExportFormat,
} from "@/api/reports";
import type { VisitaEstado } from "@/api/visitas";
import { useToast } from "@/context/ToastContext";
import { isAbortError } from "@/lib/http";
import {
  TICKETS_PAGE_SIZE,
  isTicketsAllPageSize,
  isValidTicketsPageSize,
  resolveTicketsApiLimit,
  type TicketsPageSize,
} from "@/lib/tickets";
import type {
  PorteriaReportFilterState,
  PorteriaReportLog,
  PorteriaReportSortColumn,
  PorteriaReportSortState,
  UsePorteriaReportResult,
} from "@/types/pages/porteria-report.types";

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
function buildInitialReportFilters(): PorteriaReportFilterState {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  return {
    entradaFrom: formatDateTimeInput(firstDay),
    entradaTo: formatDateTimeInput(now),
    estado: "",
    empresa: "",
    visitante: "",
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
function toApiDateRange(filters: PorteriaReportFilterState): {
  entradaFrom?: string;
  entradaTo?: string;
} {
  return {
    entradaFrom: toApiDateTime(filters.entradaFrom),
    entradaTo: toApiDateTime(filters.entradaTo),
  };
}

/** Mapea filtros aplicados y sort a query de exportación. */
function toExportParams(
  filters: PorteriaReportFilterState,
  sort: PorteriaReportSortState,
): Omit<ExportVisitasReportQuery, "format"> {
  const { entradaFrom, entradaTo } = toApiDateRange(filters);

  return {
    entradaFrom,
    entradaTo,
    estado: (filters.estado || undefined) as VisitaEstado | undefined,
    empresa: filters.empresa || undefined,
    visitante: filters.visitante || undefined,
    sortBy: sort?.column,
    sortOrder: sort?.order,
  };
}

/** Mapea filtros UI, paginación y sort a query params del backend. */
function toListParams(
  filters: PorteriaReportFilterState,
  page: number,
  limit: number,
  sort: PorteriaReportSortState,
): ListVisitasReportQuery {
  const { entradaFrom, entradaTo } = toApiDateRange(filters);

  return {
    page,
    limit,
    entradaFrom,
    entradaTo,
    estado: (filters.estado || undefined) as VisitaEstado | undefined,
    empresa: filters.empresa || undefined,
    visitante: filters.visitante || undefined,
    sortBy: sort?.column,
    sortOrder: sort?.order,
  };
}

/**
 * Orquesta estado, listado y paginación del reporte de visitas de portería.
 * @returns Estado y handlers expuestos a la página del reporte.
 */
export function usePorteriaReport(): UsePorteriaReportResult {
  const toast = useToast();
  const [items, setItems] = useState<PorteriaReportLog[]>([]);
  const [filters, setFiltersState] = useState<PorteriaReportFilterState>(() =>
    buildInitialReportFilters(),
  );
  const [appliedFilters, setAppliedFilters] = useState<PorteriaReportFilterState>(() =>
    buildInitialReportFilters(),
  );
  const [page, setPageState] = useState(1);
  const [pageLimit, setPageLimitState] = useState<TicketsPageSize>(TICKETS_PAGE_SIZE);
  const [sort, setSortState] = useState<PorteriaReportSortState>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState<PorteriaReportExportFormat | null>(null);

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

  const setFilters = useCallback((value: PorteriaReportFilterState) => {
    setFiltersState(value);
  }, []);

  const applyFilters = useCallback((nextFilters?: PorteriaReportFilterState) => {
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

  const setSortColumn = useCallback((column: PorteriaReportSortColumn) => {
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
        const response = await listVisitasReport(listParams, { signal });
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
    async (format: PorteriaReportExportFormat) => {
      setExporting(format);
      try {
        const { blob, filename } = await downloadVisitasReport({
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
  };
}
