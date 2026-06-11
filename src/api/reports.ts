/**
 * @file reports.ts
 * @description Cliente HTTP de reportes superadmin.
 */
import { apiClient } from "./apiClient";
import type {
  TicketCreatedLog,
  TicketCreatedReportSortColumn,
  TicketCreatedReportSortOrder,
} from "@/types/pages/ticket-created-report.types";

export type TicketCreatedReportExportFormat = "pdf" | "xlsx";

export interface ExportTicketCreatedLogsQuery {
  format: TicketCreatedReportExportFormat;
  createdFrom?: string;
  createdTo?: string;
  categoryName?: string;
  companyId?: number;
  locationId?: number;
  sortBy?: TicketCreatedReportSortColumn;
  sortOrder?: TicketCreatedReportSortOrder;
}

export interface ListTicketCreatedLogsQuery {
  page?: number;
  limit?: number;
  createdFrom?: string;
  createdTo?: string;
  categoryName?: string;
  companyId?: number;
  locationId?: number;
  sortBy?: TicketCreatedReportSortColumn;
  sortOrder?: TicketCreatedReportSortOrder;
}

export interface TicketCreatedLogListResponse {
  items: TicketCreatedLog[];
  total: number;
  page: number;
  limit: number;
}

type ReadRequestOptions = { signal?: AbortSignal; showBackdrop?: boolean };

/**
 * Lista logs del evento ticket.created con filtros y paginación.
 * @param query - Parámetros de consulta del reporte.
 * @param options - Opciones de petición HTTP.
 * @returns Página de logs y total.
 */
export async function listTicketCreatedLogs(
  query: ListTicketCreatedLogsQuery = {},
  options?: ReadRequestOptions,
): Promise<TicketCreatedLogListResponse> {
  return apiClient.get<TicketCreatedLogListResponse>("/reports/ticket-created", {
    ...options,
    showBackdrop: options?.showBackdrop ?? true,
    query: {
      page: query.page ?? 1,
      limit: query.limit ?? 15,
      createdFrom: query.createdFrom,
      createdTo: query.createdTo,
      categoryName: query.categoryName || undefined,
      companyId: query.companyId,
      locationId: query.locationId,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    },
  });
}

/**
 * Descarga reporte ticket.created en PDF o Excel.
 * @param query - Filtros activos y formato de exportación.
 * @param options - Opciones de petición HTTP.
 * @returns Blob y nombre de archivo.
 */
export async function downloadTicketCreatedReport(
  query: ExportTicketCreatedLogsQuery,
  options?: ReadRequestOptions,
): Promise<{ blob: Blob; filename: string }> {
  return apiClient.download("/reports/ticket-created/export", {
    ...options,
    showBackdrop: options?.showBackdrop ?? true,
    query: {
      format: query.format,
      createdFrom: query.createdFrom,
      createdTo: query.createdTo,
      categoryName: query.categoryName || undefined,
      companyId: query.companyId,
      locationId: query.locationId,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    },
  });
}

/**
 * Dispara descarga de blob en el navegador.
 * @param blob - Archivo binario.
 * @param filename - Nombre sugerido.
 * @returns void
 */
export function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
