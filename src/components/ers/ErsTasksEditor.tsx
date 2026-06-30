/**
 * @file ErsTasksEditor.tsx
 * @description Editor de tareas del proyecto para la vista TI.
 */
import { ChevronDown, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ErsProjectStateBadge } from "@/components/ers/ErsProjectStateBadge";
import { ErsTaskDeleteConfirmDialog } from "@/components/ers/ErsTaskDeleteConfirmDialog";
import type { ErsProjectState, ErsTechnician } from "@/api/ers";
import {
  applyErsFinishedStateAtFullProgress,
  isErsCancelledTask,
  resolveErsProjectState,
} from "@/lib/ers-project-state";
import { cn } from "@/lib/utils";
import type { ErsEditState } from "@/types/pages/ers-page.types";
import { useMemo, useState } from "react";

type TaskDraft = ErsEditState["tasks"][number];

type TaskEntry = {
  task: TaskDraft;
  index: number;
};

interface ErsTasksEditorProps {
  tasks: ErsEditState["tasks"];
  states: ErsProjectState[];
  technicians: ErsTechnician[];
  assigneeOptions: ErsTechnician[];
  onChange: (tasks: ErsEditState["tasks"]) => void;
}

function emptyTask(): TaskDraft {
  return {
    name: "",
    content: "",
    percentDone: 0,
    projectStateId: "",
    projectStateName: "",
    userId: "",
    planStartDate: "",
    planEndDate: "",
  };
}

function resolveTaskStateName(stateId: string, states: ErsProjectState[]): string {
  if (!stateId) return "";
  return resolveErsProjectState(stateId, states)?.name ?? "";
}

function resolveTaskLabel(task: TaskDraft, index: number): string {
  return task.name.trim() || `Tarea ${index + 1}`;
}

