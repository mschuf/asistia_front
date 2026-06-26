/**
 * @file ers.ts
 * @description Utilidades de paginación/orden para el módulo ERS.
 */
import type { ErsSortColumn, ErsSortOrder } from "@/api/ers";

/** Opciones de tamaño de página del listado ERS. */
export const ERS_PAGE_SIZE_OPTIONS = [15, 50, 100] as const;

/** Tamaño de página por defecto en ERS. */
export const ERS_PAGE_SIZE = ERS_PAGE_SIZE_OPTIONS[0];

/** Valor del selector para cargar todos los elementos. */
export const ERS_PAGE_SIZE_ALL = "all" as const;

/** Límite máximo cuando se selecciona "todos". */
export const ERS_LIST_ALL_MAX = 50_000;

/** Tamaño de página de UI o modo all. */
export type ErsPageSize = (typeof ERS_PAGE_SIZE_OPTIONS)[number] | typeof ERS_PAGE_SIZE_ALL;

/** Estado de ordenamiento del listado ERS. */
export interface ErsSortState {
  column: ErsSortColumn;
  order: ErsSortOrder;
}

/** @returns `true` si la selección corresponde a "todos". */
export function isErsAllPageSize(limit: ErsPageSize): limit is typeof ERS_PAGE_SIZE_ALL {
  return limit === ERS_PAGE_SIZE_ALL;
}

/** Resuelve el limit numérico a enviar al backend. */
export function resolveErsApiLimit(limit: ErsPageSize, total: number): number {
  if (isErsAllPageSize(limit)) {
    return Math.min(Math.max(total, ERS_PAGE_SIZE), ERS_LIST_ALL_MAX);
  }
  return limit;
}

/** @returns `true` si el valor es una opción válida de tamaño de página. */
export function isValidErsPageSize(value: unknown): value is ErsPageSize {
  if (value === ERS_PAGE_SIZE_ALL) return true;
  return typeof value === "number" && (ERS_PAGE_SIZE_OPTIONS as readonly number[]).includes(value);
}

/** Parsea el valor del select de paginación ERS. */
export function parseErsPageSize(value: string): ErsPageSize | null {
  if (value === ERS_PAGE_SIZE_ALL) return ERS_PAGE_SIZE_ALL;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const candidate = parsed as ErsPageSize;
  return isValidErsPageSize(candidate) ? candidate : null;
}

