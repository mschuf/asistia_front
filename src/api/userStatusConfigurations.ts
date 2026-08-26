import { apiClient } from "./apiClient";

export type ConfigurationPageSize = 15 | 50 | 100 | "all";
export type ConfigurationSortColumn = "description" | "value" | "active" | "updatedAt";
export type SortOrder = "asc" | "desc";

export interface Configuration {
  id: string;
  description: string;
  value: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConfigurationFilters {
  search: string;
  description: string;
  value: string;
  active: "" | "true" | "false";
  updatedFrom: string;
  updatedTo: string;
}

export interface ConfigurationListResponse {
  items: Configuration[];
  total: number;
  page: number;
  limit: ConfigurationPageSize;
}

interface ListParams extends Partial<ConfigurationFilters> {
  page: number;
  limit: ConfigurationPageSize;
  sortBy?: ConfigurationSortColumn;
  sortOrder?: SortOrder;
  signal?: AbortSignal;
}

export function listConfigurations({ signal, ...query }: ListParams): Promise<ConfigurationListResponse> {
  return apiClient.get("/user-status/configurations", { query, signal, showBackdrop: false });
}

export function getConfiguration(id: string, signal?: AbortSignal): Promise<Configuration> {
  return apiClient.get(`/user-status/configurations/${id}`, { signal, showBackdrop: false });
}

export function createConfiguration(payload: {
  description: string;
  value: string;
  active?: boolean;
}): Promise<Configuration> {
  return apiClient.post("/user-status/configurations", payload);
}

export function updateConfiguration(
  id: string,
  payload: { description?: string; value?: string; active?: boolean },
): Promise<Configuration> {
  return apiClient.patch(`/user-status/configurations/${id}`, payload);
}

export function deactivateConfiguration(id: string): Promise<Configuration> {
  return apiClient.delete(`/user-status/configurations/${id}`);
}

export function activateConfiguration(id: string): Promise<Configuration> {
  return apiClient.patch(`/user-status/configurations/${id}/activate`);
}
