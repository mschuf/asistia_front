import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/api/apiClient";
import {
  getUserStatusSourceCounts,
  listUserStatuses,
  type MonitoredUser,
  type UserStatusCountScope,
  type UserStatusFilters,
  type UserStatusPageSize,
  type UserStatusSortColumn,
  type UserStatusSortOrder,
  type UserStatusSourceCounts,
} from "@/api/userStatus";

export const EMPTY_USER_STATUS_FILTERS: UserStatusFilters = {
  search: "", name: "", companyId: "", ad: "", sap: "", office: "", glpi: "",
  source: "", status: "", active: "", updatedFrom: "", updatedTo: "",
};

const EMPTY_SOURCE_COUNTS: UserStatusSourceCounts = { AD: 0, SAP: 0, OFFICE: 0, GLPI: 0 };

export function useUserStatusList() {
  const [items, setItems] = useState<MonitoredUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimitState] = useState<UserStatusPageSize>(15);
  const [draftFilters, setDraftFilters] = useState<UserStatusFilters>(EMPTY_USER_STATUS_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<UserStatusFilters>(EMPTY_USER_STATUS_FILTERS);
  const [sort, setSort] = useState<{ column: UserStatusSortColumn; order: UserStatusSortOrder } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [sourceCounts, setSourceCounts] = useState<UserStatusSourceCounts>(EMPTY_SOURCE_COUNTS);
  const [countScope, setCountScope] = useState<UserStatusCountScope>("all");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    void listUserStatuses({
      ...appliedFilters,
      page,
      limit,
      sortBy: sort?.column,
      sortOrder: sort?.order,
      signal: controller.signal,
    })
      .then((result) => { setItems(result.items); setTotal(result.total); })
      .catch((caught) => {
        if (controller.signal.aborted) return;
        setError(caught instanceof ApiError ? caught.message : "No se pudieron cargar los estados de usuarios.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [appliedFilters, limit, page, reloadKey, sort]);

  useEffect(() => {
    const controller = new AbortController();
    void getUserStatusSourceCounts(countScope, controller.signal)
      .then(setSourceCounts)
      .catch(() => { if (!controller.signal.aborted) setSourceCounts(EMPTY_SOURCE_COUNTS); });
    return () => controller.abort();
  }, [countScope, reloadKey]);

  const applyFilters = useCallback(() => {
    setPage(1);
    setAppliedFilters({ ...draftFilters });
  }, [draftFilters]);

  const setPageLimit = useCallback((next: UserStatusPageSize) => {
    setPage(1);
    setLimitState(next);
  }, []);

  const setSortColumn = useCallback((column: UserStatusSortColumn) => {
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

  const reload = useCallback(() => setReloadKey((value) => value + 1), []);

  return {
    items, total, page, limit, totalPages, draftFilters, setDraftFilters,
    applyFilters, setPage, setPageLimit, sort, setSortColumn, loading, error,
    sourceCounts, countScope, setCountScope, reload,
  };
}
