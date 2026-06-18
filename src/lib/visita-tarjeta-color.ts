/**
 * @file visita-tarjeta-color.ts
 * @description Colores de tarjeta de visita y mapeo a zonas permitidas.
 */
import type { VisitaZona } from "@/api/visitas";

export const VISITA_TARJETA_COLOR = ["rojo", "amarillo", "verde"] as const;

export type VisitaTarjetaColor = (typeof VISITA_TARJETA_COLOR)[number];

/** Etiquetas legibles para mostrar en UI. */
export const VISITA_TARJETA_COLOR_LABELS: Record<VisitaTarjetaColor, string> = {
  rojo: "Rojo",
  amarillo: "Amarillo",
  verde: "Verde",
};

/** Descripción de accesos por color de tarjeta. */
export const VISITA_TARJETA_COLOR_ACCESOS: Record<VisitaTarjetaColor, string> = {
  rojo: "Administración",
  amarillo: "Fábrica",
  verde: "Administración y fábrica",
};

/** Indica si un valor es un color de tarjeta válido. */
export function isVisitaTarjetaColor(value: unknown): value is VisitaTarjetaColor {
  return typeof value === "string" && (VISITA_TARJETA_COLOR as readonly string[]).includes(value);
}

/** Resuelve las zonas permitidas según el color de tarjeta seleccionado. */
export function resolveZonasFromTarjetaColor(color: VisitaTarjetaColor): VisitaZona[] {
  switch (color) {
    case "rojo":
      return ["administración"];
    case "amarillo":
      return ["fábrica"];
    case "verde":
      return ["administración", "fábrica"];
  }
}
