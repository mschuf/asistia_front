/**
 * @file NuevoErsPage.tsx
 * @description Pantalla de escalado de ticket a ERS mediante formulario por pasos.
 */
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { ApiError } from "@/api/apiClient";
import {
  escalarTicket,
  listarTecnicosPorSede,
  listarTicketsElegiblesErs,
  type ErsTechnician,
} from "@/api/ers";
import { ErsStepperForm, type ErsStepperSubmitInput } from "@/components/ers/ErsStepperForm";
import { WorkspaceHeader } from "@/components/layout/WorkspaceHeader";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { ServerSearchableSelect } from "@/components/ui/server-searchable-select";
import type { SearchableSelectOption } from "@/components/ui/searchable-select";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { getTicketById } from "@/services/ticketsService";
import type { AsistiaTicket } from "@/types/asistia";

interface NuevoErsRouteState {
  prefillTicket?: AsistiaTicket;
}

/** Página de creación inicial del ERS. */
export default function NuevoErsPage() {
  const toast = useToast();
  const { isTechnician } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const prefillTicket = (location.state as NuevoErsRouteState | null)?.prefillTicket ?? null;
  const [ticket, setTicket] = useState<AsistiaTicket | null>(prefillTicket);
  const [loading, setLoading] = useState(prefillTicket === null);
  const [error, setError] = useState("");
  const [technicians, setTechnicians] = useState<ErsTechnician[]>([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);

  const ticketId = Number(searchParams.get("id") ?? searchParams.get("ticketId"));
  const hasTicketId = Number.isFinite(ticketId) && ticketId > 0;

  const loadEligibleTickets = useCallback(
    async (query: string, signal: AbortSignal): Promise<SearchableSelectOption[]> => {
      const response = await listarTicketsElegiblesErs(
        { search: query.trim() || undefined, limit: 50 },
        { signal },
      );
      return response.items.map((item) => ({
        value: String(item.ticketId),
        label: `#${item.ticketId} · ${item.subject}`,
        searchText: `${item.ticketId} ${item.subject} ${item.requesterName ?? ""} ${item.locationName ?? ""}`,
      }));
    },
    [],
  );

  useEffect(() => {
    if (!hasTicketId) {
      setTicket(null);
      setError("");
      setLoading(false);
      return;
    }
    if (prefillTicket && Number(prefillTicket.id) === ticketId) {
      setTicket(prefillTicket);
      setError("");
      setLoading(false);
      return;
    }
    let cancelled = false;

    async function loadTicket() {
      setLoading(true);
      setError("");
      try {
        const [detail, eligible] = await Promise.all([
          getTicketById(ticketId),
          listarTicketsElegiblesErs({ search: String(ticketId), limit: 50 }),
        ]);
        if (cancelled) return;
        if (!eligible.items.some((item) => item.ticketId === ticketId)) {
          setTicket(null);
          setError("El ticket ya no está disponible para escalar a ERS.");
          return;
        }
        setTicket(detail);
      } catch (loadError) {
        if (cancelled) return;
        const message = loadError instanceof ApiError ? loadError.message : "No se pudo cargar el ticket.";
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadTicket();
    return () => {
      cancelled = true;
    };
  }, [hasTicketId, ticketId, prefillTicket]);

  useEffect(() => {
    if (!ticket) {
      setTechnicians([]);
      return;
    }
    let cancelled = false;
    setLoadingTechnicians(true);
    void listarTecnicosPorSede({ locationId: ticket.location?.id ?? undefined, limit: 200 })
      .then((response) => {
        if (!cancelled) setTechnicians(response.items);
      })
      .catch(() => {
        if (!cancelled) setTechnicians([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingTechnicians(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ticket]);

  const handleSubmit = async (input: ErsStepperSubmitInput) => {
    try {
      const created = await escalarTicket(input);
      toast.success(`ERS #${created.projectId} creado correctamente.`, "ERS");
      navigate("/ers");
    } catch (submitError) {
      const message =
        submitError instanceof ApiError ? submitError.message : "No se pudo completar el escalado.";
      toast.error(message, "ERS");
    }
  };

  if (!isTechnician) {
    return <Navigate to="/irs" replace />;
  }

  return (
    <div className="space-y-4">
      <WorkspaceHeader />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">IRS / ERS</p>
          <h1 className="text-lg font-semibold">Nuevo ERS</h1>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(hasTicketId ? "/ers/nuevo" : "/ers")}
        >
          {hasTicketId ? "Cambiar ticket" : "Volver"}
        </Button>
      </div>

      {!hasTicketId ? (
        <div className="rounded-md border bg-card p-4 shadow-soft">
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium">Ticket origen</span>
            <ServerSearchableSelect
              value=""
              onChange={(value) => {
                if (value) navigate(`/ers/nuevo?id=${value}`);
              }}
              onLoadOptions={loadEligibleTickets}
              placeholder="Seleccionar ticket para escalar"
              searchPlaceholder="Buscar por ID, título, solicitante o sede..."
              noResultsText="No hay tickets activos disponibles"
              loadingText="Buscando tickets..."
            />
          </label>
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-md border bg-card p-6">
          <Loading label="Cargando ticket..." />
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      {!loading && !error && ticket ? (
        <ErsStepperForm
          ticket={ticket}
          technicians={technicians}
          loadingTechnicians={loadingTechnicians}
          onSubmit={handleSubmit}
        />
      ) : null}
    </div>
  );
}

