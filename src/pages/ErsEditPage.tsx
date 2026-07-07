/**
 * @file ErsEditPage.tsx
 * @description Pantalla de edición ERS con menú contextual en tres secciones.
 */
import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  guardarErs,
  listarEstadosProyecto,
  listarTiposProyecto,
  listarTiposRequerimiento,
  listarTecnicosPorSede,
  obtenerErs,
  type ErsDetail,
  type ErsProjectState,
  type ErsProjectType,
  type ErsTechnician,
} from "@/api/ers";
import { ApiError } from "@/api/apiClient";
import { ErsEditSidebar, type ErsEditSection } from "@/components/ers/ErsEditSidebar";
import { ErsEscalationDataPanel } from "@/components/ers/ErsEscalationDataPanel";
import { ErsProjectManagementPanel } from "@/components/ers/ErsProjectManagementPanel";
import { ErsDocumentsPanel } from "@/components/ers/ErsDocumentsPanel";
import { ErsTasksPanel } from "@/components/ers/ErsTasksPanel";
import { ErsUnapprovedTasksConfirmDialog } from "@/components/ers/ErsUnapprovedTasksConfirmDialog";
import { WorkspaceHeader } from "@/components/layout/WorkspaceHeader";
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
import { listErsDocuments } from "@/services/ersDocumentsService";

const EMPTY_FORM: ErsEditState = {
  projectName: "",
  objective: "",
  description: "",
  impact: "",
  requestType: "",
  priority: 3,
  approved: false,
  approverId: "",
  projectStateId: "",
  projectTypeId: "",
  teamMemberIds: [],
  tasks: [],
};

const SECTION_OPTIONS: Array<{ id: ErsEditSection; label: string }> = [
  { id: "escalador", label: "Datos iniciales" },
  { id: "gestion", label: "Gestión" },
  { id: "tareas", label: "Tareas" },
  { id: "documentos", label: "Documentos" },
];

function parseSection(value: string | null): ErsEditSection {
  if (value === "gestion" || value === "tareas" || value === "documentos") return value;
  return "escalador";
}

