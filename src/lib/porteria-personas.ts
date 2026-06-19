/**
 * @file porteria-personas.ts
 * @description Utilidades para el selector de persona en visitas (tabla prt_persona).
 */
import { obtenerPersona, searchVisitPersonCandidates, type VisitPersonCandidate } from "@/api/personas";
import type { SearchableSelectOption } from "@/components/ui/searchable-select";

/**
 * Construye el valor del selector a partir del ID de persona.
 * @param id - ID en Postgres.
 * @returns Valor serializado para el selector.
 */
export function toPersonaSelectValue(id: number): string {
  return String(id);
}

/**
 * Parsea el valor del selector.
 * @param value - Valor numérico, prefijo legacy pg:* o texto libre.
 * @returns ID de persona o null si el valor es inválido.
 */
export function parsePersonaSelectValue(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const pgMatch = trimmed.match(/^pg:(\d+)$/);
  if (pgMatch) {
    const id = Number(pgMatch[1]);
    return Number.isFinite(id) && id > 0 ? id : null;
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
 * @returns Nombre completo con documento.
 */
export function buildCandidateLabel(candidate: Pick<VisitPersonCandidate, "fullName" | "subtitle">): string {
  const subtitle = candidate.subtitle.trim();
  return subtitle ? `${candidate.fullName} — ${subtitle}` : candidate.fullName;
}

/**
 * Construye la etiqueta visible a partir de nombre y documento.
 * @param nombre - Nombre de la persona.
 * @param documento - Documento de la persona.
 * @returns Etiqueta formateada.
 */
export function buildPersonaLabel(nombre: string, documento: string): string {
  return buildCandidateLabel({ fullName: nombre, subtitle: documento });
}

/**
 * Convierte candidatos de búsqueda a opciones del selector.
 * @param candidates - Resultados de visit-candidates.
 * @returns Opciones listas para ServerSearchableSelect.
 */
export function mapCandidatesToSelectOptions(candidates: VisitPersonCandidate[]): SearchableSelectOption[] {
  return candidates.map((candidate) => {
    const value = toPersonaSelectValue(candidate.id);
    const label = buildCandidateLabel(candidate);
    return {
      value,
      label,
      searchText: `${candidate.fullName} ${candidate.subtitle}`.toLowerCase(),
    };
  });
}

/**
 * Carga opciones del selector desde prt_persona.
 * @param query - Texto de búsqueda.
 * @param signal - Señal de cancelación.
 * @param limit - Cantidad máxima de resultados.
 * @returns Opciones del selector.
 */
export async function loadVisitPersonCandidateOptions(
  query: string,
  signal: AbortSignal,
  limit = 20,
): Promise<SearchableSelectOption[]> {
  const result = await searchVisitPersonCandidates(query, limit, { signal });
  return mapCandidatesToSelectOptions(result.items);
}

/**
 * Resuelve la etiqueta visible de un valor del selector.
 * @param value - ID numérico, prefijo legacy pg:* o texto libre.
 * @param signal - Señal de cancelación.
 * @param options - Permite mostrar texto libre guardado previamente.
 * @returns Opción resuelta o null.
 */
export async function resolveCandidateOption(
  value: string,
  signal: AbortSignal,
  options?: { allowLegacyText?: boolean },
): Promise<SearchableSelectOption | null> {
  const personaId = parsePersonaSelectValue(value);
  if (personaId == null) {
    if (options?.allowLegacyText && value.trim()) {
      const trimmed = value.trim();
      return { value: trimmed, label: trimmed, searchText: trimmed.toLowerCase() };
    }
    return null;
  }

  const persona = await obtenerPersona(personaId, { signal });
  return {
    value: toPersonaSelectValue(persona.id),
    label: buildPersonaLabel(persona.nombre, persona.documento),
    searchText: `${persona.nombre} ${persona.documento}`.toLowerCase(),
  };
}

/**
 * Resuelve el nombre legible a persistir a partir del valor del selector.
 * @param value - ID numérico, prefijo legacy pg:* o texto libre.
 * @param signal - Señal de cancelación opcional.
 * @returns Nombre del responsable o visitante.
 */
export async function resolveCandidateFullName(value: string, signal?: AbortSignal): Promise<string> {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const personaId = parsePersonaSelectValue(trimmed);
  if (personaId == null) {
    return trimmed;
  }

  const persona = await obtenerPersona(personaId, { signal });
  return persona.nombre.trim();
}
