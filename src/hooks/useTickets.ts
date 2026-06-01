import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  createTicket,
  listCategories,
  listHistoryTickets,
  listLocations,
  searchTechnicians,
  updateTicketStatus
} from "../services/ticketsService";
import type { ListTicketsParams } from "../services/ticketsService";
import type { AsistiaTicketStatus, AsistiaUser } from "../types/asistia";
import type { TicketFilterState, TicketsTab, UseTicketsOptions, UseTicketsResult } from "../types/pages/tickets-page.types";
import { ApiError } from "../api/apiClient";
import { isAbortError } from "../lib/http";
import {
  buildInitialTicketFilters,
  canTransitionTicketStatus,
  HISTORY_TABLE_STATUSES,
  statusLabel,
  TICKETS_PAGE_SIZE
} from "../lib/tickets";

function readTab(value: string | null): TicketsTab {
  if (value === "crear" || value === "create") return "crear";
  if (value === "historial" || value === "history") return "historial";
  return "metricas";
}

function toListTicketParams(
  filters: TicketFilterState,
  page: number,
  search: string
): ListTicketsParams {
  const trimmedSearch = search.trim();
  const useHistoryDefaultStatuses = !filters.status && !trimmedSearch;

  return {
    page,
    limit: TICKETS_PAGE_SIZE,
    technicianId: filters.assignedToId ? Number(filters.assignedToId) : undefined,
    locationId: filters.locationId ? Number(filters.locationId) : undefined,
    status: filters.status || undefined,
    statuses: useHistoryDefaultStatuses ? [...HISTORY_TABLE_STATUSES] : undefined,
    type: filters.type || undefined,
    search: trimmedSearch || undefined
  };
}

