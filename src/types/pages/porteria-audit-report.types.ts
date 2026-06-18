/**
 * @file porteria-audit-report.types.ts
 * @description Tipos del reporte superadmin de auditoría de portería.
 */
import type { VisitaEstado } from "@/api/visitas";
import type { TicketsPageSize } from "@/lib/tickets";

export type PorteriaAuditAction =
  | "visita.created"
  | "visita.updated"
  | "visita.closed"
  | "visita.deleted";

export interface PorteriaAuditLog {
  id: number;
  visitaId: number;
  action: PorteriaAuditAction;
  actorUserId: number;
  actorName: string | null;
  occurredAt: string;
  visitante: string | null;
  documento: string | null;
  estadoBefore: VisitaEstado | null;
  estadoAfter: VisitaEstado | null;
  changedFields: string[];
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
}

export interface PorteriaAuditFilterState {
  q: string;
  action: "" | PorteriaAuditAction;
  actorUserId: string;
  visitaId: string;
  visitante: string;
  documento: string;
  occurredFrom: string;
  occurredTo: string;
  estadoBefore: "" | VisitaEstado;
  estadoAfter: "" | VisitaEstado;
}

export type PorteriaAuditSortColumn =
  | "occurredAt"
  | "action"
  | "visitante"
  | "documento"
  | "actorUserId"
  | "visitaId";

export type PorteriaAuditSortOrder = "asc" | "desc";

export type PorteriaAuditSortState = {
  column: PorteriaAuditSortColumn;
  order: PorteriaAuditSortOrder;
} | null;

export interface PorteriaAuditPaginationState {
  page: number;
  limit: TicketsPageSize;
  total: number;
  totalPages: number;
}

export interface UsePorteriaAuditReportResult {
  items: PorteriaAuditLog[];
  filters: PorteriaAuditFilterState;
  setFilters: (filters: PorteriaAuditFilterState) => void;
  applyFilters: (filters?: PorteriaAuditFilterState) => void;
  pagination: PorteriaAuditPaginationState;
  setPage: (page: number) => void;
  setPageLimit: (limit: TicketsPageSize) => void;
  sort: PorteriaAuditSortState;
  setSortColumn: (column: PorteriaAuditSortColumn) => void;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
}
