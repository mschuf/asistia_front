/**
 * @file NuevoErsPage.tsx
 * @description Pantalla de escalado de ticket a ERS mediante formulario por pasos.
 */
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { ApiError } from "@/api/apiClient";
import { escalarTicket, listarTecnicosPorSede, type ErsTechnician } from "@/api/ers";
import { ErsStepperForm, type ErsStepperSubmitInput } from "@/components/ers/ErsStepperForm";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
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

  useEffect(() => {
    if (!Number.isFinite(ticketId) || ticketId <= 0) {
      setError("Debes ingresar desde un ticket válido para escalar.");
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
        const detail = await getTicketById(ticketId);
        if (cancelled) return;
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
  }, [ticketId, prefillTicket]);

  useEffect(() => {
    if (!ticket?.location?.id) {
      setTechnicians([]);
      return;
    }
    let cancelled = false;
    setLoadingTechnicians(true);
    void listarTecnicosPorSede({ locationId: ticket.location.id, limit: 200 })
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
  }, [ticket?.location?.id]);

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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">IRS / ERS</p>
          <h1 className="text-lg font-semibold">Nuevo ERS</h1>
        </div>
        <Button type="button" variant="outline" onClick={() => navigate(-1)}>
          Volver
        </Button>
      </div>

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

