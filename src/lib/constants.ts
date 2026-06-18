/**
 * @file constants.ts
 * @description Etiquetas en español para estados, tipos y urgencias de tickets en la UI.
 */

/** Mapa de códigos de estado de ticket a etiquetas legibles. */
export const TICKET_STATUS_LABELS: Record<string, string> = {
  new: "Nuevo",
  assigned: "En curso asignada",
  planned: "En curso planificada",
  waiting: "En espera",
  solved: "Resuelto",
  closed: "Cerrado"
};

/** Mapa de tipos de ticket a etiquetas legibles. */
export const TICKET_TYPE_LABELS: Record<string, string> = {
  incident: "Incidente",
  request: "Solicitud",
  requirement: "Requerimiento"
};

/** Mapa de niveles de urgencia de ticket a etiquetas legibles. */
export const TICKET_URGENCY_LABELS: Record<string, string> = {
  very_low: "Muy baja",
  low: "Baja",
  medium: "Media",
  high: "Alta",
  very_high: "Muy alta"
};
