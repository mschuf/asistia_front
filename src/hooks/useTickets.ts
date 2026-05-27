import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  assignTicketTechnician,
  createTicket,
  listCategories,
  listLocations,
  listTickets,
  updateTicketStatus
} from "../services/ticketsService";
import type { AsistiaCategory, AsistiaLocation, AsistiaTicket, AsistiaTicketStatus } from "../types/asistia";
import type { TicketFilterState, TicketsTab, UseTicketsResult } from "../types/pages/tickets-page.types";
import { ApiError } from "../api/apiClient";

const initialFilters: TicketFilterState = {
  search: "",
  status: "",
  type: ""
};

function readTab(value: string | null): TicketsTab {
  return value === "create" ? "create" : "history";
}

export function useTickets(): UseTicketsResult {
  const { isTechnician } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = readTab(searchParams.get("tab"));

  const [categories, setCategories] = useState<AsistiaCategory[]>([]);
  const [locations, setLocations] = useState<AsistiaLocation[]>([]);
  const [tickets, setTickets] = useState<AsistiaTicket[]>([]);
  const [filters, setFilters] = useState<TicketFilterState>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const setTab = useCallback(
    (nextTab: TicketsTab) => {
      setSearchParams(nextTab === "history" ? {} : { tab: nextTab });
    },
    [setSearchParams]
  );

  const refreshTickets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await listTickets(isTechnician);
      setTickets(response.items);
    } catch (err) {
      const message = err instanceof ApiError || err instanceof Error ? err.message : "Error al cargar tickets";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isTechnician]);

  useEffect(() => {
    let mounted = true;

    async function loadResources() {
      setLoading(true);
      setError("");
      try {
        const [categoriesResult, locationsResult, ticketsResult] = await Promise.all([
          listCategories(),
          listLocations(),
          listTickets(isTechnician)
        ]);

        if (!mounted) return;
        setCategories(categoriesResult);
        setLocations(locationsResult);
        setTickets(ticketsResult.items);
      } catch (err) {
        if (!mounted) return;
        const message =
          err instanceof ApiError || err instanceof Error ? err.message : "No se pudieron cargar los datos";
        setError(message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadResources();
    return () => {
      mounted = false;
    };
  }, [isTechnician]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (filters.status && ticket.status !== filters.status) return false;
      if (filters.type && ticket.type !== filters.type) return false;
      if (!filters.search.trim()) return true;
      const haystack = [
        ticket.id,
        ticket.subject,
        ticket.requester.name,
        ticket.technician?.name,
        ticket.category?.name
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(filters.search.trim().toLowerCase());
    });
  }, [tickets, filters]);

  const handleCreateTicket = useCallback(
    async (input: {
      type: "incident" | "request";
      subject: string;
      description: string;
      categoryId: number;
      locationId?: number;
      assignedTechnicianId?: number;
    }) => {
      const created = await createTicket(input);
      await refreshTickets();
      setTab("history");
      const mailNote = created.mail.sent ? "" : " (correo no enviado)";
      toast.success(`Ticket #${created.id} creado correctamente${mailNote}.`);
      return `Ticket #${created.id} creado`;
    },
    [refreshTickets, setTab, toast]
  );

  const handleStatusChange = useCallback(
    async (ticketId: number, status: AsistiaTicketStatus) => {
      await updateTicketStatus(ticketId, status);
      await refreshTickets();
      toast.success("Estado actualizado.");
    },
    [refreshTickets, toast]
  );

  return {
    tab,
    setTab,
    categories,
    locations,
    tickets,
    filteredTickets,
    filters,
    setFilters,
    loading,
    error,
    refreshTickets,
    handleCreateTicket,
    handleStatusChange
  };
}

export { assignTicketTechnician };