export function useTickets(options: UseTicketsOptions = {}): UseTicketsResult {
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = readTab(searchParams.get("tab"));
  const onTicketCreatedRef = useRef(options.onTicketCreated);
  onTicketCreatedRef.current = options.onTicketCreated;

  const [visitedTabs, setVisitedTabs] = useState<Set<TicketsTab>>(() => new Set([tab]));
  const [loadedCatalogs, setLoadedCatalogs] = useState({
    categories: false,
    locations: false,
    technicians: false
  });

  const [categories, setCategories] = useState<UseTicketsResult["categories"]>([]);
  const [locations, setLocations] = useState<UseTicketsResult["locations"]>([]);
  const [technicians, setTechnicians] = useState<AsistiaUser[]>([]);
  const [tickets, setTickets] = useState<UseTicketsResult["tickets"]>([]);
  const [filters, setFiltersState] = useState<TicketFilterState>(() => buildInitialTicketFilters(user));
  const [appliedFilters, setAppliedFilters] = useState<TicketFilterState>(() =>
    buildInitialTicketFilters(user)
  );
  const [page, setPageState] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [catalogsLoading, setCatalogsLoading] = useState(false);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [techniciansLoading, setTechniciansLoading] = useState(false);
  const [historyTicketsReady, setHistoryTicketsReady] = useState(false);
  const [error, setError] = useState("");
  const [catalogsError, setCatalogsError] = useState("");
  const [techniciansError, setTechniciansError] = useState("");
  const [statusChanging, setStatusChanging] = useState<{
    ticketId: number;
    status: AsistiaTicketStatus;
  } | null>(null);

  const listParams = useMemo(
    () => toListTicketParams(appliedFilters, page, appliedFilters.search),
    [appliedFilters, page]
  );
  const ticketsFetchKey = JSON.stringify(listParams);
  const loadedTicketsKeyRef = useRef<string | null>(null);
  const statusChangeLockRef = useRef(false);
  const ticketsRef = useRef(tickets);

  ticketsRef.current = tickets;

  const totalPages = Math.max(1, Math.ceil(total / TICKETS_PAGE_SIZE));

  const needsCategories = tab === "crear" || visitedTabs.has("crear");
  const needsLocationsForCrear = tab === "crear" || visitedTabs.has("crear");

  const shouldFetchCategories = needsCategories && !loadedCatalogs.categories;
  const shouldFetchLocationsForCrear =
    needsLocationsForCrear && !loadedCatalogs.locations;
  const shouldPrefetchLocationsForBadges =
    Boolean(user?.locationId) &&
    !loadedCatalogs.locations &&
    tab !== "crear" &&
    tab !== "historial";

  const setTab = useCallback(
    (nextTab: TicketsTab) => {
      setSearchParams(nextTab === "metricas" ? {} : { tab: nextTab });
    },
    [setSearchParams]
  );

  const setPage = useCallback((nextPage: number) => {
    setPageState(Math.max(1, nextPage));
  }, []);

  const setFilters = useCallback((value: TicketFilterState) => {
    setFiltersState((prev) => {
      let next = value;
      if (!value.search.trim() && prev.search.trim()) {
        const defaults = buildInitialTicketFilters(user);
        if (!value.status && !value.assignedToId) {
          next = {
            ...value,
            status: defaults.status,
            assignedToId: defaults.assignedToId,
          };
        }
      }
      return next;
    });
  }, [user]);

  const applyFilters = useCallback(() => {
    setAppliedFilters(filters);
    setPageState(1);
  }, [filters]);

  useEffect(() => {
    setVisitedTabs((current) => {
      if (current.has(tab)) return current;
      const next = new Set(current);
      next.add(tab);
      return next;
    });
  }, [tab]);

  useEffect(() => {
    if (tab === "historial") return;
    setHistoryTicketsReady(false);
  }, [tab]);

  useEffect(() => {
    if (tab === "historial") return;

    const defaults = buildInitialTicketFilters(user);
    setFiltersState((current) => {
      const isDefault =
        current.search === defaults.search &&
        current.status === defaults.status &&
        current.type === defaults.type &&
        current.assignedToId === defaults.assignedToId &&
        current.locationId === defaults.locationId;
      return isDefault ? current : defaults;
    });
    setAppliedFilters((current) => {
      const isDefault =
        current.search === defaults.search &&
        current.status === defaults.status &&
        current.type === defaults.type &&
        current.assignedToId === defaults.assignedToId &&
        current.locationId === defaults.locationId;
      return isDefault ? current : defaults;
    });
    setPageState(1);
    loadedTicketsKeyRef.current = null;
  }, [tab, user]);

  const fetchTickets = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError("");
      try {
        const response = await listHistoryTickets(listParams, { signal });
        if (signal?.aborted) return;
        setTickets(response.items);
        setTotal(response.total);
        setPageState(response.page);
        loadedTicketsKeyRef.current = ticketsFetchKey;
      } catch (err) {
        if (signal?.aborted || isAbortError(err)) return;
        const message =
          err instanceof ApiError || err instanceof Error ? err.message : "Error al cargar tickets";
        setError(message);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setHistoryTicketsReady(true);
        }
      }
    },
    [listParams, ticketsFetchKey]
  );

  const refreshTickets = useCallback(async () => {
    await fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (!shouldPrefetchLocationsForBadges) return;

    const controller = new AbortController();
    const { signal } = controller;

    async function prefetchLocationsForBadges() {
      try {
        const result = await listLocations({ signal, showBackdrop: false });
        if (signal.aborted) return;
        setLocations(result);
        setLoadedCatalogs((current) => ({ ...current, locations: true }));
      } catch (err) {
        // El prefetch de badges es best-effort: no debe impactar métricas.
        if (signal.aborted || isAbortError(err)) return;
      }
    }

    void prefetchLocationsForBadges();
    return () => controller.abort();
  }, [shouldPrefetchLocationsForBadges]);

  useEffect(() => {
    if (!shouldFetchCategories && !shouldFetchLocationsForCrear) return;

    const controller = new AbortController();
    const { signal } = controller;

    async function loadCreateCatalogs() {
      setCatalogsLoading(true);
      setCatalogsError("");
      try {
        const tasks: Promise<void>[] = [];

        if (shouldFetchCategories) {
          tasks.push(
            listCategories({ signal }).then((result) => {
              if (signal.aborted) return;
              setCategories(result);
              setLoadedCatalogs((current) => ({ ...current, categories: true }));
            })
          );
        }

        if (shouldFetchLocationsForCrear) {
          tasks.push(
            listLocations({ signal }).then((result) => {
              if (signal.aborted) return;
              setLocations(result);
              setLoadedCatalogs((current) => ({ ...current, locations: true }));
            })
          );
        }

        await Promise.all(tasks);
      } catch (err) {
        if (signal.aborted || isAbortError(err)) return;
        const message =
          err instanceof ApiError || err instanceof Error ? err.message : "No se pudieron cargar los datos";
        setCatalogsError(message);
      } finally {
        if (!signal.aborted) setCatalogsLoading(false);
      }
    }

    void loadCreateCatalogs();
    return () => controller.abort();
  }, [shouldFetchCategories, shouldFetchLocationsForCrear]);

  useEffect(() => {
    if (tab !== "historial" || !historyTicketsReady || loadedCatalogs.locations) {
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    async function loadHistoryLocations() {
      setLocationsLoading(true);
      setCatalogsError("");
      try {
        const result = await listLocations({ signal, showBackdrop: false });
        if (signal.aborted) return;
        setLocations(result);
        setLoadedCatalogs((current) => ({ ...current, locations: true }));
      } catch (err) {
        if (signal.aborted || isAbortError(err)) return;
        const message =
          err instanceof ApiError || err instanceof Error
            ? err.message
            : "No se pudieron cargar las sedes";
        setCatalogsError(message);
      } finally {
        if (!signal.aborted) setLocationsLoading(false);
      }
    }

    void loadHistoryLocations();
    return () => controller.abort();
  }, [tab, historyTicketsReady, loadedCatalogs.locations]);

  useEffect(() => {
    if (tab !== "historial" || !loadedCatalogs.locations || loadedCatalogs.technicians) {
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    async function loadHistoryTechnicians() {
      setTechniciansLoading(true);
      setTechniciansError("");
      try {
        const result = await searchTechnicians(undefined, 100, {
          signal,
          showBackdrop: false,
        });
        if (signal.aborted) return;
        setTechnicians(result.items);
        setLoadedCatalogs((current) => ({ ...current, technicians: true }));
      } catch (err) {
        if (signal.aborted || isAbortError(err)) return;
        const message =
          err instanceof ApiError || err instanceof Error
            ? err.message
            : "No se pudieron cargar los técnicos";
        setTechniciansError(message);
      } finally {
        if (!signal.aborted) setTechniciansLoading(false);
      }
    }

    void loadHistoryTechnicians();
    return () => controller.abort();
  }, [tab, loadedCatalogs.locations, loadedCatalogs.technicians]);

  useEffect(() => {
    if (tab !== "historial") return;

    const controller = new AbortController();
    void fetchTickets(controller.signal);
    return () => controller.abort();
  }, [tab, ticketsFetchKey, fetchTickets]);

  const handleCreateTicket = useCallback(
    async (input: Parameters<UseTicketsResult["handleCreateTicket"]>[0]) => {
      const created = await createTicket(input);
      const mailNote = created.mail.sent ? "" : " (correo no enviado)";
      toast.success(`Ticket #${created.id} creado${mailNote}.`);
      await onTicketCreatedRef.current?.(created.id);
      void refreshTickets();
    },
    [toast, refreshTickets]
  );

  const handleStatusChange = useCallback(
    async (
      ticketId: number,
      status: AsistiaTicketStatus,
      options?: { resolutionNote?: string }
    ): Promise<boolean> => {
      if (statusChangeLockRef.current) return false;

      const normalizedTicketId = Number(ticketId);
      const previousTicket = ticketsRef.current.find(
        (ticket) => Number(ticket.id) === normalizedTicketId
      );

      if (!previousTicket || !canTransitionTicketStatus(previousTicket.status, status)) {
        toast.error("No se pudo cambiar el estado del ticket.");
        return false;
      }

      setTickets((current) =>
        current.map((ticket) =>
          Number(ticket.id) === normalizedTicketId ? { ...ticket, status } : ticket
        )
      );

      statusChangeLockRef.current = true;
      setStatusChanging({ ticketId: normalizedTicketId, status });

      try {
        const updated = await updateTicketStatus(normalizedTicketId, status, options);
        if (!updated?.id) {
          throw new ApiError("La API no confirmó el cambio de estado.");
        }

        setTickets((current) =>
          current.map((ticket) =>
            Number(ticket.id) === normalizedTicketId ? updated : ticket
          )
        );
        toast.success(`Ticket #${normalizedTicketId}: ${statusLabel(status)}.`);
        return true;
      } catch (err) {
        setTickets((current) =>
          current.map((ticket) =>
            Number(ticket.id) === normalizedTicketId ? previousTicket : ticket
          )
        );
        const message =
          err instanceof ApiError || err instanceof Error
            ? err.message
            : "No se pudo actualizar el estado";
        toast.error(message);
        return false;
      } finally {
        statusChangeLockRef.current = false;
        setStatusChanging(null);
      }
    },
    [toast]
  );

  return {
    tab,
    setTab,
    categories,
    locations,
    technicians,
    tickets,
    pagination: {
      page,
      limit: TICKETS_PAGE_SIZE,
      total,
      totalPages
    },
    setPage,
    filters,
    setFilters,
    applyFilters,
    loading,
    catalogsLoading,
    locationsLoading,
    techniciansLoading,
    error,
    catalogsError,
    techniciansError,
    refreshTickets,
    handleCreateTicket,
    handleStatusChange,
    statusChanging
  };
}
