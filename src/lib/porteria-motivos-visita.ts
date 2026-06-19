/**
 * @file porteria-motivos-visita.ts
 * @description Utilidades para el selector de motivo en visitas (tabla prt_motivo_visita).
 */
import {
  obtenerMotivoVisita,
  searchMotivoVisitCandidates,
  type MotivoVisitCandidate,
} from "@/api/motivos-visita";
import type { SearchableSelectOption } from "@/components/ui/searchable-select";

/**
 * Construye el valor del selector a partir del ID de motivo.
 * @param id - ID en Postgres.
 * @returns Valor serializado para el selector.
 */
export function toMotivoVisitaSelectValue(id: number): string {
  return String(id);
}

/**
 * Parsea el valor del selector.
 * @param value - Valor numérico o texto inválido.
 * @returns ID de motivo o null si el valor es inválido.
 */
export function parseMotivoVisitaSelectValue(value: string): number | null {
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
 * Construye la etiqueta visible de un candidato.
 * @param candidate - Candidato de búsqueda.
 * @returns Nombre del motivo.
 */
export function buildMotivoCandidateLabel(candidate: Pick<MotivoVisitCandidate, "fullName">): string {
  return candidate.fullName;
}

/**
 * Convierte candidatos de búsqueda a opciones del selector.
 * @param candidates - Resultados de visit-candidates.
 * @returns Opciones listas para ServerSearchableSelect.
 */
export function mapMotivoCandidatesToSelectOptions(
  candidates: MotivoVisitCandidate[],
): SearchableSelectOption[] {
  return candidates.map((candidate) => {
    const value = toMotivoVisitaSelectValue(candidate.id);
    const label = buildMotivoCandidateLabel(candidate);
    return {
      value,
      label,
      searchText: candidate.fullName.toLowerCase(),
    };
  });
}

/**
 * Carga opciones del selector desde prt_motivo_visita.
 * @param query - Texto de búsqueda.
 * @param signal - Señal de cancelación.
 * @param limit - Cantidad máxima de resultados.
 * @returns Opciones del selector.
 */
export async function loadMotivoVisitaSelectOptions(
  query: string,
  signal: AbortSignal,
  limit = 20,
): Promise<SearchableSelectOption[]> {
  const result = await searchMotivoVisitCandidates(query, limit, { signal });
  return mapMotivoCandidatesToSelectOptions(result.items);
}

/**
 * Resuelve la etiqueta visible de un valor del selector.
 * @param value - ID numérico o texto legacy.
 * @param signal - Señal de cancelación.
 * @param options - Permite mostrar texto libre guardado previamente.
 * @returns Opción resuelta o null.
 */
export async function resolveMotivoVisitaSelectOption(
  value: string,
  signal: AbortSignal,
  options?: { allowLegacyText?: boolean },
): Promise<SearchableSelectOption | null> {
  const motivoId = parseMotivoVisitaSelectValue(value);
  if (motivoId == null) {
    if (options?.allowLegacyText && value.trim()) {
      const trimmed = value.trim();
      return { value: trimmed, label: trimmed, searchText: trimmed.toLowerCase() };
    }
    return null;
  }

  const motivo = await obtenerMotivoVisita(motivoId, { signal });
  return {
    value: toMotivoVisitaSelectValue(motivo.id),
    label: motivo.nombre,
    searchText: motivo.nombre.toLowerCase(),
  };
}

/**
 * Resuelve el nombre legible a persistir a partir del valor del selector.
 * @param value - ID numérico o texto libre.
 * @param signal - Señal de cancelación opcional.
 * @returns Nombre del motivo.
 */
export async function resolveMotivoVisitaNombre(value: string, signal?: AbortSignal): Promise<string> {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const motivoId = parseMotivoVisitaSelectValue(trimmed);
  if (motivoId == null) {
    return trimmed;
  }

  const motivo = await obtenerMotivoVisita(motivoId, { signal });
  return motivo.nombre.trim();
}
