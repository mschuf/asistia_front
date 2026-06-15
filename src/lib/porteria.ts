/**
 * @file porteria.ts
 * @description Utilidades de dominio para el modulo Porteria: filtros, orden y paginacion.
 */
import type {
  PorteriaHistoryFilterState,
  PorteriaHistoryRecord,
  PorteriaHistorySortColumn,
  PorteriaHistorySortState,
} from "@/types/pages/porteria-page.types";

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

/** @returns Estado inicial de filtros del historial. */
export function createInitialPorteriaHistoryFilters(): PorteriaHistoryFilterState {
  return {
    search: "",
    visitante: "",
    documento: "",
    empresa: "",
    motivo: "",
    responsable: "",
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
