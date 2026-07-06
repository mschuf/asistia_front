/**
 * @file EscalarTicketErsPage.tsx
 * @description Escalamiento de un ticket activo a un proyecto ERS.
 */
import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "@/api/apiClient";
import {
  escalarTicket,
  listarTiposProyecto,
  listarTecnicosPorSede,
  listarTicketsElegiblesErs,
  type ErsTechnician,
  type ErsProjectType,
} from "@/api/ers";
import {
  ErsStepperForm,
  type ErsStepperSubmitInput,
} from "@/components/ers/ErsStepperForm";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { getTicketById } from "@/services/ticketsService";
import type { AsistiaTicket } from "@/types/asistia";

/** Pantalla TI para crear un proyecto ERS a partir de un ticket existente. */
export default function EscalarTicketErsPage() {
  const { isTechnician } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { ticketId } = useParams();
  const numericTicketId = Number(ticketId);
  const validTicketId = Number.isFinite(numericTicketId) && numericTicketId > 0;

  const [ticket, setTicket] = useState<AsistiaTicket | null>(null);
  const [technicians, setTechnicians] = useState<ErsTechnician[]>([]);
  const [projectTypes, setProjectTypes] = useState<ErsProjectType[]>([]);
  const [loadingTicket, setLoadingTicket] = useState(true);
  const [loadingTechnicians, setLoadingTechnicians] = useState(true);
  const [loadingProjectTypes, setLoadingProjectTypes] = useState(true);
  const [projectTypesUnavailable, setProjectTypesUnavailable] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!validTicketId || !isTechnician) {
      setLoadingTicket(false);
      return;
    }

    const controller = new AbortController();
    setLoadingTicket(true);
    setError("");
    Promise.all([
      getTicketById(numericTicketId, { signal: controller.signal }),
      listarTicketsElegiblesErs(
        { search: String(numericTicketId), limit: 50 },
        { signal: controller.signal },
      ),
    ])
      .then(([detail, eligible]) => {
        if (controller.signal.aborted) return;
        if (!eligible.items.some((item) => item.ticketId === numericTicketId)) {
          setTicket(null);
          setError("El ticket ya no está disponible para escalar a ERS.");
          return;
        }
        setTicket(detail);
      })
      .catch((loadError) => {
        if (controller.signal.aborted) return;
        setTicket(null);
        setError(
          loadError instanceof ApiError
            ? loadError.message
            : "No se pudo cargar el ticket para escalar.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingTicket(false);
      });

    return () => controller.abort();
  }, [isTechnician, numericTicketId, validTicketId]);

  useEffect(() => {
    if (!validTicketId || !isTechnician) {
      setLoadingTechnicians(false);
      return;
    }

    const controller = new AbortController();
    setLoadingTechnicians(true);
    void listarTecnicosPorSede(
      { limit: 200 },
      { signal: controller.signal, showBackdrop: false },
    )
      .then((response) => {
        if (!controller.signal.aborted) setTechnicians(response.items);
      })
      .catch((loadError) => {
        if (controller.signal.aborted) return;
        setTechnicians([]);
        toast.error(
          loadError instanceof ApiError
            ? loadError.message
            : "No se pudieron cargar los técnicos activos.",
          "ERS",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingTechnicians(false);
      });

    return () => controller.abort();
  }, [isTechnician, toast, validTicketId]);

  useEffect(() => {
    if (!validTicketId || !isTechnician) {
      setLoadingProjectTypes(false);
      return;
    }

    const controller = new AbortController();
    setLoadingProjectTypes(true);
    setProjectTypesUnavailable(false);
    void listarTiposProyecto({ signal: controller.signal, showBackdrop: false })
      .then((response) => {
        if (!controller.signal.aborted) setProjectTypes(response);
      })
      .catch((loadError) => {
        if (controller.signal.aborted) return;
        setProjectTypes([]);
        setProjectTypesUnavailable(true);
        toast.error(
          loadError instanceof ApiError
            ? loadError.message
            : "No se pudieron cargar los sistemas relacionados.",
          "ERS",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingProjectTypes(false);
      });

    return () => controller.abort();
  }, [isTechnician, toast, validTicketId]);

  const handleSubmit = async (input: ErsStepperSubmitInput) => {
    try {
      const created = await escalarTicket(input);
      toast.success(`ERS #${created.projectId} creado correctamente.`, "ERS");
      navigate("/ers");
    } catch (submitError) {
      toast.error(
        submitError instanceof ApiError
          ? submitError.message
          : "No se pudo completar el escalamiento.",
        "ERS",
      );
    }
  };

  if (!isTechnician) return <Navigate to="/irs" replace />;
  if (!validTicketId) return <Navigate to="/irs?tab=historial" replace />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground">IRS / ERS</p>
          <h1 className="text-lg font-semibold">Escalar ticket #{numericTicketId}</h1>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/irs?tab=historial")}
        >
          Volver
        </Button>
      </div>

      {loadingTicket ? (
        <div className="rounded-md border bg-card p-6 shadow-soft">
          <Loading label="Cargando ticket..." />
        </div>
      ) : null}

      {!loadingTicket && error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {!loadingTicket && !error && ticket ? (
        <ErsStepperForm
          key={ticket.id}
          ticket={ticket}
          technicians={technicians}
          projectTypes={projectTypes}
          loadingTechnicians={loadingTechnicians}
          projectTypesDisabled={loadingProjectTypes || projectTypesUnavailable}
          onSubmit={handleSubmit}
        />
      ) : null}
    </div>
  );
}
