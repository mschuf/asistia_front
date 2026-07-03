/**
 * @file NuevoErsPage.tsx
 * @description Alta completa y atómica de ticket técnico y proyecto ERS.
 */
import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import {
  crearErs,
  listarEstadosProyecto,
  listarSedesErs,
  listarTecnicosPorSede,
  type ErsLocation,
  type ErsProjectState,
  type ErsTechnician,
} from "@/api/ers";
import { ApiError } from "@/api/apiClient";
import { ErsCreateDataPanel } from "@/components/ers/ErsCreateDataPanel";
import { ErsEditSidebar, type ErsEditSection } from "@/components/ers/ErsEditSidebar";
import { ErsProjectManagementPanel } from "@/components/ers/ErsProjectManagementPanel";
import { ErsTasksPanel } from "@/components/ers/ErsTasksPanel";
import { WorkspaceHeader } from "@/components/layout/WorkspaceHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  applyErsFinishedProjectStateAtFullProgress,
  computeErsProgressFromTasks,
} from "@/lib/ers-project-state";
import { toIsoDate } from "@/lib/ers";
import { resolveTaskAssigneeOptions } from "@/lib/ers-task-assignees";
import { cn } from "@/lib/utils";
import type { ErsEditState } from "@/types/pages/ers-page.types";

const EMPTY_FORM: ErsEditState = {
  projectName: "",
  objective: "",
  description: "",
  impact: "",
  approverId: "",
  projectStateId: "",
  teamMemberIds: [],
  tasks: [],
};

const SECTION_OPTIONS: Array<{ id: ErsEditSection; label: string }> = [
  { id: "escalador", label: "Datos iniciales" },
  { id: "gestion", label: "Gestión" },
  { id: "tareas", label: "Tareas" },
];

function resolveInitialState(states: ErsProjectState[]): ErsProjectState | null {
  const active = states.filter((state) => !state.isFinished);
  return (
    active.find((state) => state.name.trim().toLocaleLowerCase("es") === "nuevo") ??
    active.find((state) => state.name.trim().toLocaleLowerCase("es").startsWith("nuevo")) ??
    active[0] ??
    null
  );
}

