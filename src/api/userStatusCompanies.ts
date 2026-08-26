import { apiClient } from "./apiClient";

export type UserStatusCompanyPageSize = 15 | 50 | 100 | "all";
export type UserStatusCompanySortColumn = "name" | "active" | "userCount" | "updatedAt";
export type SortOrder = "asc" | "desc";

export interface UserStatusCompany {
  id: string;
  name: string;
  active: boolean;
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserStatusCompanyFilters {
  search: string;
  name: string;
  active: "" | "true" | "false";
  userCount: string;
  updatedFrom: string;
  updatedTo: string;
}

export interface UserStatusCompanyListResponse {
  items: UserStatusCompany[];
  total: number;
  page: number;
  limit: UserStatusCompanyPageSize;
}

interface ListParams extends Partial<UserStatusCompanyFilters> {
  page: number;
  limit: UserStatusCompanyPageSize;
  sortBy?: UserStatusCompanySortColumn;
  sortOrder?: SortOrder;
  signal?: AbortSignal;
}

export function listUserStatusCompanies({ signal, ...query }: ListParams): Promise<UserStatusCompanyListResponse> {
  return apiClient.get("/user-status/companies", { query, signal, showBackdrop: false });
}

export function getUserStatusCompany(id: string, signal?: AbortSignal): Promise<UserStatusCompany> {
  return apiClient.get(`/user-status/companies/${id}`, { signal, showBackdrop: false });
}

export function createUserStatusCompany(payload: { name: string; active?: boolean }): Promise<UserStatusCompany> {
  return apiClient.post("/user-status/companies", payload);
}

export function updateUserStatusCompany(
  id: string,
  payload: { name?: string; active?: boolean },
): Promise<UserStatusCompany> {
  return apiClient.patch(`/user-status/companies/${id}`, payload);
}

export function deactivateUserStatusCompany(id: string): Promise<UserStatusCompany> {
  return apiClient.delete(`/user-status/companies/${id}`);
}

export function activateUserStatusCompany(id: string): Promise<UserStatusCompany> {
  return apiClient.patch(`/user-status/companies/${id}/activate`);
}
