/**
 * @file parseExpiresIn.ts
 * @description Convierte valores de expiración de token (número o cadena con unidad) a segundos.
 */

/**
 * Normaliza `expiresIn` del backend a segundos enteros.
 * @param value - Duración como número, cadena numérica o con sufijo `s`, `m`, `h`, `d`.
 * @returns Segundos equivalentes; usa 3600 como valor por defecto si el formato es inválido.
 */
export function parseExpiresInSeconds(value: string | number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const trimmed = String(value).trim();
  const match = trimmed.match(/^(\d+)([smhd])?$/i);
  if (!match) return 3600;

  const amount = Number(match[1]);
  const unit = (match[2] ?? "s").toLowerCase();

  switch (unit) {
    case "m":
      return amount * 60;
    case "h":
      return amount * 3600;
    case "d":
      return amount * 86400;
    default:
      return amount;
  }
}
