/**
 * @file tickets.ts
 * @description Utilidades de dominio para tickets: estados, filtros, etiquetas y transiciones.
 */
import type { AsistiaTicket, AsistiaTicketStatus, AsistiaTicketType, AsistiaUser } from "@/types/asistia";
import type { AuthUser } from "@/types/auth";
import type { TicketFilterState } from "@/types/pages/tickets-page.types";
import { TICKET_STATUS_LABELS, TICKET_TYPE_LABELS, TICKET_URGENCY_LABELS } from "@/lib/constants";

export const OPEN_STATUSES: AsistiaTicketStatus[] = ["new", "assigned", "planned", "waiting"];

export const IN_PROGRESS_STATUSES: AsistiaTicketStatus[] = ["assigned", "planned", "waiting"];

/** Estados mostrados por defecto en la tabla de historial. */
export const HISTORY_TABLE_STATUSES: AsistiaTicketStatus[] = ["assigned", "planned"];

/** Tamaño de página del historial (alineado con el máximo del backend). */
export const TICKETS_PAGE_SIZE = 15;

/** @param status - Estado del ticket. @returns Etiqueta legible en español. */
export function statusLabel(status: AsistiaTicketStatus): string {
  return TICKET_STATUS_LABELS[status] ?? status;
}

/** @param type - Tipo de ticket. @returns Etiqueta legible en español. */
export function typeLabel(type: AsistiaTicketType): string {
  return TICKET_TYPE_LABELS[type] ?? type;
}

/** @param urgency - Código de urgencia. @returns Etiqueta legible o el código original. */
export function urgencyLabel(urgency: string): string {
  return TICKET_URGENCY_LABELS[urgency] ?? urgency;
}

/** @param ticket - Ticket a evaluar. @returns `true` si el estado es abierto. */
export function isTicketOpen(ticket: AsistiaTicket): boolean {
  return OPEN_STATUSES.includes(ticket.status);
}

/** @param ticket - Ticket a evaluar. @returns `true` si está en progreso. */
export function isTicketInProgress(ticket: AsistiaTicket): boolean {
  return IN_PROGRESS_STATUSES.includes(ticket.status);
}

/** @param isoDate - Fecha ISO. @returns `true` si cae en el mes UTC actual. */
export function isInCurrentMonth(isoDate: string | null): boolean {
  if (!isoDate) return false;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getUTCFullYear() === now.getUTCFullYear() && date.getUTCMonth() === now.getUTCMonth()
  );
}

/** @param open - Cantidad abierta. @param total - Total del mes. @returns Porcentaje redondeado. */
export function formatOpenPercent(open: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((open / total) * 100);
}

/** @param ticket - Ticket a evaluar. @returns `true` si está cerrado. */
export function isTicketClosed(ticket: AsistiaTicket): boolean {
  return ticket.status === "closed";
}

/** @param ticket - Ticket a evaluar. @returns `true` si está resuelto o cerrado. */
export function isTicketFinalized(ticket: AsistiaTicket): boolean {
  return ticket.status === "solved" || ticket.status === "closed";
}

const ALLOWED_STATUS_TRANSITIONS: Record<AsistiaTicketStatus, AsistiaTicketStatus[]> = {
  new: ["assigned", "waiting", "planned", "solved", "closed"],
  assigned: ["planned", "waiting", "solved", "closed"],
  planned: ["assigned", "waiting", "solved", "closed"],
  waiting: ["assigned", "planned", "solved", "closed"],
  solved: ["closed", "assigned"],
  closed: [],
};

/**
 * Valida si una transición de estado está permitida.
 * @param from - Estado actual.
 * @param to - Estado destino.
 * @returns `true` si la transición es válida.
 */