/** Editor de tareas con botón "+" y carga local. */
export function ErsTasksEditor({
  tasks,
  states,
  technicians,
  assigneeOptions,
  onChange,
}: ErsTasksEditorProps) {
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [taskDraft, setTaskDraft] = useState<TaskDraft>(emptyTask());
  const [cancelledExpanded, setCancelledExpanded] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDeleteIndex, setTaskToDeleteIndex] = useState<number | null>(null);

  const { activeTasks, cancelledTasks } = useMemo(() => {
    const entries: TaskEntry[] = tasks.map((task, index) => ({ task, index }));
    return {
      activeTasks: entries.filter(({ task }) => !isErsCancelledTask(task, states)),
      cancelledTasks: entries.filter(({ task }) => isErsCancelledTask(task, states)),
    };
  }, [tasks, states]);

  const closeTaskModal = () => {
    setTaskModalOpen(false);
    setEditingIndex(null);
  };

  const openCreateModal = () => {
    setEditingIndex(null);
    setTaskDraft(emptyTask());
    setTaskModalOpen(true);
  };

  const openEditModal = (index: number) => {
    setEditingIndex(index);
    setTaskDraft({ ...tasks[index] });
    setTaskModalOpen(true);
  };

  const saveTask = () => {
    const nextTask: TaskDraft = applyErsFinishedStateAtFullProgress(
      {
        ...taskDraft,
        projectStateName:
          resolveTaskStateName(taskDraft.projectStateId, states) || taskDraft.projectStateName || "",
      },
      states,
    );
    if (editingIndex === null) {
      onChange([...tasks, nextTask]);
    } else {
      onChange(tasks.map((task, taskIndex) => (taskIndex === editingIndex ? nextTask : task)));
    }
    setTaskModalOpen(false);
    setEditingIndex(null);
  };

  const openDeleteConfirm = (index: number) => {
    setTaskToDeleteIndex(index);
    setDeleteConfirmOpen(true);
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setTaskToDeleteIndex(null);
  };

  const confirmDeleteTask = () => {
    if (taskToDeleteIndex === null) return;
    onChange(tasks.filter((_, taskIndex) => taskIndex !== taskToDeleteIndex));
    closeDeleteConfirm();
  };

  const taskToDeleteLabel =
    taskToDeleteIndex === null ? null : resolveTaskLabel(tasks[taskToDeleteIndex], taskToDeleteIndex);

  const resolveAssigneeName = (userId: string) => {
    if (!userId) return "Sin responsable";
    return (
      assigneeOptions.find((user) => String(user.id) === userId)?.fullName ??
      technicians.find((user) => String(user.id) === userId)?.fullName ??
      "Sin responsable"
    );
  };

  const renderTaskCard = ({ task, index }: TaskEntry) => (
    <div key={`task-${index}`} className="rounded-md border px-3 py-2">
      <div className="flex items-center gap-2">
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-1 text-sm md:grid-cols-2 md:gap-2">
          <p className="truncate">
            <span className="text-muted-foreground">Nombre:</span>{" "}
            <span className="font-medium">{task.name.trim() || `Tarea ${index + 1}`}</span>
          </p>
          <p className="truncate">
            <span className="text-muted-foreground">Avance:</span>{" "}
            <span>{Math.max(0, Math.min(100, Number(task.percentDone) || 0))}%</span>
          </p>
          <p className="flex min-w-0 items-center gap-1.5 truncate">
            <span className="shrink-0 text-muted-foreground">Estado:</span>
            <ErsProjectStateBadge
              stateId={task.projectStateId}
              states={states}
              label={task.projectStateName || null}
            />
          </p>
          <p className="truncate">
            <span className="text-muted-foreground">Responsable:</span>{" "}
            <span>{resolveAssigneeName(task.userId)}</span>
          </p>
          <p className="truncate">
            <span className="text-muted-foreground">Inicio planificado:</span>{" "}
            <span>{formatDateTime(task.planStartDate)}</span>
            {formatRemainingDaysLabel(task.planEndDate) ? (
              <span className="ml-1.5 text-muted-foreground/60">
                ({formatRemainingDaysLabel(task.planEndDate)})
              </span>
            ) : null}
          </p>
          <p className="truncate">
            <span className="text-muted-foreground">Fin planificado:</span>{" "}
            <span>{formatDateTime(task.planEndDate)}</span>
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => openEditModal(index)}
          aria-label={`Editar tarea ${index + 1}`}
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-destructive"
          onClick={() => openDeleteConfirm(index)}
          aria-label={`Eliminar tarea ${index + 1}`}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      <div className="mt-2 rounded-md border border-dashed px-2 py-1.5 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Detalle:</span>{" "}
        {task.content.trim() ? task.content : "Sin descripción"}
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Tareas del proyecto</p>
        <Button type="button" size="sm" variant="outline" onClick={openCreateModal}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Agregar
        </Button>
      </div>

      {activeTasks.length === 0 ? (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          No hay tareas activas. Usa &quot;Agregar&quot; para crear la primera.
        </p>
      ) : (
        activeTasks.map(renderTaskCard)
      )}

      <div className="space-y-2 border-t pt-3">
        <button
          type="button"
          onClick={() => setCancelledExpanded((current) => !current)}
          aria-expanded={cancelledExpanded}
          aria-label={cancelledExpanded ? "Ocultar tareas canceladas" : "Mostrar tareas canceladas"}
          className="flex w-full items-center justify-between rounded-md border border-dashed px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-muted/60"
        >
          <span>Tareas canceladas ({cancelledTasks.length})</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
              cancelledExpanded && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>
        {cancelledExpanded ? (
          cancelledTasks.length === 0 ? (
            <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
              No hay tareas canceladas.
            </p>
          ) : (
            <div className="space-y-3">{cancelledTasks.map(renderTaskCard)}</div>
          )
        ) : null}
      </div>

      <Dialog
        open={taskModalOpen}
        onOpenChange={(open) => (open ? setTaskModalOpen(true) : closeTaskModal())}
        title={
          editingIndex === null
            ? "Agregar tarea"
            : `Editar tarea: ${taskDraft.name.trim() || `Tarea ${editingIndex + 1}`}`
        }
        description={
          editingIndex === null
            ? "Completa los datos de la nueva tarea."
            : "Modifica los datos de la tarea seleccionada."
        }
        className="max-w-3xl"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Nombre</span>
              <Input
                value={taskDraft.name}
                onChange={(event) => setTaskDraft((current) => ({ ...current, name: event.target.value }))}
                placeholder="Nombre de tarea"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">% Avance</span>
              <Input
                type="number"
                min={0}
                max={100}
                value={taskDraft.percentDone}
                onChange={(event) => {
                  const percentDone = Math.max(0, Math.min(100, Number(event.target.value) || 0));
                  setTaskDraft((current) =>
                    applyErsFinishedStateAtFullProgress({ ...current, percentDone }, states),
                  );
                }}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Estado tarea</span>
              <Select
                value={taskDraft.projectStateId}
                onChange={(event) => {
                  const projectStateId = event.target.value;
                  setTaskDraft((current) => ({
                    ...current,
                    projectStateId,
                    projectStateName: resolveTaskStateName(projectStateId, states),
                  }));
                }}
              >
                <option value="">Sin estado</option>
                {states.map((state) => (
                  <option key={state.id} value={String(state.id)}>
                    {state.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Responsable</span>
              <Select
                value={taskDraft.userId}
                onChange={(event) => setTaskDraft((current) => ({ ...current, userId: event.target.value }))}
              >
                <option value="">Sin responsable</option>
                {assigneeOptions.map((user) => (
                  <option key={user.id} value={String(user.id)}>
                    {user.fullName}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Inicio planificado</span>
              <Input
                type="datetime-local"
                value={taskDraft.planStartDate}
                onChange={(event) =>
                  setTaskDraft((current) => ({ ...current, planStartDate: event.target.value }))
                }
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Fin planificado</span>
              <Input
                type="datetime-local"
                value={taskDraft.planEndDate}
                onChange={(event) =>
                  setTaskDraft((current) => ({ ...current, planEndDate: event.target.value }))
                }
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Descripción</span>
            <Textarea
              className="min-h-20"
              value={taskDraft.content}
              onChange={(event) => setTaskDraft((current) => ({ ...current, content: event.target.value }))}
            />
          </label>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeTaskModal}>
              Cancelar
            </Button>
            <Button type="button" onClick={saveTask}>
              {editingIndex === null ? "Agregar tarea" : "Guardar cambios"}
            </Button>
          </div>
        </div>
      </Dialog>

      <ErsTaskDeleteConfirmDialog
        open={deleteConfirmOpen}
        taskLabel={taskToDeleteLabel}
        onOpenChange={(open) => {
          if (!open) closeDeleteConfirm();
        }}
        onConfirm={confirmDeleteTask}
      />
    </div>
  );
}

function formatDateTime(value: string): string {
  const normalized = value.trim();
  if (!normalized) return "—";
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatRemainingDaysLabel(endDateValue: string): string | null {
  const days = getRemainingCalendarDays(endDateValue);
  if (days === null) return null;

  const remaining = Math.max(0, days);
  if (remaining === 1) return "falta 1 día";
  return `faltan ${remaining} días`;
}

function getRemainingCalendarDays(endDateValue: string): number | null {
  const normalized = endDateValue.trim();
  if (!normalized) return null;

  const endDate = new Date(normalized);
  if (Number.isNaN(endDate.getTime())) return null;

  const today = startOfLocalDay(new Date());
  const endDay = startOfLocalDay(endDate);
  return Math.round((endDay.getTime() - today.getTime()) / 86_400_000);
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