function mapDetailToForm(detail: ErsDetail): ErsEditState {
  return {
    projectName: detail.projectName,
    objective: detail.objective ?? "",
    description: detail.description ?? "",
    impact: detail.impact ?? "",
    requestType: detail.requestType ?? "",
    priority: detail.priority,
    approved: detail.approved,
    approverId: detail.approverId ? String(detail.approverId) : "",
    projectStateId: detail.projectStateId ? String(detail.projectStateId) : "",
    projectTypeId: detail.projectTypeId ? String(detail.projectTypeId) : "",
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
  const [projectTypes, setProjectTypes] = useState<ErsProjectType[]>([]);
  const [requestTypes, setRequestTypes] = useState<string[]>([]);
  const [form, setForm] = useState<ErsEditState>(EMPTY_FORM);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingProjectTypes, setLoadingProjectTypes] = useState(true);
  const [loadingRequestTypes, setLoadingRequestTypes] = useState(true);
  const [requestTypesUnavailable, setRequestTypesUnavailable] = useState(false);
  const [projectTypesUnavailable, setProjectTypesUnavailable] = useState(false);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);
  const [loadingTeamTechnicians, setLoadingTeamTechnicians] = useState(false);
  const [saving, setSaving] = useState(false);
  const [unapprovedTasksDialogOpen, setUnapprovedTasksDialogOpen] = useState(false);
  const [documents, setDocuments] = useState<File[]>([]);
  const [documentsCount, setDocumentsCount] = useState(0);
  const [technicians, setTechnicians] = useState<ErsTechnician[]>([]);
  const [teamTechnicians, setTeamTechnicians] = useState<ErsTechnician[]>([]);
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
    if (!Number.isFinite(projectIdNumber) || projectIdNumber <= 0) return;
    const controller = new AbortController();
    void listErsDocuments(projectIdNumber, { page: 1, limit: "15" }, controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) setDocumentsCount(response.total);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [projectIdNumber]);

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
    const controller = new AbortController();
    setLoadingProjectTypes(true);
    setProjectTypesUnavailable(false);
    void listarTiposProyecto({ signal: controller.signal, showBackdrop: false })
      .then((response) => {
        if (!controller.signal.aborted) setProjectTypes(response);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setProjectTypes([]);
        setProjectTypesUnavailable(true);
        toast.error(
          error instanceof ApiError ? error.message : "No se pudieron cargar los sistemas relacionados.",
          "ERS",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingProjectTypes(false);
      });
    return () => controller.abort();
  }, [toast]);

  useEffect(() => {
    const controller = new AbortController();
    setLoadingRequestTypes(true);
    setRequestTypesUnavailable(false);
    void listarTiposRequerimiento({ signal: controller.signal, showBackdrop: false })
      .then((response) => {
        if (!controller.signal.aborted) setRequestTypes(response);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setRequestTypes([]);
        setRequestTypesUnavailable(true);
        toast.error(
          error instanceof ApiError ? error.message : "No se pudieron cargar los tipos de requerimiento.",
          "ERS",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingRequestTypes(false);
      });
    return () => controller.abort();
  }, [toast]);

  useEffect(() => {
    if (!detail) {
      setTechnicians([]);
      return;
    }
    let cancelled = false;
    setLoadingTechnicians(true);
    void listarTecnicosPorSede({ locationId: detail.locationId ?? undefined, limit: 200 })
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
        teamTechnicians,
        teamTechnicians,
      ),
    [detail?.team, form.teamMemberIds, teamTechnicians],
  );

  const setSection = (nextSection: ErsEditSection) => {
    if (nextSection === "tareas" && !form.approved) return;
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

  const handleSave = async (discardUnapprovedTasks = false) => {
    if (!detail) return;
    if (loadingRequestTypes || requestTypesUnavailable) {
      toast.error("No están disponibles los tipos de requerimiento.", "ERS");
      setSection("gestion");
      return;
    }
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
    if (!form.requestType || !requestTypes.includes(form.requestType)) {
      toast.error("Selecciona un tipo de requerimiento válido.", "ERS");
      setSection("gestion");
      return;
    }
    if (!form.approved && form.tasks.length > 0 && !discardUnapprovedTasks) {
      setUnapprovedTasksDialogOpen(true);
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
        requestType: form.requestType,
        priority: form.priority,
        approved: form.approved,
        projectName: form.projectName.trim(),
        objective: form.objective.trim(),
        description: form.description.trim(),
        impact: form.impact.trim(),
        approverId: form.approverId ? Number(form.approverId) : undefined,
        projectStateId: projectStateId ? Number(projectStateId) : undefined,
        projectTypeId: form.projectTypeId ? Number(form.projectTypeId) : 0,
        teamMemberIds: form.teamMemberIds.map((id) => Number(id)),
        tasks: (form.approved ? form.tasks : []).map((task) => ({
          name: task.name.trim(),
          content: task.content?.trim() || undefined,
          percentDone: Math.max(0, Math.min(100, Number(task.percentDone) || 0)),
          projectStateId: task.projectStateId ? Number(task.projectStateId) : undefined,
          userId: task.userId ? Number(task.userId) : undefined,
          planStartDate: toIsoDate(task.planStartDate ?? ""),
          planEndDate: toIsoDate(task.planEndDate ?? ""),
        })),
      });
      await reloadDetail();
      setUnapprovedTasksDialogOpen(false);
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
      <div className="space-y-4">
        <WorkspaceHeader />
        <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground shadow-soft">
          Cargando detalle ERS...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <WorkspaceHeader />
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
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || loadingRequestTypes || requestTypesUnavailable}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-card p-2 md:hidden">
        <div className="grid grid-cols-4 gap-2">
          {SECTION_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setSection(option.id)}
              disabled={option.id === "tareas" && !form.approved}
              className={cn(
                "rounded-md px-2 py-2 text-xs font-medium transition-colors",
                option.id === "tareas" && !form.approved && "cursor-not-allowed opacity-50",
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
            tasksEnabled={form.approved}
            documentsCount={documentsCount}
          />
        </div>

        <div className="min-w-0">
          {section === "escalador" ? (
            <ErsEscalationDataPanel
              requesterName={detail.requesterName}
              locationName={detail.locationName}
              ticketId={detail.ticketId}
              projectTypeName={detail.projectTypeName}
              form={form}
              onChange={setForm}
              projectTypes={projectTypes}
              projectTypesDisabled={loadingProjectTypes || projectTypesUnavailable}
            />
          ) : null}
          {section === "gestion" ? (
            <ErsProjectManagementPanel
              form={form}
              onChange={setForm}
              states={states}
              requestTypes={requestTypes}
              technicians={technicians}
              currentUser={user!}
              teamTechnicians={teamTechnicians}
              loadingStates={loadingStates}
              requestTypesDisabled={loadingRequestTypes || requestTypesUnavailable}
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
              approved={form.approved}
            />
          ) : null}
          {section === "documentos" ? (
            <ErsDocumentsPanel
              projectId={projectIdNumber}
              files={documents}
              onFilesChange={setDocuments}
              onDocumentsCountChange={setDocumentsCount}
            />
          ) : null}
        </div>
      </div>
      <ErsUnapprovedTasksConfirmDialog
        open={unapprovedTasksDialogOpen}
        saving={saving}
        onOpenChange={setUnapprovedTasksDialogOpen}
        onConfirm={() => void handleSave(true)}
      />
    </div>
  );
}
