/**
 * @file visita-persona-activa.ts
 * @description Validación de visitas activas por persona visitante.
 */
import type { Visita } from "@/api/visitas";

/** Busca una visita activa de la persona, excluyendo la visita en edición. */
export function findVisitaActivaDePersona(
  visitasActivas: Visita[],
  personaId: number,
  excludeVisitaId?: number,
): Visita | undefined {
  return visitasActivas.find(
    (visita) =>
      visita.personaId === personaId &&
      (excludeVisitaId === undefined || visita.id !== excludeVisitaId),
  );
}

/** Mensaje de error cuando la persona ya tiene una visita activa. */
export function personaEnVisitaActivaMessage(visitante: string, visitaId: number): string {
  return `${visitante} ya tiene una visita activa (visita #${visitaId}). Finalícela antes de registrar otra.`;
}
