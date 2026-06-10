/**
 * @file format.ts
 * @description Formateo de fechas y nombres para presentación en la interfaz (locale es-PY).
 */

/**
 * Formatea una fecha ISO o timestamp como fecha y hora local legible.
 * @param value - Fecha en cadena o `null`/`undefined`.
 * @returns Fecha formateada, el valor original si no es parseable, o "—" si está vacío.
 */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/**
 * Separa una fecha en componentes de día y hora para layouts de dos líneas.
 * @param value - Fecha en cadena o `null`/`undefined`.
 * @returns Objeto con `date` formateada y `time` separada, o valores de fallback.
 */
export function formatDateParts(
  value: string | null | undefined
): { date: string; time: string | null } {
  if (!value) return { date: "—", time: null };
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { date: value, time: null };
  return {
    date: parsed.toLocaleString("es-PY", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }),
    time: parsed.toLocaleString("es-PY", {
      hour: "2-digit",
      minute: "2-digit"
    })
  };
}

/**
 * Divide un nombre completo en dos líneas para tablas o tarjetas compactas.
 * @param value - Nombre completo o `null`/`undefined`.
 * @returns Primera línea con hasta dos palabras y segunda línea con el resto, si aplica.
 */
export function formatNameParts(
  value: string | null | undefined
): { firstLine: string; secondLine: string | null } {
  const trimmed = value?.trim();
  if (!trimmed) return { firstLine: "—", secondLine: null };

  const words = trimmed.split(/\s+/);
  if (words.length <= 2) {
    return { firstLine: trimmed, secondLine: null };
  }

  return {
    firstLine: words.slice(0, 2).join(" "),
    secondLine: words.slice(2).join(" ")
  };
}
