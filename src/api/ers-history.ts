/**
 * @file ers-history.ts
 * @description Cliente HTTP para historial de proyectos ERS.
 */
import { apiClient } from "./apiClient";

export type ErsHistoryActionType = "create" | "update" | "delete";

export interface ErsHistoryItem {
  id: number;
  projectId: number;
  actionType: ErsHistoryActionType;
  actionColor: "success" | "info" | "danger" | "default";
  summary: string;
  actorUserId: number;
  actorDisplayName: string;
  happenedAt: string;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
}

export interface ErsHistoryListResponse {
  items: ErsHistoryItem[];
  total: number;
  page: number;
  limit: number;
}

export interface ListErsHistoryQuery {
  page?: number;
  limit?: number;
}

/** Lista historial de un proyecto ERS por fecha descendente. */
export async function listarHistorialErs(
  projectId: number,
  query: ListErsHistoryQuery = {},
): Promise<ErsHistoryListResponse> {
  return apiClient.get<ErsHistoryListResponse>(`/ers/${projectId}/history`, {
    query: query as Record<string, string | number | boolean | undefined | null>,
  });
}