export function canTransitionTicketStatus(
  from: AsistiaTicketStatus,
  to: AsistiaTicketStatus
): boolean {
  if (from === to) return false;
  return ALLOWED_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** @param ticket - Ticket abierto. @returns `true` si lleva 7+ días sin actualizar. */
export function isTicketOverdue(ticket: AsistiaTicket): boolean {
  if (!isTicketOpen(ticket)) return false;
  const reference = ticket.updatedAt ?? ticket.createdAt;
  if (!reference) return false;
  const date = new Date(reference);
  if (Number.isNaN(date.getTime())) return false;
  const days = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  return days >= 7;
}

/** @param status - Estado del ticket. @returns Variante visual del badge. */
export function statusBadgeVariant(
  status: AsistiaTicketStatus
): "default" | "success" | "info" | "warning" {
  if (status === "closed") return "success";
  if (status === "solved") return "info";
  if (status === "waiting") return "warning";
  return "default";
}

/** @param categories - Catálogo de categorías. @returns Opciones para SearchableSelect. */
export function buildCategoryOptions(
  categories: Array<{ id: number; name: string; fullPath: string }>
) {
  return categories.map((category) => ({
    value: String(category.id),
    label: category.fullPath || category.name,
    searchText: `${category.name} ${category.fullPath}`.toLowerCase(),
  }));
}

/** @param locations - Catálogo de sedes. @returns Opciones para SearchableSelect. */
export function buildLocationOptions(
  locations: Array<{ id: number; name: string; fullPath: string }>
) {
  return locations.map((location) => ({
    value: String(location.id),
    label: locationDisplayName(location),
    searchText: `${location.name} ${location.fullPath}`.toLowerCase(),
  }));
}

/** @param locations - Catálogo de sedes. @returns Opciones ordenadas alfabéticamente. */
export function buildLocationFilterOptions(
  locations: Array<{ id: number; name: string; fullPath: string }>
) {
  return buildLocationOptions(locations).sort((left, right) =>
    left.label.localeCompare(right.label, "es")
  );
}

/** @param location - Sede con nombre y ruta. @returns Nombre visible de la sede. */
export function locationDisplayName(location: { name: string; fullPath: string }): string {
  return location.name || location.fullPath;
}

/** @param locationName - Nombre de sede. @returns Primera palabra (empresa). */
export function locationCompanyName(locationName: string): string {
  const trimmed = locationName.trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0] ?? "";
}

/** @param fullPath - Ruta completa de categoría. @returns Primera palabra. */
export function categoryFirstWord(fullPath: string): string {
  const trimmed = fullPath.trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0] ?? "";
}

const TICKET_DESCRIPTION_PREFIX_PATTERN = /^<p>(?:Incidente|Solicitud)(?: [^<]*)?<\/p>/;

/** @param type - Tipo de ticket. @param category - Categoría seleccionada. @returns Texto plano del prefijo. */
export function buildTicketDescriptionPrefixText(
  type: AsistiaTicketType,
  category: { fullPath?: string; name?: string } | null | undefined,
): string {
  const typeText = typeLabel(type);
  if (!typeText) return "";

  const firstWord = categoryFirstWord(category?.fullPath ?? "");
  return firstWord ? `${typeText} ${firstWord}` : typeText;
}

/** @param type - Tipo de ticket. @param category - Categoría seleccionada. @returns Prefijo HTML para la descripción. */
export function buildTicketDescriptionPrefix(
  type: AsistiaTicketType,
  category: { fullPath?: string; name?: string } | null | undefined,
): string {
  const prefixText = buildTicketDescriptionPrefixText(type, category);
  return prefixText ? `<p>${prefixText}</p>` : "";
}

/** @param body - Texto libre de la descripción. @param type - Tipo de ticket. @param category - Categoría. @returns Descripción con prefijo visible. */
export function applyTicketDescriptionPrefix(
  body: string,
  type: AsistiaTicketType,
  category: { fullPath?: string; name?: string } | null | undefined,
): string {
  const prefix = buildTicketDescriptionPrefix(type, category);
  return prefix ? `${prefix}${body}` : body;
}

/**
 * Extrae el contenido editable de la descripción quitando el prefijo automático.
 * @param description - HTML completo del editor.
 * @param type - Tipo de ticket.
 * @param category - Categoría seleccionada.
 * @returns Cuerpo de la descripción sin prefijo.
 */
