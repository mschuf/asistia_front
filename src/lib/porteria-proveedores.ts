/**
 * @file porteria-proveedores.ts
 * @description Utilidades para el selector de proveedor en formularios de personas.
 */
import { listarProveedores, obtenerProveedor } from "@/api/proveedores";
import type { SearchableSelectOption } from "@/components/ui/searchable-select";

/** Nombre del proveedor placeholder para datos históricos sin empresa. */
export const PROVEEDOR_SIN_ASIGNAR_NOMBRE = "Sin asignar";

/**
 * Carga opciones de proveedores activos para el selector.
 * @param query - Texto de búsqueda.
 * @param signal - Señal de aborto.
 * @returns Opciones para ServerSearchableSelect.
 */
export async function loadProveedorSelectOptions(
  query: string,
  signal: AbortSignal,
): Promise<SearchableSelectOption[]> {
  const result = await listarProveedores(
    {
      search: query.trim() || undefined,
      activo: true,
      limit: 20,
      sortBy: "nombre",
      sortOrder: "asc",
    },
    { signal },
  );

  return result.items.map((proveedor) => ({
    value: String(proveedor.id),
    label: proveedor.nombre,
  }));
}

/**
 * Resuelve la opción seleccionada de proveedor por ID.
 * @param value - ID serializado.
 * @param signal - Señal de aborto.
 * @returns Opción resuelta o null.
 */
export async function resolveProveedorSelectOption(
  value: string,
  signal: AbortSignal,
  options?: { allowLegacyText?: boolean },
): Promise<SearchableSelectOption | null> {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const id = Number(trimmed);
  if (!Number.isFinite(id) || id <= 0) {
    if (options?.allowLegacyText) {
      return { value: trimmed, label: trimmed, searchText: trimmed.toLowerCase() };
    }
    return null;
  }

  try {
    const proveedor = await obtenerProveedor(id, { signal });
    return { value: String(proveedor.id), label: proveedor.nombre };
  } catch {
    return null;
  }
}

/**
 * Resuelve el nombre legible a persistir a partir del valor del selector.
 * @param value - ID numérico o texto libre.
 * @param signal - Señal de aborto opcional.
 * @returns Nombre del proveedor.
 */
export async function resolveProveedorNombre(value: string, signal?: AbortSignal): Promise<string> {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const id = Number(trimmed);
  if (!Number.isFinite(id) || id <= 0) {
    return trimmed;
  }

  const proveedor = await obtenerProveedor(id, { signal });
  return proveedor.nombre.trim();
}

/**
 * Indica si una persona tiene un proveedor válido para registrar visitas.
 * @param proveedorNombre - Nombre del proveedor de la persona.
 * @returns true si puede usarse en visitas.
 */
export function personaTieneProveedorValido(proveedorNombre: string | null | undefined): boolean {
  const trimmed = proveedorNombre?.trim();
  return Boolean(trimmed && trimmed !== PROVEEDOR_SIN_ASIGNAR_NOMBRE);
}
