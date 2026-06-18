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
    "border-emerald-200 bg-gradient-to-b from-emerald-100/90 via-emerald-100/60 to-emerald-50/25 text-emerald-950 shadow-sm shadow-emerald-200/35 dark:border-emerald-800/70 dark:from-emerald-950/65 dark:via-emerald-900/30 dark:to-card dark:text-emerald-100 dark:shadow-sm dark:shadow-emerald-950/35",
  trackingIcon:
    "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200/50 dark:bg-emerald-900/55 dark:text-emerald-200 dark:ring-emerald-700/45",
  trackingEntryBox:
    "border-emerald-200/80 bg-emerald-100/70 dark:border-emerald-800/50 dark:bg-emerald-950/40",
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
    "border-violet-200 bg-gradient-to-b from-violet-100/90 via-violet-100/60 to-violet-50/25 text-violet-950 shadow-sm shadow-violet-200/35 dark:border-violet-800/70 dark:from-violet-950/65 dark:via-violet-900/30 dark:to-card dark:text-violet-100 dark:shadow-sm dark:shadow-violet-950/35",
  trackingIcon:
    "bg-violet-100 text-violet-700 ring-1 ring-violet-200/50 dark:bg-violet-900/55 dark:text-violet-200 dark:ring-violet-700/45",
  trackingEntryBox:
    "border-violet-200/80 bg-violet-100/70 dark:border-violet-800/50 dark:bg-violet-950/40",
};

/** Celeste compartido para métrica y seguimiento de ambas zonas. */
const PORTERIA_SKY_TRACKING_COLORS = {
  trackingCard:
    "border-sky-200 bg-gradient-to-b from-sky-100/90 via-sky-100/60 to-sky-50/25 text-sky-950 shadow-sm shadow-sky-200/35 dark:border-sky-800/70 dark:from-sky-950/65 dark:via-sky-900/30 dark:to-card dark:text-sky-100 dark:shadow-sm dark:shadow-sky-950/35",
  trackingIcon:
    "bg-sky-100 text-sky-700 ring-1 ring-sky-200/50 dark:bg-sky-900/55 dark:text-sky-200 dark:ring-sky-700/45",
  trackingEntryBox:
    "border-sky-200/80 bg-sky-100/70 dark:border-sky-800/50 dark:bg-sky-950/40",
} as const;

/**
 * Colores de acceso a ambas zonas.
 * Métrica "Ingresos en el mes" usa metricCard (slate). Seguimiento y métrica ambas usan sky.
 */
export const PORTERIA_AMBAS_ZONAS_COLORS: PorteriaZoneColors = {
  metricCard:
    "border-[#6d8196]/40 bg-gradient-to-br from-[#6d8196]/15 via-[#6d8196]/10 to-white text-slate-900 shadow-sm shadow-[#6d8196]/25 dark:border-[#6d8196]/35 dark:from-[#6d8196]/20 dark:via-[#6d8196]/10 dark:to-slate-950/45 dark:text-slate-100 dark:shadow-sm dark:shadow-black/35",
  metricIcon:
    "bg-[#6d8196]/15 text-[#6d8196] ring-1 ring-[#6d8196]/25 dark:bg-[#6d8196]/25 dark:text-slate-100 dark:ring-[#6d8196]/35",
  ...PORTERIA_SKY_TRACKING_COLORS,
};

/** Celeste para métrica de visitantes en ambas zonas. */
export const PORTERIA_SKY_METRIC_COLORS = {
  metricCard:
    "border-sky-200/90 bg-gradient-to-br from-sky-50 via-sky-50/70 to-white text-sky-900 shadow-sm shadow-sky-200/30 dark:border-sky-800/70 dark:from-sky-950/60 dark:via-sky-900/35 dark:to-sky-950/45 dark:text-sky-100 dark:shadow-sm dark:shadow-sky-950/35",
  metricIcon:
    "bg-sky-100 text-sky-700 ring-1 ring-sky-200/50 dark:bg-sky-900/55 dark:text-sky-200 dark:ring-sky-700/45",
  ...PORTERIA_SKY_TRACKING_COLORS,
} as const;

/** Estilos del card de alerta por visitas sin salida de dias anteriores. */
export const PORTERIA_ALERT_COLORS = {
  metricCard:
    "border-red-200/90 bg-gradient-to-br from-red-50 via-red-50/70 to-white text-red-900 shadow-sm shadow-red-200/30 dark:border-red-800/70 dark:from-red-950/60 dark:via-red-900/35 dark:to-red-950/45 dark:text-red-100 dark:shadow-sm dark:shadow-red-950/35",
  metricIcon:
    "bg-red-100 text-red-700 ring-1 ring-red-200/50 dark:bg-red-900/55 dark:text-red-200 dark:ring-red-700/45",
} as const;