export function extractTicketDescriptionBody(
  description: string,
  type: AsistiaTicketType,
  category: { fullPath?: string; name?: string } | null | undefined,
): string {
  const prefix = buildTicketDescriptionPrefix(type, category);
  if (prefix && description.startsWith(prefix)) {
    return description.slice(prefix.length);
  }

  const match = description.match(TICKET_DESCRIPTION_PREFIX_PATTERN);
  if (match) {
    return description.slice(match[0].length);
  }

  return description;
}

/** @param locations - Catálogo de sedes. @param locationId - ID buscado. @returns Sede encontrada o null. */
export function findLocationById(
  locations: Array<{ id: number; name: string; fullPath: string }>,
  locationId: number | null | undefined
) {
  if (!locationId) return null;
  const normalizedId = Number(locationId);
  if (!Number.isFinite(normalizedId) || normalizedId <= 0) return null;
  return locations.find((location) => location.id === normalizedId) ?? null;
}

/** @param user - Usuario solicitante. @param locations - Catálogo de sedes. @returns Etiqueta "Nombre (Sede)". */
export function buildRequesterDisplayLabel(
  user: { fullName: string; login: string; locationId: number | null },
  locations: Array<{ id: number; name: string; fullPath: string }>,
): string {
  const name = user.fullName || user.login;
  const location = findLocationById(locations, user.locationId);
  const locationName = location ? locationDisplayName(location) : null;
  return locationName ? `${name} (${locationName})` : name;
}

/** @param user - Usuario autenticado o null. @returns Filtros iniciales del historial. */
export function buildInitialTicketFilters(user: AuthUser | null): TicketFilterState {
  return {
    search: "",
    status: "",
    type: "",
    assignedToId: user?.role === "technician" ? String(user.id) : "",
    locationId: "",
  };
}

/** @param user - Usuario autenticado. @returns Preset de historial por sede o null. */
export function buildSiteHistorialFilters(user: AuthUser | null): TicketFilterState | null {
  if (!user?.locationId) return null;
  return {
    search: "",
    status: "",
    type: "",
    assignedToId: "",
    locationId: String(user.locationId),
    statusesPreset: [...OPEN_STATUSES],
  };
}

/** @param technicians - Lista de técnicos. @returns Técnicos activos ordenados por nombre. */
export function listActiveTechnicians(technicians: AsistiaUser[]): AsistiaUser[] {
  return [...technicians]
    .filter((technician) => technician.isActive)
    .sort((left, right) => left.fullName.localeCompare(right.fullName, "es"));
}

/** @param technicians - Lista de técnicos. @param locations - Catálogo de sedes. @returns Opciones del selector excluyendo inactivos. */
export function buildTechnicianSelectOptions(
  technicians: AsistiaUser[],
  locations: Array<{ id: number; name: string; fullPath: string }> = [],
) {
  return listActiveTechnicians(technicians).map((technician) => {
    const location = findLocationById(locations, technician.locationId);
    const locationName = location ? locationDisplayName(location) : "";
    return {
      value: String(technician.id),
      label: buildRequesterDisplayLabel(technician, locations),
      searchText:
        `${technician.fullName} ${technician.login} ${technician.email ?? ""} ${locationName}`.toLowerCase(),
    };
  });
}

/** @param technicians - Lista de técnicos. @param currentUser - Usuario actual. @param locations - Catálogo de sedes. @returns Opciones de filtro por técnico. */
export function buildTechnicianFilterOptions(
  technicians: AsistiaUser[],
  currentUser: AuthUser | null,
  locations: Array<{ id: number; name: string; fullPath: string }> = [],
) {
  return listActiveTechnicians(technicians).map((technician) => {
    const location = findLocationById(locations, technician.locationId);
    const locationName = location ? locationDisplayName(location) : "";
    const baseLabel = buildRequesterDisplayLabel(technician, locations);
    const label = currentUser?.id === technician.id ? `${baseLabel} (yo)` : baseLabel;
    return {
      value: String(technician.id),
      label,
      searchText: `${technician.fullName} ${technician.login} ${locationName}`.toLowerCase(),
    };
  });
}
