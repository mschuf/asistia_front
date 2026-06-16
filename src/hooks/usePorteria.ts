/**
 * @file usePorteria.ts
 * @description Estado local del modulo Porteria con datos de la API.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/api/apiClient";
import {
  listarVisitas,
  listarVisitasActivas,
  obtenerMetricasVisitas,
  type ListarVisitasQuery,
} from "@/api/visitas";
import {
  createInitialPorteriaHistoryFilters,
  isPorteriaAllPageSize,
  isValidPorteriaPageSize,
  mapVisitaToHistoryRecord,
  mapVisitaToTrackingVisitor,
  PORTERIA_PAGE_SIZE,
  resolvePorteriaApiLimit,
  type PorteriaPageSize,
} from "@/lib/porteria";
import type {
  PorteriaHistoryFilterState,
  PorteriaHistoryRecord,
  PorteriaHistorySortColumn,
  PorteriaHistorySortState,
  PorteriaMetricCard,
  PorteriaTrackingVisitor,
  UsePorteriaHistorialResult,
  UsePorteriaIndicadoresResult,
} from "@/types/pages/porteria-page.types";

/** @returns Cards de métricas inicializadas en cero. */
function createEmptyMetricCards(): PorteriaMetricCard[] {
  return [
    { id: "month", title: "Total visitantes en el mes", value: "0" },
    { id: "day", title: "Total visitas en el dia", value: "0" },
    { id: "plant", title: "Visitantes en fabrica", value: "0" },
    { id: "admin", title: "Visitantes en administracion", value: "0" },
  ];
}

/** @param data - Métricas de la API. @returns Cards listas para PorteriaCards. */
function mapMetricsToCards(data: {
  monthVisits: number;
  dayVisits: number;
  plantVisitors: number;
  adminVisitors: number;
}): PorteriaMetricCard[] {
  return [
    { id: "month", title: "Total visitantes en el mes", value: String(data.monthVisits) },
    { id: "day", title: "Total visitas en el dia", value: String(data.dayVisits) },
    { id: "plant", title: "Visitantes en fabrica", value: String(data.plantVisitors) },
    { id: "admin", title: "Visitantes en administracion", value: String(data.adminVisitors) },
  ];
}

/** Mapea filtros UI del historial a query params del backend. */
function toHistoryListParams(
  filters: PorteriaHistoryFilterState,
  page: number,
  limit: number,
  sort: PorteriaHistorySortState | null,
): ListarVisitasQuery {
  return {
    page,
    limit,
    search: filters.search || undefined,
    visitante: filters.visitante || undefined,
    documento: filters.documento || undefined,
    empresa: filters.empresa || undefined,
    motivo: filters.motivo || undefined,
    responsable: filters.responsable || undefined,
    sortBy: sort?.column as ListarVisitasQuery["sortBy"],
    sortOrder: sort?.order,
  };
}

/**
 * Carga metricas y visitantes activos para la vista de indicadores.
 * @returns Estado de indicadores de Porteria.
 */
export function usePorteriaIndicadores(): UsePorteriaIndicadoresResult {
  const [metrics, setMetrics] = useState<PorteriaMetricCard[]>(createEmptyMetricCards);
  const [trackingVisitors, setTrackingVisitors] = useState<PorteriaTrackingVisitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const refresh = useCallback(async () => {
    setReloadToken((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadIndicadores() {
      setLoading(true);

      try {
        const [metricsData, activeVisits] = await Promise.all([
          obtenerMetricasVisitas(),
          listarVisitasActivas(),
        ]);
        if (cancelled) return;
        setMetrics(mapMetricsToCards(metricsData));
        setTrackingVisitors(activeVisits.map(mapVisitaToTrackingVisitor));
      } catch {
        if (!cancelled) {
          setMetrics(createEmptyMetricCards());
          setTrackingVisitors([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadIndicadores();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  return { metrics, trackingVisitors, loading, refresh };
}

/**
 * Maneja filtros, orden y paginacion del historial de Porteria.
 * @returns Estado del historial de Porteria.
 */
export function usePorteriaHistorial(): UsePorteriaHistorialResult {
  const [selectedRecord, setSelectedRecord] = useState<PorteriaHistoryRecord | null>(null);
  const [filters, setFiltersState] = useState(createInitialPorteriaHistoryFilters);
  const [appliedFilters, setAppliedFilters] = useState(createInitialPorteriaHistoryFilters);
  const [page, setPageState] = useState(1);
  const [pageLimit, setPageLimitState] = useState<PorteriaPageSize>(PORTERIA_PAGE_SIZE);
  const [sort, setSortState] = useState<PorteriaHistorySortState | null>(null);
  const [historyRows, setHistoryRows] = useState<PorteriaHistoryRecord[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const refresh = useCallback(async () => {
    setReloadToken((value) => value + 1);
  }, []);

  const historyListParams = useMemo(
    () => toHistoryListParams(appliedFilters, page, resolvePorteriaApiLimit(pageLimit, historyTotal), sort),
    [appliedFilters, page, pageLimit, sort, historyTotal],
  );

  const historyTotalPages = isPorteriaAllPageSize(pageLimit)
    ? 1
    : Math.max(1, Math.ceil(historyTotal / pageLimit));

  useEffect(() => {
    let cancelled = false;

    async function loadHistorial() {
      setHistoryLoading(true);
      setHistoryError("");

      try {
        const result = await listarVisitas(historyListParams);
        if (cancelled) return;
        setHistoryRows(result.items.map(mapVisitaToHistoryRecord));
        setHistoryTotal(result.total);
      } catch (fetchError) {
        if (cancelled) return;
        const message =
          fetchError instanceof ApiError
            ? fetchError.message
            : "No se pudo cargar el historial de visitas.";
        setHistoryError(message);
        setHistoryRows([]);
        setHistoryTotal(0);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }

    void loadHistorial();

    return () => {
      cancelled = true;
    };
  }, [historyListParams, reloadToken]);

  const setFilters = useCallback((nextFilters: PorteriaHistoryFilterState) => {
    setFiltersState(nextFilters);
  }, []);

  const applyFilters = useCallback(
    (nextFilters?: PorteriaHistoryFilterState) => {
      setAppliedFilters(nextFilters ?? filters);
      setPageState(1);
    },
    [filters],
  );

  const setPage = useCallback((nextPage: number) => {
    setPageState(Math.max(1, nextPage));
  }, []);

  const setPageLimit = useCallback((limit: PorteriaPageSize) => {
    if (!isValidPorteriaPageSize(limit)) return;
    setPageLimitState(limit);
    setPageState(1);
  }, []);

  const setSortColumn = useCallback((column: PorteriaHistorySortColumn) => {
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
  }, []);

  function selectRecord(record: PorteriaHistoryRecord) {
    setSelectedRecord(record);
  }

  function clearSelectedRecord() {
    setSelectedRecord(null);
  }

  return {
    historyRows,
    historyPagination: {
      page,
      limit: pageLimit,
      total: historyTotal,
      totalPages: historyTotalPages,
    },
    historyLoading,
    historyError,
    filters,
    setFilters,
    applyFilters,
    sort,
    setSortColumn,
    setPage,
    setPageLimit,
    selectedRecord,
    selectRecord,
    clearSelectedRecord,
    refresh,
  };
}
