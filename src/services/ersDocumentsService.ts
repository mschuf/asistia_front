/**
 * @file ersDocumentsService.ts
 * @description Cliente HTTP para documentos nativos de proyectos ERS en GLPI.
 */
import { apiClient } from "@/api/apiClient";

export type ErsDocumentLimit = "15" | "50" | "100" | "all";
export type ErsDocumentSortColumn = "name" | "type" | "createdAt";

export interface ErsDocument {
  id: number;
  name: string;
  mimeType: string;
  createdAt: string | null;
}

export interface ErsDocumentListResponse {
  items: ErsDocument[];
  total: number;
  page: number;
  limit: ErsDocumentLimit;
}

export interface ErsDocumentListQuery {
  page?: number;
  limit?: ErsDocumentLimit;
  search?: string;
  name?: string;
  type?: "image" | "pdf" | "text";
  dateFrom?: string;
  dateTo?: string;
  sortBy?: ErsDocumentSortColumn;
  sortOrder?: "asc" | "desc";
}

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const API_URL = configuredApiUrl || (import.meta.env.DEV ? "/api/v1" : "");
const UPLOAD_TIMEOUT_MS = 180_000;

export function listErsDocuments(
  projectId: number,
  query: ErsDocumentListQuery,
  signal?: AbortSignal,
): Promise<ErsDocumentListResponse> {
  return apiClient.get<ErsDocumentListResponse>(`/ers/${projectId}/documents`, {
    query: query as Record<string, string | number | boolean | undefined | null>,
    signal,
    showBackdrop: false,
  });
}

export function uploadErsDocument(projectId: number, file: File): Promise<ErsDocument> {
  const data = new FormData();
  data.append("file", file);
  return apiClient.post<ErsDocument>(`/ers/${projectId}/documents`, data, {
    timeoutMs: UPLOAD_TIMEOUT_MS,
    showBackdrop: false,
  });
}

export function deleteErsDocument(projectId: number, documentId: number): Promise<void> {
  return apiClient.delete<void>(`/ers/${projectId}/documents/${documentId}`, {
    showBackdrop: false,
  });
}

function contentUrl(projectId: number, documentId: number): string {
  const base = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
  return `${base}/ers/${projectId}/documents/${documentId}/content`;
}

export async function fetchErsDocumentBlob(
  projectId: number,
  documentId: number,
  signal?: AbortSignal,
): Promise<Blob> {
  const response = await fetch(contentUrl(projectId, documentId), {
    credentials: "include",
    signal,
  });
  if (!response.ok) throw new Error("No se pudo obtener el documento.");
  return response.blob();
}

export async function downloadErsDocument(projectId: number, document: ErsDocument): Promise<void> {
  const blob = await fetchErsDocumentBlob(projectId, document.id);
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = document.name;
  anchor.rel = "noopener";
  window.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