/** Pantalla de creación completa de ERS sin seleccionar un ticket previo. */
export default function NuevoErsPage() {
  const { isTechnician, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const section = ((): ErsEditSection => {
    const value = searchParams.get("seccion");
    return value === "gestion" || value === "tareas" ? value : "escalador";
  })();

  const defaultRequester = useMemo<ErsTechnician | null>(
    () =>
      user
        ? { id: user.id, fullName: user.name, locationId: user.locationId }
        : null,
    [user],
  );
  const [requester, setRequester] = useState<ErsTechnician | null>(defaultRequester);
  const [locationId, setLocationId] = useState(user?.locationId ? String(user.locationId) : "");
  const [locations, setLocations] = useState<ErsLocation[]>([]);
  const [states, setStates] = useState<ErsProjectState[]>([]);
  const [technicians, setTechnicians] = useState<ErsTechnician[]>([]);
  const [teamTechnicians, setTeamTechnicians] = useState<ErsTechnician[]>([]);
  const [form, setForm] = useState<ErsEditState>(EMPTY_FORM);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);
  const [loadingTeamTechnicians, setLoadingTeamTechnicians] = useState(false);
  const [teamSearch, setTeamSearch] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!searchParams.has("id") && !searchParams.has("ticketId")) return;
    const next = new URLSearchParams(searchParams);
    next.delete("id");
    next.delete("ticketId");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!user) return;
    setRequester((current) => current ?? defaultRequester);
    setLocationId((current) => current || (user.locationId ? String(user.locationId) : ""));
  }, [defaultRequester, user]);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      listarSedesErs({ signal: controller.signal, showBackdrop: false }),
      listarEstadosProyecto({ signal: controller.signal, showBackdrop: false }),
    ])
      .then(([nextLocations, nextStates]) => {
        if (controller.signal.aborted) return;
        setLocations(nextLocations);
        setStates(nextStates);
        const initialState = resolveInitialState(nextStates);
        if (initialState) {
          setForm((current) =>
            current.projectStateId
              ? current
              : { ...current, projectStateId: String(initialState.id) },
          );
        }
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        toast.error(
          error instanceof ApiError ? error.message : "No se pudieron cargar los catálogos ERS.",
          "ERS",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingStates(false);
      });
    return () => controller.abort();
  }, [toast]);

  useEffect(() => {
    const controller = new AbortController();
    setLoadingTeamTechnicians(true);
    void listarTecnicosPorSede(
      { limit: 200 },
      { signal: controller.signal, showBackdrop: false },
    )
      .then((response) => {
        if (!controller.signal.aborted) setTeamTechnicians(response.items);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setTeamTechnicians([]);
        toast.error(
          error instanceof ApiError ? error.message : "No se pudo cargar el equipo técnico.",
          "ERS",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingTeamTechnicians(false);
      });
    return () => controller.abort();
  }, [toast]);

  useEffect(() => {
    const numericLocationId = Number(locationId);
    if (!Number.isFinite(numericLocationId) || numericLocationId <= 0) {
      setTechnicians([]);
      return;
    }
    const controller = new AbortController();
    setLoadingTechnicians(true);
    void listarTecnicosPorSede(
      { locationId: numericLocationId, limit: 200 },
      { signal: controller.signal, showBackdrop: false },
    )
      .then((response) => {
        if (!controller.signal.aborted) setTechnicians(response.items);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setTechnicians([]);
        toast.error(
          error instanceof ApiError ? error.message : "No se pudieron cargar los técnicos.",
          "ERS",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingTechnicians(false);
      });
    return () => controller.abort();
  }, [locationId, toast]);

  const progressFromTasks = useMemo(
    () => computeErsProgressFromTasks(form.tasks, states),
    [form.tasks, states],
  );

  useEffect(() => {
    if (states.length === 0 || progressFromTasks !== 100) return;
    setForm((current) => {
      const projectStateId = applyErsFinishedProjectStateAtFullProgress(
        current.projectStateId,
        progressFromTasks,
        states,
      );
      return projectStateId === current.projectStateId
        ? current
        : { ...current, projectStateId };
    });
  }, [progressFromTasks, states]);

  const taskAssigneeOptions = useMemo(() => {
    const activeTechnicianIds = new Set(teamTechnicians.map((technician) => technician.id));
    return resolveTaskAssigneeOptions(
      [],
      form.teamMemberIds,
      teamTechnicians,
      technicians,
    ).filter((technician) => activeTechnicianIds.has(technician.id));
  }, [form.teamMemberIds, teamTechnicians, technicians]);

  const setSection = (nextSection: ErsEditSection) => {
    const next = new URLSearchParams(searchParams);
    next.delete("id");
    next.delete("ticketId");
    next.set("seccion", nextSection);
    setSearchParams(next, { replace: true });
  };

  const clearLocationAssignments = (nextLocationId: string) => {
    setLocationId(nextLocationId);
    setTeamSearch("");
    setForm((current) => {
      const teamMemberIds = new Set(current.teamMemberIds);
      return {
        ...current,
        approverId: "",
        tasks: current.tasks.map((task) => ({
          ...task,
          userId: teamMemberIds.has(task.userId) ? task.userId : "",
        })),
      };
    });
  };

  const handleRequesterChange = (nextRequester: ErsTechnician | null) => {
    setRequester(nextRequester);
    clearLocationAssignments(nextRequester?.locationId ? String(nextRequester.locationId) : "");
  };

  const handleSave = async () => {
    if (!requester) {
      toast.error("Selecciona un solicitante.", "ERS");
      setSection("escalador");
      return;
    }
    if (!locationId) {
      toast.error("Selecciona una sede.", "ERS");
      setSection("escalador");
      return;
    }
    if (form.projectName.trim().length < 3 || form.projectName.trim().length > 200) {
      toast.error("El nombre del proyecto debe tener entre 3 y 200 caracteres.", "ERS");
      setSection("escalador");
      return;
    }
    if (!form.objective.trim()) {
      toast.error("El objetivo es obligatorio.", "ERS");
      setSection("escalador");
      return;
    }
    if (!form.description.trim()) {
      toast.error("La descripción es obligatoria.", "ERS");
      setSection("escalador");
      return;
    }
    const hasInvalidTask = form.tasks.some(
      (task) =>
        !task.name.trim() ||
        !task.content.trim() ||
        !task.projectStateId ||
        !task.userId ||
        !task.planStartDate ||
        !task.planEndDate,
    );
    if (hasInvalidTask) {
      toast.error("Completa todos los campos obligatorios de las tareas.", "ERS");
      setSection("tareas");
      return;
    }

    const projectStateId = applyErsFinishedProjectStateAtFullProgress(
      form.projectStateId,
      progressFromTasks,
      states,
    );
    setSaving(true);
    try {
      const created = await crearErs({
        requesterId: requester.id,
        locationId: Number(locationId),
        projectName: form.projectName.trim(),
        objective: form.objective.trim(),
        description: form.description.trim(),
        impact: form.impact.trim() || undefined,
        approverId: form.approverId ? Number(form.approverId) : undefined,
        projectStateId: projectStateId ? Number(projectStateId) : undefined,
        teamMemberIds: form.teamMemberIds.map(Number),
        tasks: form.tasks.map((task) => ({
          name: task.name.trim(),
          content: task.content.trim() || undefined,
          percentDone: Math.max(0, Math.min(100, Number(task.percentDone) || 0)),
          projectStateId: task.projectStateId ? Number(task.projectStateId) : undefined,
          userId: task.userId ? Number(task.userId) : undefined,
          planStartDate: toIsoDate(task.planStartDate),
          planEndDate: toIsoDate(task.planEndDate),
        })),
      });
      toast.success(`ERS #${created.projectId} creado correctamente.`, "ERS");
      navigate("/ers");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo crear el proyecto ERS.",
        "ERS",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isTechnician) return <Navigate to="/irs" replace />;

  return (
    <div className="space-y-4">
      <WorkspaceHeader />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground">IRS / ERS</p>
          <h1 className="text-lg font-semibold">Nuevo ERS</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/ers")}>Volver</Button>
          <Button type="button" onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-card p-2 md:hidden">
        <div className="grid grid-cols-3 gap-2">
          {SECTION_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setSection(option.id)}
              className={cn(
                "rounded-md px-2 py-2 text-xs font-medium transition-colors",
                section === option.id
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
        <div className="hidden md:block">
          <ErsEditSidebar activeSection={section} onChange={setSection} tasksCount={form.tasks.length} />
        </div>
        <div className="min-w-0">
          {section === "escalador" ? (
            <ErsCreateDataPanel
              requesterId={requester ? String(requester.id) : ""}
              requester={requester}
              locationId={locationId}
              locations={locations}
              form={form}
              onRequesterChange={handleRequesterChange}
              onLocationChange={clearLocationAssignments}
              onChange={setForm}
            />
          ) : null}
          {section === "gestion" ? (
            <ErsProjectManagementPanel
              form={form}
              onChange={setForm}
              states={states}
              technicians={technicians}
              teamTechnicians={teamTechnicians}
              loadingStates={loadingStates}
              loadingTechnicians={loadingTechnicians}
              loadingTeamTechnicians={loadingTeamTechnicians}
              showTeamLocations
              progressFromTasks={progressFromTasks}
              teamSearch={teamSearch}
              onTeamSearchChange={setTeamSearch}
            />
          ) : null}
          {section === "tareas" ? (
            <ErsTasksPanel
              form={form}
              onChange={setForm}
              states={states}
              technicians={teamTechnicians}
              assigneeOptions={taskAssigneeOptions}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
