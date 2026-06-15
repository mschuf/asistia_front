/**

 * @file usePorteria.ts

 * @description Estado local del modulo Porteria con datos placeholder.

 */

import { useCallback, useMemo, useState } from "react";

import {

  createInitialPorteriaHistoryFilters,

  filterPorteriaHistoryRows,

  isValidPorteriaPageSize,

  paginatePorteriaHistoryRows,

  PORTERIA_PAGE_SIZE,

  sortPorteriaHistoryRows,

} from "@/lib/porteria";

import type { PorteriaPageSize } from "@/lib/porteria";

import type {

  PorteriaHistoryFilterState,

  PorteriaHistoryRecord,

  PorteriaHistorySortColumn,

  PorteriaHistorySortState,

  PorteriaMetricCard,

  PorteriaTab,

  PorteriaTrackingVisitor,

  UsePorteriaResult,

} from "@/types/pages/porteria-page.types";



const HISTORY_ROWS: PorteriaHistoryRecord[] = [

  { id: 1, visitante: "Maria Gonzalez", documento: "30.123.456", empresa: "Logistica Norte SA", motivo: "Entrega de materiales", responsable: "Juan Perez" },

  { id: 2, visitante: "Carlos Ruiz", documento: "28.987.654", empresa: "Proveedores del Sur", motivo: "Reunion comercial", responsable: "Ana Lopez" },

  { id: 3, visitante: "Ana Martinez", documento: "27.456.789", empresa: "Consultora AC", motivo: "Auditoria interna", responsable: "Roberto Diaz" },

  { id: 4, visitante: "Pedro Silva", documento: "31.222.333", empresa: "Transportes Express", motivo: "Retiro de equipos", responsable: "Juan Perez" },

  { id: 5, visitante: "Laura Fernandez", documento: "29.888.777", empresa: "Servicios Integrales", motivo: "Capacitacion", responsable: "Marta Ruiz" },

  { id: 6, visitante: "Javier Morales", documento: "32.111.999", empresa: "Industrias Delta", motivo: "Mantenimiento", responsable: "Carlos Mendez" },

  { id: 7, visitante: "Sofia Herrera", documento: "26.555.444", empresa: "Calidad Total SA", motivo: "Inspeccion de calidad", responsable: "Ana Lopez" },

  { id: 8, visitante: "Diego Castro", documento: "33.777.888", empresa: "Logistica Norte SA", motivo: "Entrega de materiales", responsable: "Juan Perez" },

  { id: 9, visitante: "Valentina Soto", documento: "30.666.555", empresa: "Consultora AC", motivo: "Reunion comercial", responsable: "Marta Ruiz" },

  { id: 10, visitante: "Martin Acosta", documento: "28.333.222", empresa: "Transportes Express", motivo: "Retiro de equipos", responsable: "Roberto Diaz" },

  { id: 11, visitante: "Camila Rios", documento: "27.999.111", empresa: "Servicios Integrales", motivo: "Capacitacion", responsable: "Ana Lopez" },

  { id: 12, visitante: "Lucas Vega", documento: "31.444.666", empresa: "Industrias Delta", motivo: "Mantenimiento", responsable: "Carlos Mendez" },

  { id: 13, visitante: "Florencia Paz", documento: "29.222.888", empresa: "Calidad Total SA", motivo: "Inspeccion de calidad", responsable: "Juan Perez" },

  { id: 14, visitante: "Nicolas Fuentes", documento: "32.888.333", empresa: "Proveedores del Sur", motivo: "Entrega de materiales", responsable: "Marta Ruiz" },

  { id: 15, visitante: "Gabriela Luna", documento: "26.111.777", empresa: "Consultora AC", motivo: "Auditoria interna", responsable: "Roberto Diaz" },

  { id: 16, visitante: "Facundo Torres", documento: "33.555.999", empresa: "Logistica Norte SA", motivo: "Reunion comercial", responsable: "Ana Lopez" },

  { id: 17, visitante: "Paula Navarro", documento: "30.777.444", empresa: "Transportes Express", motivo: "Retiro de equipos", responsable: "Carlos Mendez" },

  { id: 18, visitante: "Emiliano Costa", documento: "28.444.111", empresa: "Servicios Integrales", motivo: "Capacitacion", responsable: "Juan Perez" },

  { id: 19, visitante: "Renata Molina", documento: "27.666.888", empresa: "Industrias Delta", motivo: "Mantenimiento", responsable: "Marta Ruiz" },

  { id: 20, visitante: "Tomas Ibanez", documento: "31.999.222", empresa: "Calidad Total SA", motivo: "Inspeccion de calidad", responsable: "Roberto Diaz" },

  { id: 21, visitante: "Juliana Romero", documento: "29.333.666", empresa: "Proveedores del Sur", motivo: "Entrega de materiales", responsable: "Ana Lopez" },

  { id: 22, visitante: "Agustin Peralta", documento: "32.222.555", empresa: "Consultora AC", motivo: "Auditoria interna", responsable: "Carlos Mendez" },

  { id: 23, visitante: "Carolina Meza", documento: "26.888.333", empresa: "Logistica Norte SA", motivo: "Reunion comercial", responsable: "Juan Perez" },

  { id: 24, visitante: "Bruno Salinas", documento: "33.111.444", empresa: "Transportes Express", motivo: "Retiro de equipos", responsable: "Marta Ruiz" },

  { id: 25, visitante: "Daniela Ortiz", documento: "30.444.777", empresa: "Servicios Integrales", motivo: "Capacitacion", responsable: "Roberto Diaz" },

  { id: 26, visitante: "Ignacio Vera", documento: "28.777.999", empresa: "Industrias Delta", motivo: "Mantenimiento", responsable: "Ana Lopez" },

  { id: 27, visitante: "Mariana Duarte", documento: "27.222.666", empresa: "Calidad Total SA", motivo: "Inspeccion de calidad", responsable: "Carlos Mendez" },

  { id: 28, visitante: "Sebastian Rojas", documento: "31.666.111", empresa: "Proveedores del Sur", motivo: "Entrega de materiales", responsable: "Juan Perez" },

];



