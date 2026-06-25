/**
 * @file porteria.ts
 * @description Utilidades de dominio para el modulo Porteria: filtros, orden y paginacion.
 */
import { type Visita, type VisitaEstado, type VisitaZona } from "@/api/visitas";
import {
  isVisitaTarjetaColor,
  VISITA_TARJETA_COLOR_ACCESOS,
  type VisitaTarjetaColor,
} from "@/lib/visita-tarjeta-color";
import type {
  PorteriaHistoryFilterState,
  PorteriaHistoryRecord,
  PorteriaHistorySortColumn,
  PorteriaHistorySortState,
  PorteriaMetricsDateFilterState,
  PorteriaMetricsPeriodPreset,
  PorteriaTrackingAccessType,
  PorteriaTrackingVisitor,
} from "@/types/pages/porteria-page.types";
import { toApiDateFrom, toApiDateTo } from "@/lib/tickets";

/** Opciones de tamano de pagina del historial. */
export const PORTERIA_PAGE_SIZE_OPTIONS = [15, 50, 100] as const;

/** Tamano de pagina por defecto. */
export const PORTERIA_PAGE_SIZE = PORTERIA_PAGE_SIZE_OPTIONS[0];

/** Valor del selector que muestra todos los registros. */
export const PORTERIA_PAGE_SIZE_ALL = "all" as const;

/** Tope de registros al elegir "Todos". */
export const PORTERIA_LIST_ALL_MAX = 50_000;

/** Tamano de pagina numerico o modo "todos". */
export type PorteriaPageSize =
  | (typeof PORTERIA_PAGE_SIZE_OPTIONS)[number]
  | typeof PORTERIA_PAGE_SIZE_ALL;

/** @param limit - Tamano de pagina UI. @returns `true` si el modo es "todos". */
export function isPorteriaAllPageSize(
  limit: PorteriaPageSize,
): limit is typeof PORTERIA_PAGE_SIZE_ALL {
  return limit === PORTERIA_PAGE_SIZE_ALL;
}

/**
 * Resuelve el `limit` para paginacion segun la seleccion UI.
 * @param limit - Tamano elegido en el selector.
 * @param total - Total de registros del listado actual.
 * @returns Limite numerico.
 */
export function resolvePorteriaApiLimit(limit: PorteriaPageSize, total: number): number {
  if (isPorteriaAllPageSize(limit)) {
    return Math.min(Math.max(total, PORTERIA_PAGE_SIZE), PORTERIA_LIST_ALL_MAX);
  }
  return limit;
}

/** @param limit - Valor candidato del selector. @returns `true` si es valido. */
export function isValidPorteriaPageSize(limit: unknown): limit is PorteriaPageSize {
  if (limit === PORTERIA_PAGE_SIZE_ALL) return true;
  return (
    typeof limit === "number" &&
    (PORTERIA_PAGE_SIZE_OPTIONS as readonly number[]).includes(limit)
  );
}

/** @param value - Valor del `<select>`. @returns Tamano parseado o `null`. */
export function parsePorteriaPageSize(value: string): PorteriaPageSize | null {
  if (value === PORTERIA_PAGE_SIZE_ALL) return PORTERIA_PAGE_SIZE_ALL;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const candidate = parsed as PorteriaPageSize;
  return isValidPorteriaPageSize(candidate) ? candidate : null;
}

/** @returns Fecha local actual en formato YYYY-MM-DD. */
export function getLocalTodayYmd(): string {
  const now = new Date();
  return formatLocalYmd(now);
}

/** @param date - Fecha local. @returns YYYY-MM-DD. */
function formatLocalYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** @param ymd - Fecha YYYY-MM-DD. @param days - Días a sumar (negativo hacia atrás). @returns Nueva fecha YYYY-MM-DD. */
function offsetLocalYmd(ymd: string, days: number): string {
  const [year, month, day] = ymd.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return formatLocalYmd(date);
}

/** @returns Filtro de fechas de métricas con preset Hoy por defecto. */
export function createInitialPorteriaMetricsDateFilter(): PorteriaMetricsDateFilterState {
  return { preset: "hoy", desde: "", hasta: "" };
}

/** @param desde - Fecha desde YYYY-MM-DD. @param hasta - Fecha hasta YYYY-MM-DD. @returns `true` si el rango es válido. */
export function isValidPorteriaMetricsCustomRange(desde: string, hasta: string): boolean {
  const from = desde.trim();
  const to = hasta.trim();
  if (!from || !to) return false;
  return from <= to;
}

