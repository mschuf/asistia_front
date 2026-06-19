/**
 * @file useVisitas.ts
 * @description Hook del listado CRUD de visitas con filtros, orden y paginación.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/api/apiClient";
import { listarVisitas, type ListarVisitasQuery, type VisitaSortColumn } from "@/api/visitas";
import {
  PORTERIA_PAGE_SIZE,
  isPorteriaAllPageSize,
  isValidPorteriaPageSize,
  resolvePorteriaApiLimit,
  getLocalTodayYmd,
  type PorteriaPageSize,
} from "@/lib/porteria";
import { resolveMotivoVisitaNombre } from "@/lib/porteria-motivos-visita";
import { resolveCandidateFullName } from "@/lib/porteria-personas";
import { resolveProveedorNombre } from "@/lib/porteria-proveedores";
import { resolveResponsableFullName } from "@/lib/visitas-responsables";
import { toApiDateFrom, toApiDateTo } from "@/lib/tickets";
import type {
  VisitasFilterState,
  VisitasSortState,
  UseVisitasResult,
} from "@/types/pages/visitas-page.types";

/** @returns Estado inicial de filtros de visitas. */
function createInitialFilters(): VisitasFilterState {
  return {
    search: "",
    visitante: "",
    documento: "",
    empresa: "",
    motivo: "",
    responsable: "",
    estado: "",
  };
}

/** Mapea filtros UI a query params del backend. */
function toListParams(
  filters: VisitasFilterState,
  page: number,
  limit: number,
  sort: VisitasSortState | null,
): ListarVisitasQuery {
  const today = getLocalTodayYmd();
  return {
    page,
    limit,
    entradaFrom: toApiDateFrom(today),
    entradaTo: toApiDateTo(today),
    includeProgramadasSinEntrada: true,
    search: filters.search || undefined,
    visitante: filters.visitante || undefined,
    documento: filters.documento || undefined,
    empresa: filters.empresa || undefined,
    motivo: filters.motivo || undefined,
    responsable: filters.responsable || undefined,
    estado: filters.estado || undefined,
    sortBy: sort?.column,
    sortOrder: sort?.order,
  };
}

/** Orquesta estado, listado y paginación de visitas. */
export function useVisitas(): UseVisitasResult {
  const [items, setItems] = useState<UseVisitasResult["items"]>([]);
  const [filters, setFiltersState] = useState<VisitasFilterState>(createInitialFilters);
  const [appliedFilters, setAppliedFilters] = useState<VisitasFilterState>(createInitialFilters);
  const [page, setPageState] = useState(1);
  const [pageLimit, setPageLimitState] = useState<PorteriaPageSize>(PORTERIA_PAGE_SIZE);
  const [sort, setSortState] = useState<VisitasSortState | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const listParams = useMemo(
    () => toListParams(appliedFilters, page, resolvePorteriaApiLimit(pageLimit, total), sort),
    [appliedFilters, page, pageLimit, sort, total],
  );

  const totalPages = isPorteriaAllPageSize(pageLimit)
    ? 1
    : Math.max(1, Math.ceil(total / pageLimit));

  const setFilters = useCallback((value: VisitasFilterState) => {
    setFiltersState(value);
  }, []);

  const applyFilters = useCallback(
    async (nextFilters?: VisitasFilterState) => {
      const filtersToApply = nextFilters ?? filters;
      const [visitante, empresa, motivo, responsable] = await Promise.all([
        filtersToApply.visitante ? resolveCandidateFullName(filtersToApply.visitante) : "",
        filtersToApply.empresa ? resolveProveedorNombre(filtersToApply.empresa) : "",
        filtersToApply.motivo ? resolveMotivoVisitaNombre(filtersToApply.motivo) : "",
        filtersToApply.responsable ? resolveResponsableFullName(filtersToApply.responsable) : "",
      ]);
      setAppliedFilters({
        ...filtersToApply,
        visitante,
        empresa,
        motivo,
        responsable,
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

  const setSortColumn = useCallback((column: VisitaSortColumn) => {
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

  const reload = useCallback(async () => {
    setReloadToken((value) => value + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchItems() {
      setLoading(true);
      setError("");
      try {
        const result = await listarVisitas(listParams);
        if (cancelled) return;
        setItems(result.items);
        setTotal(result.total);
      } catch (fetchError) {
        if (cancelled) return;
        const message =
          fetchError instanceof ApiError ? fetchError.message : "No se pudieron cargar las visitas.";
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
