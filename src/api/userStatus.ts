import { apiClient } from "./apiClient";

export const USER_STATUS_SOURCES = ["AD", "SAP", "OFFICE", "GLPI"] as const;
export type UserStatusSource = (typeof USER_STATUS_SOURCES)[number];
export const USER_STATUS_SOURCE_LABELS: Record<UserStatusSource, string> = {
  AD: "AD",
  SAP: "SAP",
  OFFICE: "Office",
  GLPI: "GLPI",
};

export function formatUserStatusSources(sources: readonly UserStatusSource[]): string {
  const labels = sources.map((source) => USER_STATUS_SOURCE_LABELS[source]);
  if (labels.length <= 1) return labels[0] ?? "";
  if (labels.length === 2) return `${labels[0]} y ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")} y ${labels[labels.length - 1]}`;
}

export function userStatusRunningLabel(sources: readonly UserStatusSource[]): string {
  const names = formatUserStatusSources(sources);
  if (sources.length === 1) return `${names} ya se está sincronizando`;
  return `${names} ya se están sincronizando`;
}
export const USER_STATUS_CODES = ["ACTIVO", "INACTIVO", "BLOQUEADO", "EXPIRADO", "NO_ENCONTRADO", "ERROR", "DESCONOCIDO"] as const;
export type UserStatusCode = (typeof USER_STATUS_CODES)[number];
export type UserStatusSortColumn = "name" | "company" | UserStatusSource | "updatedAt";
export type UserStatusSortOrder = "asc" | "desc";
export type UserStatusPageSize = 15 | 50 | 100 | "all";

export interface UserSourceStatus {
  identifier: string;
  externalId: string | null;
  active: boolean | null;
  status: UserStatusCode;
  detail: string | null;
  checkedAt: string | null;
}

export interface MonitoredUser {
  id: string;
  name: string;
  company: { id: string; name: string; active: boolean } | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastCheckedAt: string | null;
  sources: Partial<Record<UserStatusSource, UserSourceStatus>>;
}

export interface UserStatusFilters {
  search: string;
  name: string;
  companyId: string;
  ad: string;
  sap: string;
  office: string;
  glpi: string;
  source: "" | UserStatusSource;
  status: "" | UserStatusCode;
  active: "" | "true" | "false";
  updatedFrom: string;
  updatedTo: string;
}

export interface UserStatusListResponse {
  items: MonitoredUser[];
  total: number;
  page: number;
  limit: UserStatusPageSize;
}

export type UserStatusSourceCounts = Record<UserStatusSource, number>;
export const USER_STATUS_COUNT_SCOPES = ["all", "active", "inactive"] as const;
export type UserStatusCountScope = (typeof USER_STATUS_COUNT_SCOPES)[number];

export interface MonitoredIdentityPayload {
  source: UserStatusSource;
  identifier: string;
  externalId?: string | null;
}

export interface MonitoredUserPayload {
  name: string;
  companyId?: string | null;
  active?: boolean;
  sources: MonitoredIdentityPayload[];
}

export interface UserStatusHistoryItem {
  id: string;
  source: UserStatusSource;
  identifier: string;
  active: boolean | null;
  status: UserStatusCode;
  detail: string | null;
  checkedAt: string;
}

export interface SyncResult {
  id: string;
  source: UserStatusSource;
  status: "EN_PROGRESO" | "COMPLETADO" | "COMPLETADO_CON_ERRORES" | "ERROR" | "OMITIDO";
  processed: number;
  succeeded: number;
  errors: number;
  startedAt: string;
  finishedAt: string | null;
  detail: string | null;
}

export interface RunningSync {
  source: UserStatusSource;
  startedAt: string;
}

export interface SyncStartResult {
  accepted: UserStatusSource[];
  alreadyRunning: UserStatusSource[];
}

export interface SyncStatusResponse {
  running: RunningSync[];
}

export interface SyncHistoryItem extends SyncResult {
  triggerType: "MANUAL" | "PROGRAMADO";
  triggeredBy: string | null;
}

export interface Paginated<T> { items: T[]; total: number; page: number; limit: number; }

interface ListParams extends Partial<UserStatusFilters> {
  page: number;
  limit: UserStatusPageSize;
  sortBy?: UserStatusSortColumn;
  sortOrder?: UserStatusSortOrder;
  signal?: AbortSignal;
}

export function listUserStatuses({ signal, ...query }: ListParams): Promise<UserStatusListResponse> {
  return apiClient.get("/user-status/users", { query, signal, showBackdrop: false });
}
export function getUserStatusSourceCounts(scope: UserStatusCountScope = "all", signal?: AbortSignal): Promise<UserStatusSourceCounts> {
  return apiClient.get("/user-status/summary", { query: { scope }, signal, showBackdrop: false });
}
export function createMonitoredUser(payload: MonitoredUserPayload): Promise<MonitoredUser> {
  return apiClient.post("/user-status/users", payload);
}
export function updateMonitoredUser(id: string, payload: Partial<MonitoredUserPayload>): Promise<MonitoredUser> {
  return apiClient.patch(`/user-status/users/${id}`, payload);
}
export function deactivateMonitoredUser(id: string): Promise<{ id: string; active: false }> {
  return apiClient.delete(`/user-status/users/${id}`);
}
export function activateMonitoredUser(id: string): Promise<MonitoredUser> {
  return updateMonitoredUser(id, { active: true });
}
export function startAllUserStatusSync(): Promise<SyncStartResult> {
  return apiClient.post("/user-status/sync", undefined, { showBackdrop: false });
}
export function startUserStatusSourceSync(source: UserStatusSource): Promise<SyncStartResult> {
  return apiClient.post(`/user-status/sync/${source}`, undefined, { showBackdrop: false });
}
export function getUserStatusSyncStatus(signal?: AbortSignal): Promise<SyncStatusResponse> {
  return apiClient.get("/user-status/sync/status", { signal, showBackdrop: false });
}
export function getUserStatusHistory(id: string, source?: UserStatusSource): Promise<Paginated<UserStatusHistoryItem>> {
  return apiClient.get(`/user-status/users/${id}/history`, { query: { page: 1, limit: 100, source }, showBackdrop: false });
}
export const SYNC_HISTORY_PAGE_SIZE = 20;
export function getUserStatusSyncHistory(page = 1, limit: number = SYNC_HISTORY_PAGE_SIZE): Promise<Paginated<SyncHistoryItem>> {
  return apiClient.get("/user-status/sync/history", { query: { page, limit }, showBackdrop: false });
}

export const SOURCE_DIRECTORY_TIMEOUT_MS = 120_000;

export interface SourceDirectoryUser {
  source: UserStatusSource;
  identifier: string;
  name: string;
  email: string | null;
  status: UserStatusCode;
  detail: string | null;
  externalId: string | null;
  schema: string | null;
}

export interface SourceDirectoryBucket {
  items: SourceDirectoryUser[];
  error: string | null;
}

export type SourceDirectoryResponse = Record<UserStatusSource, SourceDirectoryBucket>;

export function listSourceDirectory(signal?: AbortSignal): Promise<SourceDirectoryResponse> {
  return apiClient.get("/user-status/directory", { signal, showBackdrop: false, timeoutMs: SOURCE_DIRECTORY_TIMEOUT_MS });
}

export function downloadSourceDirectoryExcel(signal?: AbortSignal): Promise<{ blob: Blob; filename: string }> {
  return apiClient.download("/user-status/directory/export", { signal, showBackdrop: false, timeoutMs: SOURCE_DIRECTORY_TIMEOUT_MS });
}
