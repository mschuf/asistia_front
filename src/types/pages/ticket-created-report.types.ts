/**
 * @file ticket-created-report.types.ts
 * @description Tipos del hook y componentes del reporte ticket.created.
 */
import type { Empresa } from "@/api/empresas";
import type { TicketCreatedReportExportFormat } from "@/api/reports";
import type { TicketsPageSize } from "@/lib/tickets";
import type { AsistiaCategory, AsistiaLocation } from "../asistia";

/** Estado de filtros del reporte ticket.created. */
export interface TicketCreatedReportFilterState {
  /** Valor de input datetime-local (YYYY-MM-DDTHH:mm). */
  createdFrom: string;
  /** Valor de input datetime-local (YYYY-MM-DDTHH:mm). */
  createdTo: string;
  categoryName: string;
  companyId: string;
  locationId: string;
}

/** Columnas ordenables del reporte. */
export type TicketCreatedReportSortColumn =
  | "createdAt"
  | "company"
  | "subject"
  | "fromAddress"
  | "requesterEmail"
  | "requesterLocation"
  | "type"
  | "category"
  | "mailSent"
  | "httpStatus";

/** Dirección de ordenación del reporte. */
export type TicketCreatedReportSortOrder = "asc" | "desc";

/** Estado de ordenación activa (`null` = más recientes primero). */
export type TicketCreatedReportSortState = {
  column: TicketCreatedReportSortColumn;
  order: TicketCreatedReportSortOrder;
} | null;

/** Estado de paginación del reporte. */
export interface TicketCreatedReportPaginationState {
  page: number;
  limit: TicketsPageSize;
  total: number;
  totalPages: number;
}

/** Fila del reporte ticket.created. */
export interface TicketCreatedLog {
  createdAt: string;
  company: string;
  requesterLocation: string | null;
  subject: string | null;
  fromAddress: string | null;
  requesterEmail: string | null;
  type: string | null;
  category: string | null;
  mailSent: string | null;
  httpStatus: string | null;
}

/** Resultado expuesto por useTicketCreatedReport. */
export interface UseTicketCreatedReportResult {
  items: TicketCreatedLog[];
  filters: TicketCreatedReportFilterState;
  appliedFilters: TicketCreatedReportFilterState;
  setFilters: (filters: TicketCreatedReportFilterState) => void;
  applyFilters: (filters?: TicketCreatedReportFilterState) => void;
  pagination: TicketCreatedReportPaginationState;
  setPage: (page: number) => void;
  setPageLimit: (limit: TicketsPageSize) => void;
  sort: TicketCreatedReportSortState;
  setSortColumn: (column: TicketCreatedReportSortColumn) => void;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  exporting: TicketCreatedReportExportFormat | null;
  downloadReport: (format: TicketCreatedReportExportFormat) => Promise<void>;
  categories: AsistiaCategory[];
  empresas: Empresa[];
  locations: AsistiaLocation[];
  catalogsLoading: boolean;
  catalogsError: string;
}
