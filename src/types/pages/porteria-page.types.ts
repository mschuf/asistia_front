/**

 * @file porteria-page.types.ts

 * @description Tipos para el estado y componentes del modulo Porteria.

 */

import type { PorteriaPageSize } from "@/lib/porteria";



/** Tabs disponibles en Porteria. */

export type PorteriaTab = "seguimiento" | "historial";



/** Registro del historial de visitas. */

export interface PorteriaHistoryRecord {

  id: number;

  visitante: string;

  documento: string;

  empresa: string;

  motivo: string;

  responsable: string;

}



/** Estado de filtros del historial. */

export interface PorteriaHistoryFilterState {

  search: string;

  visitante: string;

  documento: string;

  empresa: string;

  motivo: string;

  responsable: string;

}



/** Columnas ordenables del historial. */

export type PorteriaHistorySortColumn =

  | "id"

  | "visitante"

  | "documento"

  | "empresa"

  | "motivo"

  | "responsable";



/** Direccion de orden. */

export type PorteriaHistorySortOrder = "asc" | "desc";



/** Estado de orden activo. */

export interface PorteriaHistorySortState {

  column: PorteriaHistorySortColumn;

  order: PorteriaHistorySortOrder;

}



/** Card de resumen de visitantes. */

export interface PorteriaMetricCard {

  id: string;

  title: string;

  value: string;

}



/** Visitante activo en seguimiento. */

export interface PorteriaTrackingVisitor {

  id: number;

  name: string;

  company: string;

  zone: "planta" | "administracion" | "porteria";

  entryTime: string;

  status: "activo" | "alerta" | "peligro";

}



/** Metadatos de paginacion del historial. */

export interface PorteriaHistoryPagination {

  page: number;

  limit: PorteriaPageSize;

  total: number;

  totalPages: number;

}



/** Valor retornado por usePorteria. */

export interface UsePorteriaResult {

  tab: PorteriaTab;

  setTab: (nextTab: PorteriaTab) => void;

  metrics: PorteriaMetricCard[];

  trackingVisitors: PorteriaTrackingVisitor[];

  historyRows: PorteriaHistoryRecord[];

  historyPagination: PorteriaHistoryPagination;

  filters: PorteriaHistoryFilterState;

  setFilters: (filters: PorteriaHistoryFilterState) => void;

  applyFilters: (filters?: PorteriaHistoryFilterState) => void;

  sort: PorteriaHistorySortState | null;

  setSortColumn: (column: PorteriaHistorySortColumn) => void;

  setPage: (page: number) => void;

  setPageLimit: (limit: PorteriaPageSize) => void;

  selectedRecord: PorteriaHistoryRecord | null;

  selectRecord: (record: PorteriaHistoryRecord) => void;

  clearSelectedRecord: () => void;

}


