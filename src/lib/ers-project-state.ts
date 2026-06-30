/**
 * @file ers-project-state.ts
 * @description Utilidades para mostrar estados de proyecto/tarea ERS como badges.
 */
import type { ErsProjectState } from "@/api/ers";
import type { BadgeProps } from "@/components/ui/badge";

const ERS_CANCELLED_STATE_PATTERN = /cancel|rechaz|anulad/;

/** Resuelve un estado de proyecto por id dentro del catálogo cargado. */
export function resolveErsProjectState(
  stateId: string | number | null | undefined,
  states: ErsProjectState[],
): ErsProjectState | null {
  if (stateId === null || stateId === undefined || stateId === "") return null;
  return states.find((state) => String(state.id) === String(stateId)) ?? null;
}

/** @returns `true` si el nombre del estado representa cancelación/rechazo. */
export function isErsCancelledStateName(name: string): boolean {
  return ERS_CANCELLED_STATE_PATTERN.test(name.trim().toLowerCase());
}

/** @returns `true` si el estado corresponde a una tarea/proyecto cancelado. */
export function isErsCancelledState(state: ErsProjectState | null): boolean {
  return state !== null && isErsCancelledStateName(state.name);
}

/** @returns `true` si el id de estado corresponde a cancelación según el catálogo. */
export function isErsCancelledTaskState(
  stateId: string | number | null | undefined,
  states: ErsProjectState[],
): boolean {
  return isErsCancelledState(resolveErsProjectState(stateId, states));
}

/** @returns `true` si la tarea está cancelada (por id de estado o nombre persistido). */
export function isErsCancelledTask(
  task: {
    projectStateId?: string | number | null;
    projectStateName?: string | null;
  },
  states: ErsProjectState[],
): boolean {
  if (isErsCancelledTaskState(task.projectStateId, states)) return true;
  const stateName = task.projectStateName?.trim();
  return Boolean(stateName && isErsCancelledStateName(stateName));
}

/** Calcula el avance del proyecto excluyendo tareas canceladas. */
export function computeErsProgressFromTasks(
  tasks: Array<{
    percentDone: number;
    projectStateId?: string | number | null;
    projectStateName?: string | null;
  }>,
  states: ErsProjectState[],
): number {
  const activeTasks = tasks.filter((task) => !isErsCancelledTask(task, states));
  if (activeTasks.length === 0) return 0;
  return Math.round(
    activeTasks.reduce(
      (acc, task) => acc + (Number.isFinite(task.percentDone) ? task.percentDone : 0),
      0,
    ) / activeTasks.length,
  );
}

/** @returns `true` si el nombre del estado representa finalización (excluye cancelados). */
export function isErsFinishedStateName(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  if (isErsCancelledStateName(normalized)) return false;
  return /finaliz|cerrad|complet|terminad|done|closed/.test(normalized);
}

/** @returns `true` si el estado corresponde a una tarea/proyecto finalizado. */
export function isErsFinishedState(state: ErsProjectState | null): boolean {
  if (!state || isErsCancelledState(state)) return false;
  return state.isFinished || isErsFinishedStateName(state.name);
}

/** Resuelve el estado de finalización preferido del catálogo GLPI. */
export function resolveErsFinishedProjectState(states: ErsProjectState[]): ErsProjectState | null {
  const finishedStates = states.filter(isErsFinishedState);
  if (finishedStates.length === 0) return null;

  const byFinalizadoName = finishedStates.find((state) => /finaliz/.test(state.name.trim().toLowerCase()));
  if (byFinalizadoName) return byFinalizadoName;

  const byGlpiFlag = finishedStates.find((state) => state.isFinished);
  return byGlpiFlag ?? finishedStates[0] ?? null;
}

/** Resuelve el estado completado preferido del catálogo GLPI (prioriza "Completado"). */
export function resolveErsCompletedProjectState(states: ErsProjectState[]): ErsProjectState | null {
  const finishedStates = states.filter(isErsFinishedState);
  if (finishedStates.length === 0) return null;

  const byCompletadoName = finishedStates.find((state) => /complet/.test(state.name.trim().toLowerCase()));
  if (byCompletadoName) return byCompletadoName;

  return resolveErsFinishedProjectState(states);
}

/** Aplica estado completado al proyecto cuando el avance calculado llega al 100%. */
export function applyErsFinishedProjectStateAtFullProgress(
  projectStateId: string,
  progress: number,
  states: ErsProjectState[],
): string {
  if (progress !== 100) return projectStateId;

  const currentState = resolveErsProjectState(projectStateId, states);
  if (isErsCancelledState(currentState)) return projectStateId;
  if (isErsFinishedState(currentState)) return projectStateId;

  const completedState = resolveErsCompletedProjectState(states);
  return completedState ? String(completedState.id) : projectStateId;
}

/** Aplica estado finalizado cuando el avance de la tarea llega al 100%. */
export function applyErsFinishedStateAtFullProgress<
  T extends {
    percentDone: number;
    projectStateId?: string | number | null;
    projectStateName?: string | null;
  },
>(task: T, states: ErsProjectState[]): T {
  if (task.percentDone !== 100 || isErsCancelledTask(task, states)) return task;

  const finishedState = resolveErsFinishedProjectState(states);
  if (!finishedState) return task;

  return {
    ...task,
    projectStateId: String(finishedState.id),
    projectStateName: finishedState.name,
  };
}

/** Variante de badge con contraste en modo claro y oscuro. */
export function ersProjectStateBadgeVariant(
  state: ErsProjectState | null,
): NonNullable<BadgeProps["variant"]> {
  if (!state) return "default";

  const normalized = state.name.trim().toLowerCase();

  if (isErsCancelledStateName(normalized)) return "danger";
  if (isErsFinishedState(state)) {
    return "success";
  }
  if (/proceso|curso|progres|ejec|activ/.test(normalized)) return "info";
  if (/pend|esper|waiting|hold|paus|planif/.test(normalized)) return "warning";
  if (/nuevo|new|borrador|draft/.test(normalized)) return "default";

  return "default";
}
