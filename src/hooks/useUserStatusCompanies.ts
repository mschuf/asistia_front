import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/api/apiClient";
import {
  listUserStatusCompanies,
  type SortOrder,
  type UserStatusCompany,
  type UserStatusCompanyFilters,
  type UserStatusCompanyPageSize,
  type UserStatusCompanySortColumn,
} from "@/api/userStatusCompanies";

export const EMPTY_COMPANY_FILTERS: UserStatusCompanyFilters = {
  search: "",
  name: "",
  active: "",
  userCount: "",
  updatedFrom: "",
  updatedTo: "",
};

export function useUserStatusCompanies() {
  const [items, setItems] = useState<UserStatusCompany[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimitState] = useState<UserStatusCompanyPageSize>(15);
  const [draftFilters, setDraftFilters] = useState<UserStatusCompanyFilters>(EMPTY_COMPANY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<UserStatusCompanyFilters>(EMPTY_COMPANY_FILTERS);
  const [sort, setSort] = useState<{ column: UserStatusCompanySortColumn; order: SortOrder } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    void listUserStatusCompanies({
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
        setError(caught instanceof ApiError ? caught.message : "No se pudieron cargar las empresas.");
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

  const setPageLimit = useCallback((next: UserStatusCompanyPageSize) => {
    setPage(1);
    setLimitState(next);
  }, []);

  const setSortColumn = useCallback((column: UserStatusCompanySortColumn) => {
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
