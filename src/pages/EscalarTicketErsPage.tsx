/**
 * @file EscalarTicketErsPage.tsx
 * @description Escalamiento completo de un ticket activo a un proyecto ERS.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ApiError } from "@/api/apiClient";
import {
  escalarTicket,
  isExecutionOrderConflict,
  listarEstadosProyecto,
  listarTiposProyecto,
  listarTiposRequerimiento,
  listarTecnicosPorSede,
  listarTicketsElegiblesErs,
  type ErsProjectState,
  type ErsProjectType,
  type ErsTechnician,
} from "@/api/ers";
import { ErsDocumentsPanel } from "@/components/ers/ErsDocumentsPanel";
import { ERS_EDIT_SECTIONS, ErsEditSidebar, type ErsEditSection } from "@/components/ers/ErsEditSidebar";
import { ErsEscalationDataPanel } from "@/components/ers/ErsEscalationDataPanel";
import { ErsProjectManagementPanel } from "@/components/ers/ErsProjectManagementPanel";
import { ErsTasksPanel } from "@/components/ers/ErsTasksPanel";
import type { ErsTasksEditorHandle } from "@/components/ers/ErsTasksEditor";
import { ErsUnapprovedTasksConfirmDialog } from "@/components/ers/ErsUnapprovedTasksConfirmDialog";
import { ErsUnapprovedTasksNoticeDialog } from "@/components/ers/ErsUnapprovedTasksNoticeDialog";
import { WorkspaceHeader } from "@/components/layout/WorkspaceHeader";
import { TicketDetailModal } from "@/components/tickets/TicketDetailModal";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/ui/loading";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  applyErsFinishedProjectStateAtFullProgress,
  computeErsProgressFromTasks,
} from "@/lib/ers-project-state";
import { toIsoDate } from "@/lib/ers";
import { resolveTaskAssigneeOptions } from "@/lib/ers-task-assignees";
import { cn } from "@/lib/utils";
import { uploadErsDocument } from "@/services/ersDocumentsService";
import { getTicketById } from "@/services/ticketsService";
import type { AsistiaTicket } from "@/types/asistia";
import type { ErsEditState, ErsFieldErrors, ErsFocusSignal } from "@/types/pages/ers-page.types";

const EMPTY_FORM: ErsEditState = {
  projectName: "",
  objective: "",
  description: "",
  impact: "",
  requestType: "",
  priority: 3,
  executionOrder: "",
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

function resolveInitialState(states: ErsProjectState[]): ErsProjectState | null {
  const active = states.filter((state) => !state.isFinished);
  return (
    active.find((state) => state.name.trim().toLocaleLowerCase("es") === "nuevo") ??
    active.find((state) => state.name.trim().toLocaleLowerCase("es").startsWith("nuevo")) ??
    active[0] ??
    null
  );
}

/** Pantalla TI para crear un proyecto ERS completo desde un ticket existente. */
export default function EscalarTicketErsPage() {
  const { isTechnician, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { ticketId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const section = parseSection(searchParams.get("seccion"));
  const numericTicketId = Number(ticketId);
  const validTicketId = Number.isFinite(numericTicketId) && numericTicketId > 0;

  const [ticket, setTicket] = useState<AsistiaTicket | null>(null);
  const [states, setStates] = useState<ErsProjectState[]>([]);
  const [projectTypes, setProjectTypes] = useState<ErsProjectType[]>([]);
  const [requestTypes, setRequestTypes] = useState<string[]>([]);
  const [technicians, setTechnicians] = useState<ErsTechnician[]>([]);
  const [teamTechnicians, setTeamTechnicians] = useState<ErsTechnician[]>([]);
  const [form, setForm] = useState<ErsEditState>(EMPTY_FORM);
  const [documents, setDocuments] = useState<File[]>([]);
  const [teamSearch, setTeamSearch] = useState("");
  const [loadingTicket, setLoadingTicket] = useState(true);
  const [loadingStates, setLoadingStates] = useState(true);
  const [loadingProjectTypes, setLoadingProjectTypes] = useState(true);
  const [loadingRequestTypes, setLoadingRequestTypes] = useState(true);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);
  const [loadingTeamTechnicians, setLoadingTeamTechnicians] = useState(false);
  const [projectTypesUnavailable, setProjectTypesUnavailable] = useState(false);
  const [requestTypesUnavailable, setRequestTypesUnavailable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [unapprovedTasksDialogOpen, setUnapprovedTasksDialogOpen] = useState(false);
  const [unapprovedTasksNoticeOpen, setUnapprovedTasksNoticeOpen] = useState(false);
  const [ticketDetailOpen, setTicketDetailOpen] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ErsFieldErrors>({});
  const [focusSignal, setFocusSignal] = useState<ErsFocusSignal | null>(null);
  const tasksEditorRef = useRef<ErsTasksEditorHandle>(null);

  const failField = (field: keyof ErsFieldErrors, message: string) => {
    setFieldErrors((prev) => ({ ...prev, [field]: message }));
    setFocusSignal({ field, nonce: Date.now() });
  };

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
        setForm((current) => ({ ...current, description: current.description || detail.description || "" }));
      })
      .catch((loadError) => {
        if (controller.signal.aborted) return;
        setTicket(null);
        setError(loadError instanceof ApiError ? loadError.message : "No se pudo cargar el ticket para escalar.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingTicket(false);
      });
    return () => controller.abort();
  }, [isTechnician, numericTicketId, validTicketId]);

  useEffect(() => {
    if (!validTicketId || !isTechnician) return;
    const controller = new AbortController();
    setLoadingStates(true);
    void listarEstadosProyecto({ signal: controller.signal, showBackdrop: false })
      .then((response) => {
        if (controller.signal.aborted) return;
        setStates(response);
        const initialState = resolveInitialState(response);
        if (initialState) {
          setForm((current) => current.projectStateId ? current : { ...current, projectStateId: String(initialState.id) });
        }
      })
      .catch((loadError) => {
        if (!controller.signal.aborted) toast.error(loadError instanceof ApiError ? loadError.message : "No se pudieron cargar los estados ERS.", "ERS");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingStates(false);
      });
    return () => controller.abort();
  }, [isTechnician, toast, validTicketId]);

  useEffect(() => {
    if (!validTicketId || !isTechnician) return;
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
        toast.error(loadError instanceof ApiError ? loadError.message : "No se pudieron cargar los sistemas relacionados.", "ERS");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingProjectTypes(false);
      });
    return () => controller.abort();
  }, [isTechnician, toast, validTicketId]);

  useEffect(() => {
    if (!validTicketId || !isTechnician) return;
    const controller = new AbortController();
    setLoadingRequestTypes(true);
    setRequestTypesUnavailable(false);
    void listarTiposRequerimiento({ signal: controller.signal, showBackdrop: false })
      .then((response) => {
        if (!controller.signal.aborted) setRequestTypes(response);
      })
      .catch((loadError) => {
        if (controller.signal.aborted) return;
        setRequestTypes([]);
        setRequestTypesUnavailable(true);
        toast.error(loadError instanceof ApiError ? loadError.message : "No se pudieron cargar los tipos de requerimiento.", "ERS");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingRequestTypes(false);
      });
    return () => controller.abort();
  }, [isTechnician, toast, validTicketId]);

  useEffect(() => {
    if (!validTicketId || !isTechnician) return;
    const controller = new AbortController();
    setLoadingTeamTechnicians(true);
    void listarTecnicosPorSede({ limit: 200 }, { signal: controller.signal, showBackdrop: false })
      .then((response) => {
        if (!controller.signal.aborted) setTeamTechnicians(response.items);
      })
      .catch((loadError) => {
        if (controller.signal.aborted) return;
        setTeamTechnicians([]);
        toast.error(loadError instanceof ApiError ? loadError.message : "No se pudo cargar el equipo técnico.", "ERS");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingTeamTechnicians(false);
      });
    return () => controller.abort();
  }, [isTechnician, toast, validTicketId]);

  useEffect(() => {
    if (!ticket || !isTechnician) return;
    const controller = new AbortController();
    setLoadingTechnicians(true);
    void listarTecnicosPorSede(
      { locationId: ticket.location?.id ?? undefined, limit: 200 },
      { signal: controller.signal, showBackdrop: false },
    )
      .then((response) => {
        if (!controller.signal.aborted) setTechnicians(response.items);
      })
      .catch((loadError) => {
        if (controller.signal.aborted) return;
        setTechnicians([]);
        toast.error(loadError instanceof ApiError ? loadError.message : "No se pudieron cargar los técnicos.", "ERS");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingTechnicians(false);
      });
    return () => controller.abort();
  }, [isTechnician, ticket, toast]);

  const progressFromTasks = useMemo(() => computeErsProgressFromTasks(form.tasks, states), [form.tasks, states]);

  useEffect(() => {
    if (states.length === 0 || progressFromTasks !== 100) return;
    setForm((current) => {
      const projectStateId = applyErsFinishedProjectStateAtFullProgress(current.projectStateId, progressFromTasks, states);
      return projectStateId === current.projectStateId ? current : { ...current, projectStateId };
    });
  }, [progressFromTasks, states]);

  const taskAssigneeOptions = useMemo(
    () => resolveTaskAssigneeOptions([], form.teamMemberIds, teamTechnicians, technicians),
    [form.teamMemberIds, teamTechnicians, technicians],
  );

  const setSection = (nextSection: ErsEditSection) => {
    const next = new URLSearchParams(searchParams);
    next.set("seccion", nextSection === "escalador" ? "datos_iniciales" : nextSection);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    if (section === "tareas" && !form.approved) {
      setUnapprovedTasksNoticeOpen(true);
    }
  }, [form.approved, section]);

  const isFinalSection = section === "documentos";

  const handleNextSection = () => {
    const currentIndex = ERS_EDIT_SECTIONS.findIndex((option) => option.id === section);
    const nextSection = ERS_EDIT_SECTIONS[currentIndex + 1]?.id;
    if (nextSection) setSection(nextSection);
  };

  const handlePreviousSection = () => {
    const currentIndex = ERS_EDIT_SECTIONS.findIndex((option) => option.id === section);
    const previousSection = ERS_EDIT_SECTIONS[currentIndex - 1]?.id;
    if (previousSection) setSection(previousSection);
  };

  const handleSave = async (discardUnapprovedTasks = false) => {
    if (!ticket) return;
    if (loadingRequestTypes || requestTypesUnavailable) {
      toast.error("No están disponibles los tipos de requerimiento.", "ERS");
      setSection("gestion");
      return;
    }
    if (form.projectName.trim().length < 3 || form.projectName.trim().length > 255) {
      toast.error("El nombre del proyecto debe tener entre 3 y 255 caracteres.", "ERS");
      setSection("escalador");
      failField("projectName", "El nombre del proyecto debe tener entre 3 y 255 caracteres.");
      return;
    }
    if (!form.objective.trim()) {
      toast.error("El objetivo es obligatorio.", "ERS");
      setSection("escalador");
      failField("objective", "El objetivo es obligatorio.");
      return;
    }
    if (!form.description.trim()) {
      toast.error("La descripción es obligatoria.", "ERS");
      setSection("escalador");
      failField("description", "La descripción es obligatoria.");
      return;
    }
    if (!form.requestType || !requestTypes.includes(form.requestType)) {
      toast.error("Selecciona un tipo de requerimiento válido.", "ERS");
      setSection("gestion");
      failField("requestType", "Selecciona un tipo de requerimiento válido.");
      return;
    }
    const hasInvalidTask = form.approved && form.tasks.some(
      (task) => !task.name.trim() || !task.content.trim() || !task.projectStateId || !task.userId || !task.planStartDate || !task.planEndDate,
    );
    if (hasInvalidTask) {
      toast.error("Completa todos los campos obligatorios de las tareas.", "ERS");
      setSection("tareas");
      tasksEditorRef.current?.focusFirstInvalidTask();
      return;
    }
    if (!form.approved && form.tasks.length > 0 && !discardUnapprovedTasks) {
      setUnapprovedTasksDialogOpen(true);
      return;
    }

    const projectStateId = applyErsFinishedProjectStateAtFullProgress(form.projectStateId, progressFromTasks, states);
    setSaving(true);
    try {
      const created = await escalarTicket({
        ticketId: ticket.id,
        requestType: form.requestType,
        priority: form.priority,
        executionOrder: form.executionOrder ? Number(form.executionOrder) : undefined,
        approved: form.approved,
        projectName: form.projectName.trim(),
        objective: form.objective.trim(),
        description: form.description.trim(),
        impact: form.impact.trim() || undefined,
        approverId: form.approverId ? Number(form.approverId) : undefined,
        projectStateId: projectStateId ? Number(projectStateId) : undefined,
        projectTypeId: form.projectTypeId ? Number(form.projectTypeId) : undefined,
        teamMemberIds: form.teamMemberIds.map(Number),
        tasks: (form.approved ? form.tasks : []).map((task) => ({
          name: task.name.trim(),
          content: task.content.trim() || undefined,
          percentDone: Math.max(0, Math.min(100, Number(task.percentDone) || 0)),
          projectStateId: task.projectStateId ? Number(task.projectStateId) : undefined,
          userId: task.userId ? Number(task.userId) : undefined,
          planStartDate: toIsoDate(task.planStartDate),
          planEndDate: toIsoDate(task.planEndDate),
        })),
      });
      const failedDocuments: string[] = [];
      for (const file of documents) {
        try {
          await uploadErsDocument(created.projectId, file);
        } catch {
          failedDocuments.push(file.name);
        }
      }
      setUnapprovedTasksDialogOpen(false);
      if (failedDocuments.length > 0) {
        toast.error(`El ERS fue creado, pero no se pudieron subir: ${failedDocuments.join(", ")}.`, "ERS");
        navigate(`/ers/${created.projectId}/editar?seccion=documentos`);
      } else {
        toast.success(`ERS #${created.projectId} creado correctamente.`, "ERS");
        navigate("/ers");
      }
    } catch (submitError) {
      toast.error(submitError instanceof ApiError ? submitError.message : "No se pudo completar el escalamiento.", "ERS");
      if (isExecutionOrderConflict(submitError)) {
        setSection("gestion");
        failField("executionOrder", submitError instanceof ApiError ? submitError.message : "");
      }
    } finally {
      setSaving(false);
    }
  };

  if (!isTechnician) return <Navigate to="/irs" replace />;
  if (!validTicketId) return <Navigate to="/irs?tab=historial" replace />;

  return (
    <div className="space-y-4">
      <WorkspaceHeader />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground">IRS / ERS</p>
          <h1 className="text-lg font-semibold">Escalar ticket #{numericTicketId}</h1>
        </div>
      </div>

      {loadingTicket ? (
        <div className="rounded-md border bg-card p-6 shadow-soft"><Loading label="Cargando ticket..." /></div>
      ) : null}
      {!loadingTicket && error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
      ) : null}

      {!loadingTicket && !error && ticket ? (
        <>
          <div className="rounded-md border bg-card p-2 md:hidden">
            <div className="grid grid-cols-4 gap-2">
              {SECTION_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSection(option.id)}
                  className={cn(
                    "rounded-md px-2 py-2 text-xs font-medium transition-colors",
                    section === option.id ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
            <div className="hidden md:block">
              <ErsEditSidebar activeSection={section} onChange={setSection} tasksCount={form.tasks.length} documentsCount={documents.length} />
            </div>
            <div className="min-w-0">
              {section === "escalador" ? (
                <ErsEscalationDataPanel
                  requesterName={ticket.requester.name}
                  locationName={ticket.location?.name ?? null}
                  ticketId={ticket.id}
                  onTicketPreview={() => setTicketDetailOpen(true)}
                  form={form}
                  onChange={setForm}
                  projectTypes={projectTypes}
                  projectTypesDisabled={loadingProjectTypes || projectTypesUnavailable}
                  errors={fieldErrors}
                  focusSignal={focusSignal}
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
                  executionOrderContext={{ locationId: ticket.location?.id ?? undefined }}
                  errors={fieldErrors}
                  focusSignal={focusSignal}
                />
              ) : null}
              {section === "tareas" ? (
                <ErsTasksPanel
                  ref={tasksEditorRef}
                  form={form}
                  onChange={setForm}
                  states={states}
                  technicians={teamTechnicians}
                  assigneeOptions={taskAssigneeOptions}
                />
              ) : null}
              {section === "documentos" ? (
                <ErsDocumentsPanel files={documents} onFilesChange={setDocuments} />
              ) : null}
            </div>
          </div>
        </>
      ) : null}

      {!loadingTicket && !error && ticket ? (
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handlePreviousSection}
            disabled={section === "escalador"}
          >
            Anterior
          </Button>
          <Button
            type="button"
            onClick={isFinalSection ? () => void handleSave() : handleNextSection}
            disabled={isFinalSection && (saving || loadingTicket || !!error || loadingRequestTypes || requestTypesUnavailable)}
          >
            {isFinalSection ? (saving ? "Guardando..." : "Guardar") : "Siguiente"}
          </Button>
        </div>
      ) : null}

      <ErsUnapprovedTasksConfirmDialog
        open={unapprovedTasksDialogOpen}
        saving={saving}
        onOpenChange={setUnapprovedTasksDialogOpen}
        onConfirm={() => void handleSave(true)}
      />
      <ErsUnapprovedTasksNoticeDialog
        open={unapprovedTasksNoticeOpen}
        onOpenChange={setUnapprovedTasksNoticeOpen}
      />
      <TicketDetailModal
        ticket={ticket}
        open={ticketDetailOpen}
        onOpenChange={setTicketDetailOpen}
      />
    </div>
  );
}
