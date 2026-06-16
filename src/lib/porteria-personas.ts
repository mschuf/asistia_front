/**
 * @file porteria-personas.ts
 * @description Utilidades para el selector unificado de persona (Postgres + GLPI) en visitas.
 */
import { obtenerPersona, searchVisitPersonCandidates, type VisitPersonCandidate, type VisitPersonCandidateSource } from "@/api/personas";
import type { SearchableSelectOption } from "@/components/ui/searchable-select";

/** Valor compuesto del selector: pg:12 o glpi:188. */
export type VisitPersonCandidateValue = `pg:${number}` | `glpi:${number}`;

/**
 * Construye el valor compuesto del selector a partir de origen e ID.
 * @param source - Origen del candidato.
 * @param id - ID en Postgres o GLPI.
 * @returns Valor serializado para el selector.
 */
export function toCandidateValue(source: VisitPersonCandidateSource, id: number): VisitPersonCandidateValue {
  return source === "postgres" ? `pg:${id}` : `glpi:${id}`;
}

/**
 * Parsea el valor compuesto del selector.
 * @param value - Valor del selector (pg:*, glpi:* o legacy numérico).
 * @returns Origen e ID, o null si el valor es inválido.
 */
export function parseCandidateValue(
  value: string,
): { source: VisitPersonCandidateSource; id: number } | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const pgMatch = trimmed.match(/^pg:(\d+)$/);
  if (pgMatch) {
    const id = Number(pgMatch[1]);
    return Number.isFinite(id) && id > 0 ? { source: "postgres", id } : null;
  }

  const glpiMatch = trimmed.match(/^glpi:(\d+)$/);
  if (glpiMatch) {
    const id = Number(glpiMatch[1]);
    return Number.isFinite(id) && id > 0 ? { source: "glpi", id } : null;
  }

  const legacyId = Number(trimmed);
  if (Number.isFinite(legacyId) && legacyId > 0) {
    return { source: "postgres", id: legacyId };
  }

  return null;
}

/**
 * Construye la etiqueta visible de un candidato.
 * @param candidate - Candidato de búsqueda.
 * @returns Nombre completo con documento o ubicación.
 */
export function buildCandidateLabel(candidate: Pick<VisitPersonCandidate, "fullName" | "subtitle">): string {
  const subtitle = candidate.subtitle.trim();
  return subtitle ? `${candidate.fullName} — ${subtitle}` : candidate.fullName;
}

/**
 * Construye la etiqueta visible a partir de nombre y documento (Postgres).
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
    const value = toCandidateValue(candidate.source, candidate.id);
    const label = buildCandidateLabel(candidate);
    return {
      value,
      label,
      searchText: `${candidate.fullName} ${candidate.subtitle}`.toLowerCase(),
    };
  });
}

/**
 * Carga opciones del selector desde Postgres y GLPI.
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
 * @param value - Valor pg:*, glpi:* o texto legacy.
 * @param signal - Señal de cancelación.
 * @param options - Permite mostrar texto libre guardado previamente.
 * @returns Opción resuelta o null.
 */
export async function resolveCandidateOption(
  value: string,
  signal: AbortSignal,
  options?: { allowLegacyText?: boolean },
): Promise<SearchableSelectOption | null> {
  const parsed = parseCandidateValue(value);
  if (!parsed) {
    if (options?.allowLegacyText && value.trim()) {
      const trimmed = value.trim();
      return { value: trimmed, label: trimmed, searchText: trimmed.toLowerCase() };
    }
    return null;
  }

  if (parsed.source === "postgres") {
    const persona = await obtenerPersona(parsed.id, { signal });
    return {
      value: toCandidateValue("postgres", persona.id),
      label: buildPersonaLabel(persona.nombre, persona.documento),
      searchText: `${persona.nombre} ${persona.documento}`.toLowerCase(),
    };
  }

  const result = await searchVisitPersonCandidates("", 50, { signal });
  const match = result.items.find(
    (candidate) => candidate.source === "glpi" && candidate.id === parsed.id,
  );
  if (match) {
    return {
      value: toCandidateValue("glpi", match.id),
      label: buildCandidateLabel(match),
      searchText: `${match.fullName} ${match.subtitle}`.toLowerCase(),
    };
  }

  return {
    value: toCandidateValue("glpi", parsed.id),
    label: `Usuario GLPI #${parsed.id}`,
    searchText: String(parsed.id),
  };
}

/**
 * Resuelve el nombre legible a persistir a partir del valor del selector.
 * @param value - Valor pg:*, glpi:* o texto legacy.
 * @param signal - Señal de cancelación opcional.
 * @returns Nombre del responsable o visitante.
 */
export async function resolveCandidateFullName(value: string, signal?: AbortSignal): Promise<string> {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const parsed = parseCandidateValue(trimmed);
  if (!parsed) {
    return trimmed;
  }

  if (parsed.source === "postgres") {
    const persona = await obtenerPersona(parsed.id, { signal });
    return persona.nombre.trim();
  }

  const result = await searchVisitPersonCandidates("", 50, { signal });
  const match = result.items.find(
    (candidate) => candidate.source === "glpi" && candidate.id === parsed.id,
  );
  if (match) {
    return match.fullName.trim();
  }

  return `Usuario GLPI #${parsed.id}`;
}