/**
 * Resuelve el rango API según el preset o fechas personalizadas.
 * @param filter - Estado del filtro de métricas.
 * @returns Parámetros ISO o `null` si el rango custom es incompleto/inválido.
 */
export function resolveMetricsDateRange(filter: PorteriaMetricsDateFilterState): {
  entradaFrom: string;
  entradaTo: string;
} | null {
  const today = getLocalTodayYmd();

  switch (filter.preset) {
    case "hoy":
      return {
        entradaFrom: toApiDateFrom(today)!,
        entradaTo: toApiDateTo(today)!,
      };
    case "7d":
      return {
        entradaFrom: toApiDateFrom(offsetLocalYmd(today, -6))!,
        entradaTo: toApiDateTo(today)!,
      };
    case "30d":
      return {
        entradaFrom: toApiDateFrom(offsetLocalYmd(today, -29))!,
        entradaTo: toApiDateTo(today)!,
      };
    case "custom":
      if (!isValidPorteriaMetricsCustomRange(filter.desde, filter.hasta)) return null;
      return {
        entradaFrom: toApiDateFrom(filter.desde)!,
        entradaTo: toApiDateTo(filter.hasta)!,
      };
  }
}

/** @param preset - Preset activo. @returns Título de la card de ingresos del período. */
export function getMetricsPeriodIngressTitle(preset: PorteriaMetricsPeriodPreset): string {
  switch (preset) {
    case "hoy":
      return "Ingresos en el mes";
    case "7d":
      return "Ingresos (7 días)";
    case "30d":
      return "Ingresos (30 días)";
    case "custom":
      return "Ingresos en el período";
  }
}

/** @returns Rango del mes calendario actual (desde el día 1 hasta hoy). */
export function resolveCalendarMonthDateRange(): {
  entradaFrom: string;
  entradaTo: string;
} {
  const today = getLocalTodayYmd();
  const firstDay = `${today.slice(0, 7)}-01`;

  return {
    entradaFrom: toApiDateFrom(firstDay)!,
    entradaTo: toApiDateTo(today)!,
  };
}

/** @returns Rango del día actual (inicio a fin en hora local). */
export function resolveTodayDateRange(): {
  entradaFrom: string;
  entradaTo: string;
} {
  const today = getLocalTodayYmd();

  return {
    entradaFrom: toApiDateFrom(today)!,
    entradaTo: toApiDateTo(today)!,
  };
}

/** @param preset - Preset activo. @returns Título de la card de ingresos del último día. */
export function getMetricsDayIngressTitle(preset: PorteriaMetricsPeriodPreset): string {
  if (preset === "hoy") return "Ingresos hoy";
  return "Ingresos (último día)";
}

/** @param preset - Preset activo. @returns Título de la card de visitas activas sin salida. */
export function getMetricsStaleCheckoutTitle(preset: PorteriaMetricsPeriodPreset): string {
  if (preset === "hoy") return "Sin salida en el mes";
  return "Sin salida de días anteriores";
}

/** @returns Subtítulo para cards de visitas activas en métricas filtradas. */
export function getMetricsActiveSubtitle(): string {
  return "Activas en el período";
}

/** @param zonasPermitidas - Zonas autorizadas de la visita. @returns Tipo de acceso para seguimiento. */
function resolveTrackingAccessFromZonas(zonasPermitidas: VisitaZona[]): PorteriaTrackingAccessType {
  const hasAdmin = zonasPermitidas.includes("administración");
  const hasFactory = zonasPermitidas.includes("fábrica");

  if (hasAdmin && hasFactory) return "ambas";
  if (hasFactory) return "solo_fabrica";
  return "solo_administracion";
}

/** @param tarjetaColor - Color de tarjeta de la visita. @returns Tipo de acceso para seguimiento. */
function resolveTrackingAccessFromTarjetaColor(
  tarjetaColor: VisitaTarjetaColor,
): PorteriaTrackingAccessType {
  switch (tarjetaColor) {
    case "rojo":
      return "solo_administracion";
    case "amarillo":
      return "solo_fabrica";
    case "verde":
      return "ambas";
  }
}

const TRACKING_ACCESS_LABEL: Record<PorteriaTrackingAccessType, string> = {
  solo_administracion: VISITA_TARJETA_COLOR_ACCESOS.rojo,
  solo_fabrica: VISITA_TARJETA_COLOR_ACCESOS.amarillo,
  ambas: VISITA_TARJETA_COLOR_ACCESOS.verde,
};

