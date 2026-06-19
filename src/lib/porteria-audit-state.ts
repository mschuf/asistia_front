/**
 * @file porteria-audit-state.ts
 * @description Etiquetas y formato legible para snapshots de auditoría de visitas.
 */
import type { VisitaEstado } from "@/api/visitas";
import { getHistoryEstadoLabel } from "@/lib/porteria";
import { VISITA_TARJETA_COLOR_LABELS, isVisitaTarjetaColor } from "@/lib/visita-tarjeta-color";

export type AuditFieldChangeKind = "unchanged" | "modified" | "added" | "removed";

/** Orden de campos para la comparación before/after. */
export const AUDIT_STATE_FIELD_ORDER = [
  "visitante",
  "documento",
  "empresa",
  "motivo",
  "responsableNombre",
  "estado",
  "estadoSeguimiento",
  "tarjetaColor",
  "credencialNumero",
  "zonasPermitidas",
  "entradaAt",
  "salidaAt",
  "observaciones",
  "id",
  "personaId",
  "createdAt",
  "updatedAt",
] as const;

export type AuditStateFieldKey = (typeof AUDIT_STATE_FIELD_ORDER)[number];

const AUDIT_FIELD_LABELS: Record<AuditStateFieldKey, string> = {
  visitante: "Visitante",
  documento: "Documento",
  empresa: "Empresa",
  motivo: "Motivo",
  responsableNombre: "Responsable",
  estado: "Estado",
  estadoSeguimiento: "Seguimiento",
  tarjetaColor: "Color de tarjeta",
  credencialNumero: "Nº credencial",
  zonasPermitidas: "Zonas permitidas",
  entradaAt: "Entrada",
  salidaAt: "Salida",
  observaciones: "Observaciones",
  id: "ID visita",
  personaId: "ID persona",
  createdAt: "Creado",
  updatedAt: "Actualizado",
};

const CHANGE_KIND_LABEL: Record<Exclude<AuditFieldChangeKind, "unchanged">, string> = {
  modified: "Modificado",
  added: "Nuevo",
  removed: "Eliminado",
};

/** ID reservado para acciones automáticas del sistema (sync sin salida, etc.). */
export const PORTERIA_AUDIT_SYSTEM_ACTOR_USER_ID = 0;

/** Etiqueta legible del actor sistema en auditoría. */
export const PORTERIA_AUDIT_SYSTEM_ACTOR_LABEL = "Sistema";

/**
 * @param actorUserId - ID del usuario que ejecutó la acción.
 * @param actorName - Nombre resuelto desde GLPI, si existe.
 * @returns Texto para columna Actor en auditoría.
 */
export function formatPorteriaAuditActorLabel(actorUserId: number, actorName: string | null): string {
  if (actorUserId === PORTERIA_AUDIT_SYSTEM_ACTOR_USER_ID) {
    return PORTERIA_AUDIT_SYSTEM_ACTOR_LABEL;
  }
  if (actorName) {
    return `${actorName} (#${actorUserId})`;
  }
  return `#${actorUserId}`;
}

/** @param field - Clave del snapshot. @returns Etiqueta legible para UI. */
export function getAuditFieldLabel(field: string): string {
  return AUDIT_FIELD_LABELS[field as AuditStateFieldKey] ?? field;
}

/** @param kind - Tipo de cambio del campo. @returns Etiqueta corta para badge. */
export function getAuditChangeKindLabel(kind: Exclude<AuditFieldChangeKind, "unchanged">): string {
  return CHANGE_KIND_LABEL[kind];
}

function isEmptyAuditValue(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

function formatAuditDate(value: unknown): string {
  if (typeof value !== "string" || !value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** @param field - Clave del snapshot. @param value - Valor crudo. @returns Texto legible. */
export function formatAuditFieldValue(field: string, value: unknown): string {
  if (isEmptyAuditValue(value)) return "—";

  if (field === "estado" && typeof value === "string") {
    return getHistoryEstadoLabel(value as VisitaEstado);
  }

  if (field === "estadoSeguimiento" && typeof value === "string") {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  if (field === "tarjetaColor" && isVisitaTarjetaColor(value)) {
    return VISITA_TARJETA_COLOR_LABELS[value];
  }

  if (field === "zonasPermitidas" && Array.isArray(value)) {
    return value.map(String).join(", ");
  }

  if (field === "entradaAt" || field === "salidaAt" || field === "createdAt" || field === "updatedAt") {
    return formatAuditDate(value);
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

/** @returns Claves ordenadas presentes en before o after. */
export function collectAuditStateFields(
  beforeState: Record<string, unknown> | null,
  afterState: Record<string, unknown> | null,
): string[] {
  const keys = new Set<string>([
    ...Object.keys(beforeState ?? {}),
    ...Object.keys(afterState ?? {}),
  ]);

  const ordered = AUDIT_STATE_FIELD_ORDER.filter((key) => keys.has(key));
  const extras = [...keys].filter((key) => !AUDIT_STATE_FIELD_ORDER.includes(key as AuditStateFieldKey)).sort();
  return [...ordered, ...extras];
}

/**
 * Clasifica el cambio de un campo entre dos snapshots.
 * @param field - Clave del campo.
 * @param beforeState - Snapshot anterior.
 * @param afterState - Snapshot posterior.
 * @param changedFields - Campos reportados por backend.
 */
export function resolveAuditFieldChangeKind(
  field: string,
  beforeState: Record<string, unknown> | null,
  afterState: Record<string, unknown> | null,
  changedFields: string[],
): AuditFieldChangeKind {
  if (!beforeState && afterState) return "added";
  if (beforeState && !afterState) return "removed";
  if (!changedFields.includes(field)) return "unchanged";

  const beforeValue = beforeState?.[field];
  const afterValue = afterState?.[field];

  if (isEmptyAuditValue(beforeValue) && !isEmptyAuditValue(afterValue)) return "added";
  if (!isEmptyAuditValue(beforeValue) && isEmptyAuditValue(afterValue)) return "removed";
  return "modified";
}
