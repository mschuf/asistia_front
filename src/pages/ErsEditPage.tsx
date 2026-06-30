/**
 * @file ErsEditPage.tsx
 * @description Pantalla de edición ERS con menú contextual en tres secciones.
 */
import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  guardarErs,
  listarEstadosProyecto,
  listarTecnicosPorSede,
  obtenerErs,
  type ErsDetail,
  type ErsProjectState,
  type ErsTechnician,
} from "@/api/ers";
import { ApiError } from "@/api/apiClient";
import { ErsEditSidebar, type ErsEditSection } from "@/components/ers/ErsEditSidebar";
import { ErsEscalationDataPanel } from "@/components/ers/ErsEscalationDataPanel";
import { ErsProjectManagementPanel } from "@/components/ers/ErsProjectManagementPanel";
import { ErsTasksPanel } from "@/components/ers/ErsTasksPanel";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  applyErsFinishedProjectStateAtFullProgress,
  computeErsProgressFromTasks,
} from "@/lib/ers-project-state";
import { toDateTimeLocal, toIsoDate } from "@/lib/ers";
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
  { id: "escalador", label: "Datos del escalador" },
  { id: "gestion", label: "Gestión" },
  { id: "tareas", label: "Tareas" },
];

function parseSection(value: string | null): ErsEditSection {
  if (value === "gestion" || value === "tareas") return value;
  return "escalador";
}

function mapDetailToForm(detail: ErsDetail): ErsEditState {
  return {
    projectName: detail.projectName,
    objective: detail.objective ?? "",
    description: detail.description ?? "",
    impact: detail.impact ?? "",
    approverId: detail.approverId ? String(detail.approverId) : "",
    projectStateId: detail.projectStateId ? String(detail.projectStateId) : "",
    teamMemberIds: detail.team.map((member) => String(member.userId)),
    tasks: detail.tasks.map((task) => ({
      id: task.id,
      name: task.name,
      content: task.content ?? "",
      percentDone: task.percentDone,
      projectStateId: task.projectStateId ? String(task.projectStateId) : "",
      projectStateName: task.projectStateName ?? "",
      userId: task.userId ? String(task.userId) : "",
      planStartDate: toDateTimeLocal(task.planStartDate),
      planEndDate: toDateTimeLocal(task.planEndDate),
    })),
  };
}

