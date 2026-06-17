/**
 * @file visita-credencial.ts
 * @description Validación de disponibilidad de números de tarjeta en visitas activas.
 */

interface VisitaCredencialRef {
  id: number;
  credencialNumero: string | null;
}

/** Normaliza el número de tarjeta para comparaciones. */
export function normalizeCredencialNumero(value: string): string {
  return value.trim();
}

/** Números de tarjeta en uso por visitas activas, excluyendo la visita en edición. */
export function getCredencialesOcupadas(
  visitasActivas: VisitaCredencialRef[],
  excludeVisitaId?: number,
): Set<string> {
  const occupied = new Set<string>();
  for (const visita of visitasActivas) {
    if (excludeVisitaId !== undefined && visita.id === excludeVisitaId) continue;
    const numero = visita.credencialNumero ? normalizeCredencialNumero(visita.credencialNumero) : "";
    if (numero) occupied.add(numero);
  }
  return occupied;
}

/** Indica si un número de tarjeta ya está asignado a otra visita activa. */
export function isCredencialOcupada(
  credencialNumero: string,
  occupiedCredenciales: ReadonlySet<string>,
): boolean {
  const normalized = normalizeCredencialNumero(credencialNumero);
  if (!normalized) return false;
  return occupiedCredenciales.has(normalized);
}

/** Mensaje de error cuando el número de tarjeta no está disponible. */
export function credencialOcupadaMessage(credencialNumero: string): string {
  return `La tarjeta Nº ${normalizeCredencialNumero(credencialNumero)} ya está en uso por otra visita activa.`;
}
