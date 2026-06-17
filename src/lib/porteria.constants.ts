/**
 * @file porteria.constants.ts
 * @description Constantes del modulo Porteria (paleta visual por zona).
 */
export interface PorteriaZoneColors {
  metricCard: string;
  metricIcon: string;
  trackingCard: string;
  trackingIcon: string;
  trackingEntryBox: string;
}

/**
 * Colores de Fabrica.
 * Para cambiar la paleta, reemplaza `emerald` por otro tono Tailwind (p. ej. green, lime).
 */
export const PORTERIA_FABRICA_COLORS: PorteriaZoneColors = {
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

/**
 * Colores de acceso a ambas zonas (tarjeta verde).
 * Para cambiar la paleta, reemplaza `lime` por otro tono Tailwind (p. ej. green, teal).
 */
export const PORTERIA_AMBAS_ZONAS_COLORS: PorteriaZoneColors = {
  metricCard:
    "border-lime-200/90 bg-gradient-to-br from-lime-50 via-emerald-50/70 to-white text-lime-900 shadow-sm shadow-lime-200/30 dark:border-lime-800/70 dark:from-lime-950/60 dark:via-emerald-900/35 dark:to-lime-950/45 dark:text-lime-100 dark:shadow-sm dark:shadow-lime-950/35",
  metricIcon:
    "bg-lime-100 text-lime-700 ring-1 ring-lime-200/50 dark:bg-lime-900/55 dark:text-lime-200 dark:ring-lime-700/45",
  trackingCard:
    "border-lime-200/90 bg-gradient-to-b from-lime-50/95 via-emerald-50/45 to-white text-lime-950 shadow-sm shadow-lime-200/25 dark:border-lime-800/70 dark:from-lime-950/65 dark:via-emerald-900/30 dark:to-card dark:text-lime-100 dark:shadow-sm dark:shadow-lime-950/35",
  trackingIcon:
    "bg-lime-100 text-lime-700 ring-1 ring-lime-200/50 dark:bg-lime-900/55 dark:text-lime-200 dark:ring-lime-700/45",
  trackingEntryBox:
    "border-lime-200/60 bg-lime-50/55 dark:border-lime-800/50 dark:bg-lime-950/40",
};

/** Estilos del card de alerta por visitas sin salida de dias anteriores. */
export const PORTERIA_ALERT_COLORS = {
  metricCard:
    "border-red-200/90 bg-gradient-to-br from-red-50 via-red-50/70 to-white text-red-900 shadow-sm shadow-red-200/30 dark:border-red-800/70 dark:from-red-950/60 dark:via-red-900/35 dark:to-red-950/45 dark:text-red-100 dark:shadow-sm dark:shadow-red-950/35",
  metricIcon:
    "bg-red-100 text-red-700 ring-1 ring-red-200/50 dark:bg-red-900/55 dark:text-red-200 dark:ring-red-700/45",
} as const;
