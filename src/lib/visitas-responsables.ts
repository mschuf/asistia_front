/**
 * @file visitas-responsables.ts
 * @description Utilidades para el selector de responsable en visitas (usuarios GLPI).
 */
import {
  searchResponsableCandidates,
  type ResponsableCandidate,
} from "@/api/visitas";
import type { SearchableSelectOption } from "@/components/ui/searchable-select";

/**
 * Construye el valor del selector a partir del ID de usuario GLPI.
 * @param id - ID en GLPI.
 * @returns Valor serializado para el selector.
 */
export function toResponsableSelectValue(id: number): string {
  return String(id);
}

/**
 * Parsea el valor del selector de responsable GLPI.
 * @param value - ID numérico del usuario GLPI.
 * @returns ID de usuario o null si el valor es inválido.
 */
export function parseResponsableSelectValue(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const id = Number(trimmed);
  if (Number.isFinite(id) && id > 0) {
    return id;
  }

  return null;
}

/**
 * Construye la etiqueta visible de un candidato responsable GLPI.
 * @param candidate - Candidato de búsqueda.
 * @returns Nombre completo con ubicación GLPI.
 */
export function buildResponsableCandidateLabel(
  candidate: Pick<ResponsableCandidate, "fullName" | "subtitle">,
): string {
  const subtitle = candidate.subtitle.trim();
  return subtitle ? `${candidate.fullName} — ${subtitle}` : candidate.fullName;
}

/**
 * Convierte candidatos GLPI a opciones del selector.
 * @param candidates - Resultados de responsable-candidates.
 * @returns Opciones listas para ServerSearchableSelect.
 */
export function mapResponsableCandidatesToSelectOptions(
  candidates: ResponsableCandidate[],
): SearchableSelectOption[] {
  return candidates.map((candidate) => {
    const value = toResponsableSelectValue(candidate.id);
    const label = buildResponsableCandidateLabel(candidate);
    return {
      value,
      label,
      searchText: `${candidate.fullName} ${candidate.subtitle}`.toLowerCase(),
    };
  });
}

/**
 * Carga opciones del selector desde usuarios activos de GLPI.
 * @param query - Texto de búsqueda.
 * @param signal - Señal de cancelación.
 * @param limit - Cantidad máxima de resultados.
 * @returns Opciones del selector.
 */
export async function loadResponsableCandidateOptions(
  query: string,
  signal: AbortSignal,
  limit = 20,
): Promise<SearchableSelectOption[]> {
  const result = await searchResponsableCandidates(query, limit, { signal });
  return mapResponsableCandidatesToSelectOptions(result.items);
}

/**
 * Resuelve la etiqueta visible de un responsable GLPI seleccionado.
 * @param value - ID numérico del usuario GLPI.
 * @param signal - Señal de cancelación.
 * @param options - Permite mostrar texto libre guardado previamente al editar.
 * @returns Opción resuelta o null.
 */
export async function resolveResponsableCandidateOption(
  value: string,
  signal: AbortSignal,
  options?: { allowLegacyText?: boolean },
): Promise<SearchableSelectOption | null> {
  const userId = parseResponsableSelectValue(value);
  if (userId == null) {
    if (options?.allowLegacyText && value.trim()) {
      const trimmed = value.trim();
      return { value: trimmed, label: trimmed, searchText: trimmed.toLowerCase() };
    }
    return null;
  }

  const result = await searchResponsableCandidates("", 1, { signal, id: userId });
  const candidate = result.items[0];
  if (!candidate) {
    return null;
  }

  return {
    value: toResponsableSelectValue(candidate.id),
    label: buildResponsableCandidateLabel(candidate),
    searchText: `${candidate.fullName} ${candidate.subtitle}`.toLowerCase(),
  };
}

/**
 * Resuelve el nombre legible a persistir a partir del responsable GLPI seleccionado.
 * @param value - ID numérico del usuario GLPI.
 * @param signal - Señal de cancelación opcional.
 * @returns Nombre del responsable.
 */
export async function resolveResponsableFullName(value: string, signal?: AbortSignal): Promise<string> {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const userId = parseResponsableSelectValue(trimmed);
  if (userId == null) {
    return trimmed;
  }

  const result = await searchResponsableCandidates("", 1, { signal, id: userId });
  return result.items[0]?.fullName.trim() ?? "";
}
