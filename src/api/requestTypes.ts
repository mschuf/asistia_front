import { apiClient } from "./apiClient";

export interface RequestType {
  id: number;
  name: string;
  isActive: boolean;
}

export type RequestTypeSortColumn = "id" | "name" | "isActive";
export type RequestTypeSortOrder = "asc" | "desc";

export interface RequestTypeList {
  items: RequestType[];
  total: number;
  page: number;
  limit: number;
}

export interface ListRequestTypesQuery {
  page?: number;
  limit?: number;
  all?: boolean;
  search?: string;
  id?: number;
  name?: string;
  isActive?: boolean;
  sortBy?: RequestTypeSortColumn;
  sortOrder?: RequestTypeSortOrder;
}

export function listRequestTypes(
  query: ListRequestTypesQuery = {},
  options?: { signal?: AbortSignal; showBackdrop?: boolean },
): Promise<RequestTypeList> {
  return apiClient.get<RequestTypeList>("/request-types", {
    ...options,
    query: {
      page: query.page,
      limit: query.limit,
      all: query.all,
      search: query.search,
      id: query.id,
      name: query.name,
      isActive: query.isActive,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    },
  });
}

export function createRequestType(input: {
  name: string;
  isActive?: boolean;
}): Promise<RequestType> {
  return apiClient.post<RequestType>("/request-types", input);
}

export function updateRequestType(
  id: number,
  input: { name?: string; isActive?: boolean },
): Promise<RequestType> {
  return apiClient.patch<RequestType>(`/request-types/${id}`, input);
}

export function deactivateRequestType(id: number): Promise<RequestType> {
  return apiClient.patch<RequestType>(`/request-types/${id}/deactivate`);
}
