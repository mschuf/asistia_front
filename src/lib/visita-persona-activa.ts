/**
 * @file visita-persona-activa.ts
 * @description Validación de visitas activas por persona visitante.
 */
import type { Visita } from "@/api/visitas";

/** Indica si una fecha ISO cae en el mismo día calendario local que la referencia. */
export function isSameLocalDay(isoDate: string | null, referenceDate: Date): boolean {
  if (!isoDate) return false;

  const date = new Date(isoDate);
  return (
    date.getFullYear() === referenceDate.getFullYear() &&
    date.getMonth() === referenceDate.getMonth() &&
    date.getDate() === referenceDate.getDate()
  );
}

/** Busca una visita activa de la persona el mismo día local, excluyendo la visita en edición. */
export function findVisitaActivaDePersona(
  visitasActivas: Visita[],
  personaId: number,
  excludeVisitaId?: number,
  referenceDate: Date = new Date(),
): Visita | undefined {
  return visitasActivas.find(
    (visita) =>
      visita.personaId === personaId &&
      (excludeVisitaId === undefined || visita.id !== excludeVisitaId) &&
      isSameLocalDay(visita.entradaAt, referenceDate),
  );
}

/** Mensaje de error cuando la persona ya tiene una visita activa. */
export function personaEnVisitaActivaMessage(visitante: string, visitaId: number): string {
  return `${visitante} ya tiene una visita activa (visita #${visitaId}). Finalícela antes de registrar otra.`;
}
