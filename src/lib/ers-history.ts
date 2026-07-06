import { formatDate, formatOpenDuration } from "./format";

export type ErsHistoryState = Record<string, unknown>;

const PROJECT_DETAIL_KEYS = [
  "objective",
  "description",
  "impact",
  "requestType",
  "approverName",
  "team",
  "tasks",
] as const;

const PROJECT_TECHNICAL_KEYS = new Set([
  "requesterName",
  "requesterSectors",
  "requesterId",
  "locationId",
  "approverId",
  "projectStateId",
  "projectTypeId",
  "ticketStatus",
  "ticketSolvedAt",
  "ticketClosedAt",
]);

const PRIORITY_LABELS: Record<number, string> = {
  1: "Muy baja",
  2: "Baja",
  3: "Media",
  4: "Alta",
  5: "Muy alta",
  6: "Mayor",
};

/** Proyecta un snapshot completo al orden estable utilizado por el historial. */
export function toErsHistoryDisplayState(
  state: ErsHistoryState | null,
  nowValue: number = Date.now(),
): ErsHistoryState | null {
  if (!state || !isFullProjectSnapshot(state)) return state;

  const display: ErsHistoryState = {
    projectId: valueOrNull(state.projectId),
    projectName: valueOrNull(state.projectName),
    priority: formatPriority(state.priority),
    requesterSummary: {
      name: valueOrNull(state.requesterName),
      sectors: Object.prototype.hasOwnProperty.call(state, "requesterSectors")
        ? normalizeSectors(state.requesterSectors)
        : null,
    },
    locationName: valueOrNull(state.locationName),
    projectTypeName: valueOrNull(state.projectTypeName),
    projectStateName: valueOrNull(state.projectStateName),
    progress: formatProgress(state.progress),
    approved: typeof state.approved === "boolean" ? state.approved : null,
    createdAt: formatSnapshotDate(state.createdAt),
    ticketCreatedAt: formatSnapshotDate(state.ticketCreatedAt),
    vigente: formatTicketAge(state, nowValue),
  };

  for (const key of PROJECT_DETAIL_KEYS) {
    display[key] = valueOrNull(state[key]);
  }

  const consumedKeys = new Set([...Object.keys(display), ...PROJECT_TECHNICAL_KEYS]);
  for (const [key, value] of Object.entries(state)) {
    if (!consumedKeys.has(key)) display[key] = value;
  }

  return display;
}

/** Duración del ticket del snapshot según estado y fechas de GLPI. */
export function formatTicketAge(state: ErsHistoryState, nowValue: number = Date.now()): string {
  if (isCancelledProjectState(state.projectStateName)) return "—";

  const createdAt = typeof state.ticketCreatedAt === "string" ? state.ticketCreatedAt : null;
  const status = Number(state.ticketStatus);
  if (!createdAt || !Number.isInteger(status)) return "—";

  if (status >= 1 && status <= 4) {
    return formatOpenDuration(createdAt, undefined, nowValue);
  }

  if (status === 5 || status === 6) {
    const endAt = firstText(state.ticketClosedAt, state.ticketSolvedAt);
    return formatOpenDuration(createdAt, endAt);
  }

  return "—";
}

export function isRequesterSummary(value: unknown): value is {
  name: string | number | null;
  sectors: string[] | null;
} {
  return typeof value === "object" && value !== null && "name" in value && "sectors" in value;
}

function isFullProjectSnapshot(state: ErsHistoryState): boolean {
  return (
    Object.prototype.hasOwnProperty.call(state, "projectId") ||
    Object.prototype.hasOwnProperty.call(state, "projectName")
  );
}

function isCancelledProjectState(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const normalized = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return /cancel|rechaz|anulad/.test(normalized);
}

function formatPriority(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  const priority = Number(value);
  if (!Number.isInteger(priority)) return null;
  return PRIORITY_LABELS[priority] ?? String(priority);
}

function formatProgress(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  const progress = Number(value);
  if (!Number.isFinite(progress)) return null;
  return `${Math.max(0, Math.min(100, Math.round(progress)))}%`;
}

function formatSnapshotDate(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const formatted = formatDate(value);
  return formatted === "—" ? null : formatted;
}

function normalizeSectors(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((sector): sector is string => typeof sector === "string" && Boolean(sector.trim()))
    .map((sector) => sector.trim());
}

function valueOrNull(value: unknown): unknown {
  return value === undefined ? null : value;
}

function firstText(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}
