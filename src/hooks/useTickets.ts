import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  createTicket,
  listCategories,
  listLocations,
  listTickets,
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

const SEARCH_DEBOUNCE_MS = 350;

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
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const [page, setPageState] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [catalogsLoading, setCatalogsLoading] = useState(false);
  const [error, setError] = useState("");
  const [catalogsError, setCatalogsError] = useState("");
  const [techniciansError, setTechniciansError] = useState("");
  const [statusChanging, setStatusChanging] = useState<{
    ticketId: number;
    status: AsistiaTicketStatus;
  } | null>(null);

  const listParams = useMemo(
    () => toListTicketParams(filters, page, debouncedSearch),
    [filters, page, debouncedSearch]
  );
  const ticketsFetchKey = JSON.stringify(listParams);
  const loadedTicketsKeyRef = useRef<string | null>(null);
  const statusChangeLockRef = useRef(false);
  const ticketsRef = useRef(tickets);

  ticketsRef.current = tickets;

  const totalPages = Math.max(1, Math.ceil(total / TICKETS_PAGE_SIZE));

  const needsCategories = tab === "crear" || visitedTabs.has("crear");
  const needsLocations =
    tab === "crear" ||
    tab === "historial" ||
    visitedTabs.has("crear") ||
    visitedTabs.has("historial") ||
    Boolean(user?.locationId);
  const needsTechnicians = tab === "historial" || visitedTabs.has("historial");

  const shouldFetchCategories = needsCategories && !loadedCatalogs.categories;
  const shouldFetchLocations = needsLocations && !loadedCatalogs.locations;
  const shouldFetchTechnicians = needsTechnicians && !loadedCatalogs.technicians;

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
      const searchOnly =
        prev.search !== next.search &&
        prev.status === next.status &&
        prev.type === next.type &&
        prev.assignedToId === next.assignedToId &&
        prev.locationId === next.locationId;
      if (!searchOnly) {
        setPageState(1);
      }
      return next;
    });
  }, [user]);

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
    setDebouncedSearch(defaults.search);
    setPageState(1);
    loadedTicketsKeyRef.current = null;
  }, [tab, user]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(filters.search), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [filters.search]);

  useEffect(() => {
    setPageState(1);
  }, [debouncedSearch]);

  const fetchTickets = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError("");
      try {
        const response = await listTickets(listParams, { signal });
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
        if (!signal?.aborted) setLoading(false);
      }
    },
    [listParams, ticketsFetchKey]
  );

  const refreshTickets = useCallback(async () => {
    await fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (!shouldFetchCategories && !shouldFetchLocations && !shouldFetchTechnicians) return;

    const controller = new AbortController();
    const { signal } = controller;

    async function loadCatalogs() {
      setCatalogsLoading(true);
      setCatalogsError("");
      setTechniciansError("");
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

        if (shouldFetchLocations) {
          tasks.push(
            listLocations({ signal }).then((result) => {
              if (signal.aborted) return;
              setLocations(result);
              setLoadedCatalogs((current) => ({ ...current, locations: true }));
            })
          );
        }

        await Promise.all(tasks);

        if (shouldFetchTechnicians) {
          try {
            const result = await searchTechnicians(undefined, 100, { signal });
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
          }
        }
      } catch (err) {
        if (signal.aborted || isAbortError(err)) return;
        const message =
          err instanceof ApiError || err instanceof Error ? err.message : "No se pudieron cargar los datos";
        setCatalogsError(message);
      } finally {
        if (!signal.aborted) setCatalogsLoading(false);
      }
    }

    void loadCatalogs();
    return () => controller.abort();
  }, [shouldFetchCategories, shouldFetchLocations, shouldFetchTechnicians]);

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
    },
    [toast]
  );

  const handleStatusChange = useCallback(
    async (ticketId: number, status: AsistiaTicketStatus) => {
      if (statusChangeLockRef.current) return;

      const normalizedTicketId = Number(ticketId);
      const previousTicket = ticketsRef.current.find(
        (ticket) => Number(ticket.id) === normalizedTicketId
      );

      if (!previousTicket || !canTransitionTicketStatus(previousTicket.status, status)) {
        toast.error("No se pudo cambiar el estado del ticket.");
        return;
      }

      setTickets((current) =>
        current.map((ticket) =>
          Number(ticket.id) === normalizedTicketId ? { ...ticket, status } : ticket
        )
      );

      statusChangeLockRef.current = true;
      setStatusChanging({ ticketId: normalizedTicketId, status });

      try {
        const updated = await updateTicketStatus(normalizedTicketId, status);
        if (!updated?.id) {
          throw new ApiError("La API no confirmó el cambio de estado.");
        }

        setTickets((current) =>
          current.map((ticket) =>
            Number(ticket.id) === normalizedTicketId ? updated : ticket
          )
        );
        toast.success(`Ticket #${normalizedTicketId}: ${statusLabel(status)}.`);
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
    loading,
    catalogsLoading,
    error,
    catalogsError,
    techniciansError,
    refreshTickets,
    handleCreateTicket,
    handleStatusChange,
    statusChanging
  };
}
