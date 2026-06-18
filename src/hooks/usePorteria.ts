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
  createInitialPorteriaMetricsDateFilter,
  getMetricsActiveSubtitle,
  getMetricsDayIngressTitle,
  getMetricsPeriodIngressTitle,
  isPorteriaAllPageSize,
  isValidPorteriaPageSize,
  mapVisitaToHistoryRecord,
  mapVisitaToTrackingVisitor,
  PORTERIA_PAGE_SIZE,
  resolveCalendarMonthDateRange,
  resolveMetricsDateRange,
  resolvePorteriaApiLimit,
  type PorteriaPageSize,
} from "@/lib/porteria";
import { resolveCandidateFullName } from "@/lib/porteria-personas";
import { toApiDateFrom, toApiDateTo } from "@/lib/tickets";
import type {
  PorteriaHistoryFilterState,
  PorteriaHistoryRecord,
  PorteriaHistorySortColumn,
  PorteriaHistorySortState,
  PorteriaMetricCard,
  PorteriaMetricsDateFilterState,
  PorteriaMetricsPeriodPreset,
  PorteriaTrackingVisitor,
  UsePorteriaHistorialResult,
  UsePorteriaIndicadoresResult,
} from "@/types/pages/porteria-page.types";

/** @param preset - Preset de período activo. @returns Cards de métricas inicializadas en cero. */
function createEmptyMetricCards(preset: PorteriaMetricsPeriodPreset = "7d"): PorteriaMetricCard[] {
  const activeSubtitle = getMetricsActiveSubtitle();
  return [
    {
      id: "month",
      title: getMetricsPeriodIngressTitle(preset),
      value: "0",
      subtitle: "Incluye finalizadas",
    },
    { id: "day", title: getMetricsDayIngressTitle(preset), value: "0" },
    {
      id: "staleCheckout",
      title: "Sin salida de días anteriores",
      value: "0",
      subtitle: "Requieren marcar salida",
    },
    { id: "bothZones", title: "Fábrica y administración", value: "0", subtitle: activeSubtitle },
    { id: "adminOnly", title: "Administración", value: "0", subtitle: activeSubtitle },
    { id: "factoryOnly", title: "Fábrica", value: "0", subtitle: activeSubtitle },
  ];
}

/** @param data - Métricas de la API. @param preset - Preset de período activo. @param periodIngressOverride - Valor opcional para la card de ingresos del período. @returns Cards listas para PorteriaCards. */
function mapMetricsToCards(
  data: {
    monthVisits: number;
    dayVisits: number;
    activeOnlyAdmin: number;
    activeOnlyFactory: number;
    activeBothZones: number;
    activeStaleWithoutCheckout: number;
  },
  preset: PorteriaMetricsPeriodPreset,
  periodIngressOverride?: number,
): PorteriaMetricCard[] {
  const activeSubtitle = getMetricsActiveSubtitle();
  return [
    {
      id: "month",
      title: getMetricsPeriodIngressTitle(preset),
      value: String(periodIngressOverride ?? data.monthVisits),
      subtitle: "Incluye finalizadas",
    },
    { id: "day", title: getMetricsDayIngressTitle(preset), value: String(data.dayVisits) },
    {
      id: "staleCheckout",
      title: "Sin salida de días anteriores",
      value: String(data.activeStaleWithoutCheckout),
      subtitle: "Requieren marcar salida",
    },
    {
      id: "bothZones",
      title: "Fábrica y administración",
      value: String(data.activeBothZones),
      subtitle: activeSubtitle,
    },
    {
      id: "adminOnly",
      title: "Administración",
      value: String(data.activeOnlyAdmin),
      subtitle: activeSubtitle,
    },
    {
      id: "factoryOnly",
      title: "Fábrica",
      value: String(data.activeOnlyFactory),
      subtitle: activeSubtitle,
    },
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
    entradaFrom: toApiDateFrom(filters.entradaFrom),
    entradaTo: toApiDateTo(filters.entradaTo),
    sortBy: sort?.column as ListarVisitasQuery["sortBy"],
    sortOrder: sort?.order,
  };
}

/**
 * Carga metricas y visitantes activos para la vista de indicadores.
 * @returns Estado de indicadores de Porteria.
 */
export function usePorteriaIndicadores(): UsePorteriaIndicadoresResult {
  const [metricsDateFilter, setMetricsDateFilterState] = useState(createInitialPorteriaMetricsDateFilter);
  const [metrics, setMetrics] = useState<PorteriaMetricCard[]>(() => createEmptyMetricCards("7d"));
  const [trackingVisitors, setTrackingVisitors] = useState<PorteriaTrackingVisitor[]>([]);
  const [loading, setLoading] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const metricsDateRange = useMemo(
    () => resolveMetricsDateRange(metricsDateFilter),
    [metricsDateFilter],
  );

  const refresh = useCallback(async () => {
    setReloadToken((value) => value + 1);
  }, []);

  const setMetricsDateFilter = useCallback((filter: PorteriaMetricsDateFilterState) => {
    setMetricsDateFilterState(filter);
  }, []);

  useEffect(() => {
    const dateRange = metricsDateRange;
    if (!dateRange) {
      setMetrics(createEmptyMetricCards(metricsDateFilter.preset));
      return;
    }

    const metricsQuery = {
      entradaFrom: dateRange.entradaFrom,
      entradaTo: dateRange.entradaTo,
    };

    let cancelled = false;

    async function loadIndicadores() {
      setLoading(true);

      try {
        const isTodayPreset = metricsDateFilter.preset === "hoy";
        const [metricsData, monthMetricsData, activeVisits] = await Promise.all([
          obtenerMetricasVisitas(metricsQuery),
          isTodayPreset ? obtenerMetricasVisitas(resolveCalendarMonthDateRange()) : Promise.resolve(null),
          listarVisitasActivas(),
        ]);
        if (cancelled) return;
        setMetrics(
          mapMetricsToCards(
            metricsData,
            metricsDateFilter.preset,
            isTodayPreset ? monthMetricsData?.monthVisits : undefined,
          ),
        );
        setTrackingVisitors(activeVisits.map(mapVisitaToTrackingVisitor));
      } catch {
        if (!cancelled) {
          setMetrics(createEmptyMetricCards(metricsDateFilter.preset));
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
  }, [metricsDateRange, metricsDateFilter.preset, reloadToken]);

  return {
    metrics,
    trackingVisitors,
    metricsDateFilter,
    setMetricsDateFilter,
    loading,
    refresh,
  };
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
    async (nextFilters?: PorteriaHistoryFilterState) => {
      const filtersToApply = nextFilters ?? filters;
      const responsableNombre = filtersToApply.responsable
        ? await resolveCandidateFullName(filtersToApply.responsable)
        : "";
      setAppliedFilters({
        ...filtersToApply,
        responsable: responsableNombre,
      });
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
