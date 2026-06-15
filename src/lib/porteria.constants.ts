/**
 * @file porteria.constants.ts
 * @description Constantes del modulo Porteria y control de acceso temporal.
 */

/** Usuario temporalmente habilitado para acceder al modulo Porteria. */
export const PORTERIA_ALLOWED_LOGIN = "thiago.rivas";

/** Clases Tailwind reutilizables por zona de Porteria. */
export interface PorteriaZoneColors {
  metricCard: string;
  metricIcon: string;
  trackingCard: string;
  trackingIcon: string;
  trackingEntryBox: string;
}

/**
 * Colores de Planta.
 * Para cambiar la paleta, reemplaza `emerald` por otro tono Tailwind (p. ej. green, lime).
 */
export const PORTERIA_PLANTA_COLORS: PorteriaZoneColors = {
  metricCard:
    "border-emerald-200/90 bg-gradient-to-br from-emerald-50 via-emerald-50/70 to-white text-emerald-900 shadow-sm shadow-emerald-200/30 dark:border-emerald-800/70 dark:from-emerald-950/60 dark:via-emerald-900/35 dark:to-emerald-950/45 dark:text-emerald-100 dark:shadow-sm dark:shadow-emerald-950/35",
  metricIcon:
    "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/50 dark:bg-emerald-900/55 dark:text-emerald-200 dark:ring-emerald-700/45",
  trackingCard:
    "border-emerald-200/90 bg-gradient-to-b from-emerald-50/95 via-emerald-50/45 to-white text-emerald-950 shadow-sm shadow-emerald-200/25 dark:border-emerald-800/70 dark:from-emerald-950/65 dark:via-emerald-900/30 dark:to-card dark:text-emerald-100 dark:shadow-sm dark:shadow-emerald-950/35",
  trackingIcon:
    "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/50 dark:bg-emerald-900/55 dark:text-emerald-200 dark:ring-emerald-700/45",
  trackingEntryBox:
    "border-emerald-200/60 bg-emerald-50/55 dark:border-emerald-800/50 dark:bg-emerald-950/40",
};

/**
 * Colores de Administracion.
 * Para cambiar la paleta, reemplaza `violet` por otro tono Tailwind (p. ej. purple, indigo).
 */
export const PORTERIA_ADMINISTRACION_COLORS: PorteriaZoneColors = {
  metricCard:
    "border-violet-200/90 bg-gradient-to-br from-violet-50 via-violet-50/70 to-white text-violet-900 shadow-sm shadow-violet-200/30 dark:border-violet-800/70 dark:from-violet-950/60 dark:via-violet-900/35 dark:to-violet-950/45 dark:text-violet-100 dark:shadow-sm dark:shadow-violet-950/35",
  metricIcon:
    "bg-violet-100 text-violet-700 ring-1 ring-violet-200/50 dark:bg-violet-900/55 dark:text-violet-200 dark:ring-violet-700/45",
  trackingCard:
    "border-violet-200/90 bg-gradient-to-b from-violet-50/95 via-violet-50/45 to-white text-violet-950 shadow-sm shadow-violet-200/25 dark:border-violet-800/70 dark:from-violet-950/65 dark:via-violet-900/30 dark:to-card dark:text-violet-100 dark:shadow-sm dark:shadow-violet-950/35",
  trackingIcon:
    "bg-violet-100 text-violet-700 ring-1 ring-violet-200/50 dark:bg-violet-900/55 dark:text-violet-200 dark:ring-violet-700/45",
  trackingEntryBox:
    "border-violet-200/60 bg-violet-50/55 dark:border-violet-800/50 dark:bg-violet-950/40",
};