/** @param visita - Visita activa. @returns Tipo de acceso y etiqueta para la card de seguimiento. */
function resolveTrackingAccess(visita: Visita): {
  accessType: PorteriaTrackingAccessType;
  accessLabel: string;
  tarjetaColor: VisitaTarjetaColor | null;
} {
  const tarjetaColor = isVisitaTarjetaColor(visita.tarjetaColor) ? visita.tarjetaColor : null;
  const accessType = tarjetaColor
    ? resolveTrackingAccessFromTarjetaColor(tarjetaColor)
    : resolveTrackingAccessFromZonas(visita.zonasPermitidas);

  return {
    accessType,
    accessLabel: TRACKING_ACCESS_LABEL[accessType],
    tarjetaColor,
  };
}

/** @param entradaAt - Timestamp ISO de entrada. @returns Hora formateada para la card. */
function formatTrackingEntryTime(entradaAt: string | null): string {
  if (!entradaAt) return "—";
  return new Date(entradaAt).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Convierte una visita activa de la API al modelo de seguimiento de Portería.
 * @param visita - Visita obtenida del backend.
 * @returns Visitante listo para PorteriaSeguimientoCards.
 */
export function mapVisitaToTrackingVisitor(visita: Visita): PorteriaTrackingVisitor {
  const { accessType, accessLabel, tarjetaColor } = resolveTrackingAccess(visita);

  return {
    id: visita.id,
    personaId: visita.personaId,
    hasVisitaFoto: visita.hasVisitaFoto ?? false,
    hasPersonaFoto: visita.hasFoto ?? false,
    name: visita.visitante,
    company: visita.empresa ?? "—",
    responsable: visita.responsableNombre,
    accessType,
    accessLabel,
    tarjetaColor,
    entryTime: formatTrackingEntryTime(visita.entradaAt),
    status: visita.estadoSeguimiento ?? "activo",
  };
}

/**
 * Convierte una visita de la API al registro del historial de Portería.
 * @param visita - Visita obtenida del backend.
 * @returns Fila compatible con PorteriaHistoryTable.
 */
export function mapVisitaToHistoryRecord(visita: Visita): PorteriaHistoryRecord {
  return {
    id: visita.id,
    personaId: visita.personaId,
    hasVisitaFoto: visita.hasVisitaFoto ?? false,
    hasPersonaFoto: visita.hasFoto ?? false,
    visitante: visita.visitante,
    documento: visita.documento,
    empresa: visita.empresa ?? "—",
    motivo: visita.motivo,
    responsable: visita.responsableNombre,
    entradaAt: visita.entradaAt,
    salidaAt: visita.salidaAt,
    estado: visita.estado,
  };
}

const HISTORY_ESTADO_LABEL: Record<VisitaEstado, string> = {
  programada: "Programada",
  activa: "Activa",
  sin_salida: "Sin salida",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
};

const HISTORY_ESTADO_VARIANT: Record<
  VisitaEstado,
  "info" | "success" | "warning" | "danger"
> = {
  programada: "info",
  activa: "success",
  sin_salida: "danger",
  finalizada: "warning",
  cancelada: "danger",
};

/** @param entradaAt - Timestamp ISO de entrada. @returns Fecha formateada para el detalle del historial. */
export function formatHistoryVisitDate(entradaAt: string | null): string {
  if (!entradaAt) return "—";
  return new Date(entradaAt).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** @param iso - Timestamp ISO. @returns Hora formateada para el recorrido del historial. */
export function formatHistoryVisitTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * @param entradaAt - Timestamp ISO de entrada.
 * @param salidaAt - Timestamp ISO de salida.
 * @param estado - Estado de la visita para calcular visitas activas contra la hora actual.
 * @returns Duracion en formato HH:mm o `—` si faltan datos.
 */
export function calculateHistoryVisitDuration(
  entradaAt: string | null,
  salidaAt: string | null,
  estado?: VisitaEstado,
): string {
  if (!entradaAt) return "—";

  const endAt = estado === "activa" ? new Date() : salidaAt ? new Date(salidaAt) : null;
  if (!endAt) return "—";

  const diffMs = endAt.getTime() - new Date(entradaAt).getTime();
  if (diffMs < 0) return "—";

  const totalMinutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** @param estado - Estado de la visita. @returns Etiqueta legible para UI. */
export function getHistoryEstadoLabel(estado: VisitaEstado): string {
  return HISTORY_ESTADO_LABEL[estado];
}

/** @param estado - Estado de la visita. @returns Variante de badge para UI. */
export function getHistoryEstadoBadgeVariant(
  estado: VisitaEstado,
): "info" | "success" | "warning" | "danger" {
  return HISTORY_ESTADO_VARIANT[estado];
}

/** @returns Estado inicial de filtros del historial. */
export function createInitialPorteriaHistoryFilters(): PorteriaHistoryFilterState {
  return {
    search: "",
    visitante: "",
    documento: "",
    empresa: "",
    motivo: "",
    responsable: "",
    entradaFrom: "",
    entradaTo: "",
  };
}

const SORT_COLUMN_KEYS: Record<PorteriaHistorySortColumn, keyof PorteriaHistoryRecord> = {
  id: "id",
  visitante: "visitante",
  documento: "documento",
  empresa: "empresa",
  motivo: "motivo",
  responsable: "responsable",
};

/** @param value - Texto a normalizar. @returns Texto en minusculas sin espacios extremos. */
function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

/** @param row - Registro de visita. @param query - Texto de busqueda. @returns `true` si coincide en algun campo. */
function matchesSearch(row: PorteriaHistoryRecord, query: string): boolean {
  const haystack = [
    row.visitante,
    row.documento,
    row.empresa,
    row.motivo,
    row.responsable,
    String(row.id),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

/**
 * Filtra filas del historial segun busqueda global y filtros avanzados.
 * @param rows - Registros completos.
 * @param filters - Filtros aplicados.
 * @returns Filas que cumplen los criterios.
 */
export function filterPorteriaHistoryRows(
  rows: PorteriaHistoryRecord[],
  filters: PorteriaHistoryFilterState,
): PorteriaHistoryRecord[] {
  const search = normalizeText(filters.search);
  const visitante = normalizeText(filters.visitante);
  const documento = normalizeText(filters.documento);
  const empresa = normalizeText(filters.empresa);
  const motivo = normalizeText(filters.motivo);
  const responsable = normalizeText(filters.responsable);

  return rows.filter((row) => {
    if (search && !matchesSearch(row, search)) return false;
    if (visitante && !normalizeText(row.visitante).includes(visitante)) return false;
    if (documento && !normalizeText(row.documento).includes(documento)) return false;
    if (empresa && !normalizeText(row.empresa).includes(empresa)) return false;
    if (motivo && !normalizeText(row.motivo).includes(motivo)) return false;
    if (responsable && !normalizeText(row.responsable).includes(responsable)) return false;
    return true;
  });
}

/**
 * Ordena filas del historial alfabeticamente.
 * @param rows - Registros filtrados.
 * @param sort - Estado de orden activo o `null`.
 * @returns Copia ordenada.
 */
export function sortPorteriaHistoryRows(
  rows: PorteriaHistoryRecord[],
  sort: PorteriaHistorySortState | null,
): PorteriaHistoryRecord[] {
  if (!sort) return rows;

  const direction = sort.order === "asc" ? 1 : -1;

  return [...rows].sort((left, right) => {
    if (sort.column === "id") {
      return (left.id - right.id) * direction;
    }

    const key = SORT_COLUMN_KEYS[sort.column];
    const comparison = String(left[key]).localeCompare(String(right[key]), "es", {
      sensitivity: "base",
    });
    return comparison * direction;
  });
}

export interface PorteriaHistoryPaginationResult {
  items: PorteriaHistoryRecord[];
  total: number;
  totalPages: number;
}

/**
 * Pagina filas del historial.
 * @param rows - Registros ordenados.
 * @param page - Pagina actual (1-based).
 * @param limit - Tamano de pagina UI.
 * @returns Items de la pagina y metadatos.
 */
export function paginatePorteriaHistoryRows(
  rows: PorteriaHistoryRecord[],
  page: number,
  limit: PorteriaPageSize,
): PorteriaHistoryPaginationResult {
  const total = rows.length;
  const resolvedLimit = isPorteriaAllPageSize(limit) ? total || 1 : limit;
  const totalPages = isPorteriaAllPageSize(limit) ? 1 : Math.max(1, Math.ceil(total / resolvedLimit));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * resolvedLimit;
  const items = rows.slice(start, start + resolvedLimit);

  return { items, total, totalPages };
}