const METRIC_CARDS: PorteriaMetricCard[] = [

  { id: "month", title: "Total visitantes en el mes", value: "30" },

  { id: "day", title: "Total visitas en el dia", value: "12" },

  { id: "plant", title: "Visitantes en planta", value: "5" },

  { id: "admin", title: "Visitantes en administracion", value: "2" },

];



const TRACKING_VISITORS: PorteriaTrackingVisitor[] = [

  {

    id: 1,

    name: "Maria Gonzalez",

    company: "Logistica Norte SA",

    zone: "planta",

    entryTime: "08:42",

    status: "activo",

  },

  {

    id: 2,

    name: "Carlos Ruiz",

    company: "Proveedores del Sur",

    zone: "administracion",

    entryTime: "09:15",

    status: "activo",

  },

  {

    id: 3,

    name: "Ana Martinez",

    company: "Consultora AC",

    zone: "planta",

    entryTime: "10:03",

    status: "alerta",

  },

  {

    id: 4,

    name: "Pedro Silva",

    company: "Transportes Express",

    zone: "planta",

    entryTime: "10:28",

    status: "activo",

  },

  {

    id: 5,

    name: "Laura Fernandez",

    company: "Servicios Integrales",

    zone: "administracion",

    entryTime: "11:05",

    status: "activo",

  },

  {

    id: 6,

    name: "Javier Morales",

    company: "Industrias Delta",

    zone: "planta",

    entryTime: "11:32",

    status: "activo",

  },

  {

    id: 7,

    name: "Sofia Herrera",

    company: "Calidad Total SA",

    zone: "planta",

    entryTime: "11:48",

    status: "peligro",

  },

];



/**

 * Maneja tabs, cards, filtros y seleccion de historial para Porteria.

 * @returns Estado del modulo Porteria.

 */

export function usePorteria(): UsePorteriaResult {

  const [tab, setTab] = useState<PorteriaTab>("seguimiento");

  const [selectedRecord, setSelectedRecord] = useState<PorteriaHistoryRecord | null>(null);

  const [filters, setFiltersState] = useState(createInitialPorteriaHistoryFilters);

  const [appliedFilters, setAppliedFilters] = useState(createInitialPorteriaHistoryFilters);

  const [page, setPageState] = useState(1);

  const [pageLimit, setPageLimitState] = useState<PorteriaPageSize>(PORTERIA_PAGE_SIZE);

  const [sort, setSortState] = useState<PorteriaHistorySortState | null>(null);



  const metrics = useMemo(() => METRIC_CARDS, []);

  const trackingVisitors = useMemo(() => TRACKING_VISITORS, []);



  const filteredRows = useMemo(

    () => filterPorteriaHistoryRows(HISTORY_ROWS, appliedFilters),

    [appliedFilters],

  );



  const sortedRows = useMemo(

    () => sortPorteriaHistoryRows(filteredRows, sort),

    [filteredRows, sort],

  );



  const paginationResult = useMemo(

    () => paginatePorteriaHistoryRows(sortedRows, page, pageLimit),

    [sortedRows, page, pageLimit],

  );



  const setFilters = useCallback((nextFilters: PorteriaHistoryFilterState) => {

    setFiltersState(nextFilters);

  }, []);



  const applyFilters = useCallback((nextFilters?: PorteriaHistoryFilterState) => {

    setAppliedFilters(nextFilters ?? filters);

    setPageState(1);

  }, [filters]);



  const setPage = useCallback((nextPage: number) => {

    setPageState(Math.max(1, nextPage));

  }, []);



  const setPageLimit = useCallback((limit: PorteriaPageSize) => {

    if (!isValidPorteriaPageSize(limit)) return;

    setPageLimitState(limit);

    setPageState(1);

  }, []);



  const setSortColumn = useCallback((column: PorteriaHistorySortColumn) => {

    setSortState((current) => {

      if (!current || current.column !== column) {

        return { column, order: "asc" };

      }

      if (current.order === "asc") {

        return { column, order: "desc" };

      }

      return null;

    });

    setPageState(1);

  }, []);



  function selectRecord(record: PorteriaHistoryRecord) {

    setSelectedRecord(record);

  }



  function clearSelectedRecord() {

    setSelectedRecord(null);

  }



  return {

    tab,

    setTab,

    metrics,

    trackingVisitors,

    historyRows: paginationResult.items,

    historyPagination: {

      page,

      limit: pageLimit,

      total: paginationResult.total,

      totalPages: paginationResult.totalPages,

    },

    filters,

    setFilters,

    applyFilters,

    sort,

    setSortColumn,

    setPage,

    setPageLimit,

    selectedRecord,

    selectRecord,

    clearSelectedRecord,

  };

}


