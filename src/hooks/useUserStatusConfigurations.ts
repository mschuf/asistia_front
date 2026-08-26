import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/api/apiClient";
import {
  listConfigurations,
  type Configuration,
  type ConfigurationFilters,
  type ConfigurationPageSize,
  type ConfigurationSortColumn,
  type SortOrder,
} from "@/api/userStatusConfigurations";

export const EMPTY_CONFIGURATION_FILTERS: ConfigurationFilters = {
  search: "",
  description: "",
  value: "",
  active: "",
  updatedFrom: "",
  updatedTo: "",
};

export function useUserStatusConfigurations() {
  const [items, setItems] = useState<Configuration[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimitState] = useState<ConfigurationPageSize>(15);
  const [draftFilters, setDraftFilters] = useState<ConfigurationFilters>(EMPTY_CONFIGURATION_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<ConfigurationFilters>(EMPTY_CONFIGURATION_FILTERS);
  const [sort, setSort] = useState<{ column: ConfigurationSortColumn; order: SortOrder } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    void listConfigurations({
      ...appliedFilters,
      page,
      limit,
      sortBy: sort?.column,
      sortOrder: sort?.order,
      signal: controller.signal,
    })
      .then((result) => {
        setItems(result.items);
        setTotal(result.total);
      })
      .catch((caught) => {
        if (controller.signal.aborted) return;
        setError(caught instanceof ApiError ? caught.message : "No se pudieron cargar las configuraciones.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [appliedFilters, limit, page, reloadKey, sort]);

  const applyFilters = useCallback(() => {
    setPage(1);
    setAppliedFilters({ ...draftFilters });
  }, [draftFilters]);

  const setPageLimit = useCallback((next: ConfigurationPageSize) => {
    setPage(1);
    setLimitState(next);
  }, []);

  const setSortColumn = useCallback((column: ConfigurationSortColumn) => {
    setPage(1);
    setSort((current) => {
      if (!current || current.column !== column) return { column, order: "desc" };
      if (current.order === "desc") return { column, order: "asc" };
      return null;
    });
  }, []);

  const totalPages = useMemo(
    () => limit === "all" ? 1 : Math.max(1, Math.ceil(total / limit)),
    [limit, total],
  );

  return {
    items,
    total,
    page,
    limit,
    totalPages,
    draftFilters,
    setDraftFilters,
    applyFilters,
    setPage,
    setPageLimit,
    sort,
    setSortColumn,
    loading,
    error,
    reload: () => setReloadKey((value) => value + 1),
  };
}