/** Edición TI de ERS con navegación por secciones. */
export default function ErsEditPage() {
  const { isTechnician, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const section = parseSection(searchParams.get("seccion"));
  const projectIdNumber = Number(projectId);

  const [detail, setDetail] = useState<ErsDetail | null>(null);
  const [states, setStates] = useState<ErsProjectState[]>([]);
  const [form, setForm] = useState<ErsEditState>(EMPTY_FORM);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);
  const [saving, setSaving] = useState(false);
  const [technicians, setTechnicians] = useState<ErsTechnician[]>([]);
  const [userLocationTechnicians, setUserLocationTechnicians] = useState<ErsTechnician[]>([]);
  const [teamSearch, setTeamSearch] = useState("");

  useEffect(() => {
    if (!Number.isFinite(projectIdNumber) || projectIdNumber <= 0) {
      return;
    }
    let cancelled = false;
    setLoadingDetail(true);
    void obtenerErs(projectIdNumber)
      .then((response) => {
        if (cancelled) return;
        setDetail(response);
        setForm(mapDetailToForm(response));
      })
      .catch((error) => {
        if (cancelled) return;
        const message = error instanceof ApiError ? error.message : "No se pudo cargar el detalle del ERS.";
        toast.error(message, "ERS");
        navigate("/ers", { replace: true });
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false);
      });
    return () => {
      cancelled = true;
    };
  }, [navigate, projectIdNumber, toast]);

  useEffect(() => {
    let cancelled = false;
    setLoadingStates(true);
    void listarEstadosProyecto()
      .then((response) => {
        if (!cancelled) setStates(response);
      })
      .catch(() => {
        if (!cancelled) setStates([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingStates(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!detail?.locationId) {
      setTechnicians([]);
      return;
    }
    let cancelled = false;
    setLoadingTechnicians(true);
    void listarTecnicosPorSede({ locationId: detail.locationId, limit: 200 })
      .then((response) => {
        if (!cancelled) setTechnicians(response.items);
      })
      .catch((error) => {
        if (cancelled) return;
        const message = error instanceof ApiError ? error.message : "No se pudieron cargar técnicos.";
        toast.error(message, "ERS");
      })
      .finally(() => {
        if (!cancelled) setLoadingTechnicians(false);
      });

    return () => {
      cancelled = true;
    };
  }, [detail?.locationId, toast]);

  useEffect(() => {
    if (!user?.locationId) {
      setUserLocationTechnicians([]);
      return;
    }
    let cancelled = false;
    void listarTecnicosPorSede({ locationId: user.locationId, limit: 200 })
      .then((response) => {
        if (!cancelled) setUserLocationTechnicians(response.items);
      })
      .catch(() => {
        if (!cancelled) setUserLocationTechnicians([]);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.locationId]);

  const progressFromTasks = useMemo(
    () => computeErsProgressFromTasks(form.tasks, states),
    [form.tasks, states],
  );

  useEffect(() => {
    if (states.length === 0 || progressFromTasks !== 100) return;
    setForm((prev) => {
      const nextProjectStateId = applyErsFinishedProjectStateAtFullProgress(
        prev.projectStateId,
        progressFromTasks,
        states,
      );
      if (nextProjectStateId === prev.projectStateId) return prev;
      return { ...prev, projectStateId: nextProjectStateId };
    });
  }, [progressFromTasks, states]);

  const taskAssigneeOptions = useMemo(
    () =>
      resolveTaskAssigneeOptions(
        detail?.team ?? [],
        form.teamMemberIds,
        technicians,
        userLocationTechnicians,
      ),
    [detail?.team, form.teamMemberIds, technicians, userLocationTechnicians],
  );

  const setSection = (nextSection: ErsEditSection) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("seccion", nextSection);
    setSearchParams(nextParams, { replace: true });
  };

  const reloadDetail = async () => {
    if (!Number.isFinite(projectIdNumber) || projectIdNumber <= 0) return;
    const updated = await obtenerErs(projectIdNumber);
    setDetail(updated);
    setForm(mapDetailToForm(updated));
  };

  const handleSave = async () => {
    if (!detail) return;
    if (form.projectName.trim().length < 3) {
      toast.error("El nombre del proyecto debe tener al menos 3 caracteres.", "ERS");
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

    const projectStateId = applyErsFinishedProjectStateAtFullProgress(
      form.projectStateId,
      progressFromTasks,
      states,
    );

    setSaving(true);
    try {
      await guardarErs(detail.projectId, {
        projectName: form.projectName.trim(),
        objective: form.objective.trim(),
        description: form.description.trim(),
        impact: form.impact.trim(),
        approverId: form.approverId ? Number(form.approverId) : undefined,
        projectStateId: projectStateId ? Number(projectStateId) : undefined,
        teamMemberIds: form.teamMemberIds.map((id) => Number(id)),
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
      await reloadDetail();
      toast.success("Proyecto ERS actualizado.", "ERS");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo guardar el proyecto ERS.";
      toast.error(message, "ERS");
    } finally {
      setSaving(false);
    }
  };

  if (!isTechnician) {
    return <Navigate to="/ers" replace />;
  }

  if (!Number.isFinite(projectIdNumber) || projectIdNumber <= 0) {
    return <Navigate to="/ers" replace />;
  }

  if (loadingDetail || !detail) {
    return (
      <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground shadow-soft">
        Cargando detalle ERS...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground">IRS / ERS</p>
          <h1 className="text-lg font-semibold">
            Editar ERS #{detail.projectId} - {detail.projectName}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/ers")}>
            Volver
          </Button>
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
          <ErsEditSidebar
            activeSection={section}
            onChange={setSection}
            tasksCount={form.tasks.length}
          />
        </div>

        <div className="min-w-0">
          {section === "escalador" ? (
            <ErsEscalationDataPanel detail={detail} form={form} onChange={setForm} />
          ) : null}
          {section === "gestion" ? (
            <ErsProjectManagementPanel
              form={form}
              onChange={setForm}
              states={states}
              technicians={technicians}
              loadingStates={loadingStates}
              loadingTechnicians={loadingTechnicians}
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
              technicians={technicians}
              assigneeOptions={taskAssigneeOptions}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
