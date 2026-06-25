/**

 * @file porteria-page.types.ts

 * @description Tipos para el estado y componentes del modulo Porteria.

 */

import type { VisitaEstado } from "@/api/visitas";
import type { PorteriaPageSize } from "@/lib/porteria";



/** Tabs disponibles en Porteria. */

export type PorteriaTab = "indicadores" | "visita" | "historial";



/** Registro del historial de visitas. */

export interface PorteriaHistoryRecord {

  id: number;

  personaId: number;

  hasVisitaFoto: boolean;

  hasPersonaFoto: boolean;

  visitante: string;

  documento: string;

  empresa: string;

  motivo: string;

  responsable: string;

  entradaAt: string | null;

  salidaAt: string | null;

  estado: VisitaEstado;

}



/** Estado de filtros del historial. */

export interface PorteriaHistoryFilterState {

  search: string;

  visitante: string;

  documento: string;

  empresa: string;

  motivo: string;

  responsable: string;

  entradaFrom: string;

  entradaTo: string;

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

  subtitle?: string;

}



/** Presets de período para métricas de Portería. */

export type PorteriaMetricsPeriodPreset = "hoy" | "7d" | "30d" | "custom";



/** Estado del filtro de fechas de métricas. */

export interface PorteriaMetricsDateFilterState {

  preset: PorteriaMetricsPeriodPreset;

  desde: string;

  hasta: string;

}



/** Tipo de acceso de visitante en seguimiento. */

export type PorteriaTrackingAccessType = "solo_administracion" | "solo_fabrica" | "ambas";



/** Visitante activo en seguimiento. */

export interface PorteriaTrackingVisitor {

  id: number;

  personaId: number;

  hasVisitaFoto: boolean;

  hasPersonaFoto: boolean;

  name: string;

  company: string;

  responsable: string;

  accessType: PorteriaTrackingAccessType;

  accessLabel: string;

  tarjetaColor: "rojo" | "amarillo" | "verde" | null;

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



/** Valor retornado por usePorteriaIndicadores. */
export interface UsePorteriaIndicadoresResult {
  metrics: PorteriaMetricCard[];
  trackingVisitors: PorteriaTrackingVisitor[];
  metricsDateFilter: PorteriaMetricsDateFilterState;
  setMetricsDateFilter: (filter: PorteriaMetricsDateFilterState) => void;
  loading: boolean;
  refresh: () => Promise<void>;
}

/** Valor retornado por usePorteriaHistorial. */
export interface UsePorteriaHistorialResult {
  historyRows: PorteriaHistoryRecord[];
  historyPagination: PorteriaHistoryPagination;
  historyLoading: boolean;
  historyError: string;
  filters: PorteriaHistoryFilterState;
  setFilters: (filters: PorteriaHistoryFilterState) => void;
  applyFilters: (filters?: PorteriaHistoryFilterState) => Promise<void>;
  sort: PorteriaHistorySortState | null;
  setSortColumn: (column: PorteriaHistorySortColumn) => void;
  setPage: (page: number) => void;
  setPageLimit: (limit: PorteriaPageSize) => void;
  selectedRecord: PorteriaHistoryRecord | null;
  selectRecord: (record: PorteriaHistoryRecord) => void;
  clearSelectedRecord: () => void;
  refresh: () => Promise<void>;
}


