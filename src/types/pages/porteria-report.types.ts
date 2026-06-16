/**
 * @file porteria-report.types.ts
 * @description Tipos del hook y componentes del reporte superadmin de visitas de portería.
 */
import type { VisitaEstado } from "@/api/visitas";
import type { PorteriaReportExportFormat } from "@/api/reports";
import type { TicketsPageSize } from "@/lib/tickets";

/** Estado de filtros del reporte de visitas de portería. */
export interface PorteriaReportFilterState {
  /** Valor de input datetime-local (YYYY-MM-DDTHH:mm). */
  entradaFrom: string;
  /** Valor de input datetime-local (YYYY-MM-DDTHH:mm). */
  entradaTo: string;
  estado: string;
  empresa: string;
  visitante: string;
}

/** Columnas ordenables del reporte. */
export type PorteriaReportSortColumn =
  | "entradaAt"
  | "salidaAt"
  | "visitante"
  | "documento"
  | "empresa"
  | "motivo"
  | "responsable"
  | "estado";

/** Dirección de ordenación del reporte. */
export type PorteriaReportSortOrder = "asc" | "desc";

/** Estado de ordenación activa (`null` = más recientes primero). */
export type PorteriaReportSortState = {
  column: PorteriaReportSortColumn;
  order: PorteriaReportSortOrder;
} | null;

/** Estado de paginación del reporte. */
export interface PorteriaReportPaginationState {
  page: number;
  limit: TicketsPageSize;
  total: number;
  totalPages: number;
}

/** Fila del reporte de visitas de portería. */
export interface PorteriaReportLog {
  entradaAt: string | null;
  salidaAt: string | null;
  visitante: string;
  documento: string;
  empresa: string | null;
  motivo: string;
  responsable: string;
  estado: VisitaEstado;
  zonas: string;
  tarjeta: string | null;
  credencial: string | null;
}

/** Resultado expuesto por usePorteriaReport. */
export interface UsePorteriaReportResult {
  items: PorteriaReportLog[];
  filters: PorteriaReportFilterState;
  appliedFilters: PorteriaReportFilterState;
  setFilters: (filters: PorteriaReportFilterState) => void;
  applyFilters: (filters?: PorteriaReportFilterState) => void;
  pagination: PorteriaReportPaginationState;
  setPage: (page: number) => void;
  setPageLimit: (limit: TicketsPageSize) => void;
  sort: PorteriaReportSortState;
  setSortColumn: (column: PorteriaReportSortColumn) => void;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  exporting: PorteriaReportExportFormat | null;
  downloadReport: (format: PorteriaReportExportFormat) => Promise<void>;
}
