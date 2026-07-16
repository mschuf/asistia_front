/**
 * @file tickets.ts
 * @description Utilidades de dominio para tickets: estados, filtros, etiquetas y transiciones.
 */
import type { AsistiaTicket, AsistiaTicketStatus, AsistiaTicketType, AsistiaUser } from "@/types/asistia";
import type { AuthUser } from "@/types/auth";
import { hasTechnicianAccess } from "@/utils/auth-access";
import type { TicketFilterState } from "@/types/pages/tickets-page.types";
import { TICKET_STATUS_LABELS, TICKET_TYPE_LABELS, TICKET_URGENCY_LABELS } from "@/lib/constants";
import { stripHtml } from "@/lib/utils";

export const OPEN_STATUSES: AsistiaTicketStatus[] = ["new", "assigned", "planned", "waiting"];

/** Usuario de servicio que representa tickets pendientes de asignación humana. */
export const ASISTIA_UNASSIGNED_TECHNICIAN_ID = 1368;

export const IN_PROGRESS_STATUSES: AsistiaTicketStatus[] = ["assigned", "planned", "waiting"];

/** Estados mostrados por defecto en la tabla de historial. */
export const HISTORY_TABLE_STATUSES: AsistiaTicketStatus[] = ["assigned", "planned"];

/** Valor del selector de estado que incluye todos los estados. */
export const TICKET_STATUS_FILTER_ALL = "all" as const;

/** Opciones de tamaño de página disponibles en la tabla de historial. */
export const TICKETS_PAGE_SIZE_OPTIONS = [15, 50, 100] as const;

/** Tamaño de página por defecto del historial. */
export const TICKETS_PAGE_SIZE = TICKETS_PAGE_SIZE_OPTIONS[0];

/** Valor del selector que muestra todos los registros en una sola página. */
export const TICKETS_PAGE_SIZE_ALL = "all" as const;

/**
 * Ancho mínimo de la tabla de historial dentro de su contenedor con scroll horizontal.
 */
export const TICKETS_HISTORIAL_LAYOUT_MIN_WIDTH_PX = 1120;
export const TICKETS_HISTORIAL_LAYOUT_MIN_WIDTH_CLASS = "min-w-[76rem]";
/** Ancho mínimo de la grilla de filtros avanzados solo en viewports anchos (>= 1120px). */
export const TICKETS_HISTORIAL_FILTERS_WIDE_CLASS = "min-w-0 min-[1120px]:min-w-[70rem]";
/** Scroll horizontal de filtros avanzados solo cuando la grilla ancha está activa. */
export const TICKETS_HISTORIAL_FILTERS_SCROLL_CLASS = "overflow-visible min-[1120px]:overflow-x-auto";

/** Tope de registros al elegir "Todos" (alineado con exportación del reporte). */
export const TICKETS_LIST_ALL_MAX = 50_000;

/** Tamaño de página numérico o modo "todos". */
export type TicketsPageSize =
  | (typeof TICKETS_PAGE_SIZE_OPTIONS)[number]
  | typeof TICKETS_PAGE_SIZE_ALL;

/** @param limit - Tamaño de página UI. @returns `true` si el modo es "todos". */
export function isTicketsAllPageSize(
  limit: TicketsPageSize,
): limit is typeof TICKETS_PAGE_SIZE_ALL {
  return limit === TICKETS_PAGE_SIZE_ALL;
}

/**
 * Resuelve el `limit` enviado al API según la selección UI.
 * @param limit - Tamaño elegido en el selector.
 * @param total - Total de registros del listado actual.
 * @returns Límite numérico para la petición.
 */
export function resolveTicketsApiLimit(limit: TicketsPageSize, total: number): number {
  if (isTicketsAllPageSize(limit)) {
    return Math.min(Math.max(total, TICKETS_PAGE_SIZE), TICKETS_LIST_ALL_MAX);
  }
  return limit;
}

/** @param limit - Valor candidato del selector. @returns `true` si es una opción válida. */
export function isValidTicketsPageSize(limit: unknown): limit is TicketsPageSize {
  if (limit === TICKETS_PAGE_SIZE_ALL) return true;
  return (
    typeof limit === "number" &&
    (TICKETS_PAGE_SIZE_OPTIONS as readonly number[]).includes(limit)
  );
}

/** @param value - Valor del `<select>`. @returns Tamaño parseado o `null` si no es válido. */
export function parseTicketsPageSize(value: string): TicketsPageSize | null {
  if (value === TICKETS_PAGE_SIZE_ALL) return TICKETS_PAGE_SIZE_ALL;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const candidate = parsed as TicketsPageSize;
  return isValidTicketsPageSize(candidate) ? candidate : null;
}

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

/**
 * Categoría (completename) usada como título visible del ticket.
 * @param ticket - Ticket a mostrar.
 * @returns Nombre de categoría o guion si no hay.
 */
export function ticketCategoryTitle(ticket: AsistiaTicket): string {
  return ticket.category?.name?.trim() || "—";
}

/**
 * Tag efectivo a mostrar entre corchetes. Se omite cuando coincide con la
 * categoría (tickets antiguos donde name == categoría) o está vacío.
 * @param ticket - Ticket a evaluar.
 * @returns Tag corto o `null` si no aplica.
 */
export function getTicketTag(ticket: AsistiaTicket): string | null {
  const tag = ticket.tag?.trim();
  if (!tag) return null;
  // Los tags reales están limitados a 15 caracteres; un valor más largo es un
  // título heredado (categoría/inbound) y no debe mostrarse como tag.
  if (tag.length > 15) return null;
  const category = ticket.category?.name?.trim();
  if (category && tag === category) return null;
  return tag;
}

/**
 * Título visible de un ticket: Categoría y, si existe, `[TAG]` concatenado.
 * @param ticket - Ticket a mostrar.
 * @returns Texto "Categoría [TAG]" o solo la categoría.
 */
export function formatTicketTitle(ticket: AsistiaTicket): string {
  const category = ticketCategoryTitle(ticket);
  const tag = getTicketTag(ticket);
  return tag ? `${category} [${tag}]` : category;
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
const TICKET_DESCRIPTION_CATEGORY_SUFFIX = "\u00A0";

/** @param html - Fragmento HTML de descripción. @returns HTML con entidades normalizadas. */
function normalizeDescriptionHtml(html: string): string {
  return html.replace(/&nbsp;/gi, TICKET_DESCRIPTION_CATEGORY_SUFFIX);
}

/** @param type - Tipo de ticket. @param category - Categoría seleccionada. @returns Texto plano del prefijo. */
export function buildTicketDescriptionPrefixText(
  type: AsistiaTicketType,
  category: { fullPath?: string; name?: string } | null | undefined,
): string {
  const typeText = typeLabel(type);
  if (!typeText) return "";

  const firstWord = categoryFirstWord(category?.fullPath ?? "");
  return firstWord
    ? `${typeText} ${firstWord}${TICKET_DESCRIPTION_CATEGORY_SUFFIX}`
    : typeText;
}

/** @param type - Tipo de ticket. @param category - Categoría seleccionada. @returns Prefijo HTML para la descripción. */
export function buildTicketDescriptionPrefix(
  type: AsistiaTicketType,
  category: { fullPath?: string; name?: string } | null | undefined,
): string {
  const prefixText = buildTicketDescriptionPrefixText(type, category);
  if (!prefixText) return "";

  const htmlText = prefixText.endsWith(TICKET_DESCRIPTION_CATEGORY_SUFFIX)
    ? `${prefixText.slice(0, -1)}&nbsp;`
    : prefixText;
  return `<p>${htmlText}</p>`;
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

/** @param type - Tipo de ticket. @returns Descripción inicial con prefijo automático. */
export function createDefaultTicketDescription(type: AsistiaTicketType = "request"): string {
  return applyTicketDescriptionPrefix("", type, null);
}

/** @param description - HTML completo. @param type - Tipo de ticket. @param category - Categoría. @returns Si incluye el prefijo automático. */
export function hasTicketDescriptionPrefix(
  description: string,
  type: AsistiaTicketType,
  category: { fullPath?: string; name?: string } | null | undefined,
): boolean {
  const prefix = buildTicketDescriptionPrefix(type, category);
  const normalizedDescription = normalizeDescriptionHtml(description);
  const normalizedPrefix = normalizeDescriptionHtml(prefix);
  if (normalizedPrefix && normalizedDescription.startsWith(normalizedPrefix)) {
    return true;
  }
  return TICKET_DESCRIPTION_PREFIX_PATTERN.test(normalizedDescription);
}

/**
 * Contenido a validar (longitud mínima): cuerpo sin prefijo si aún está presente, o texto completo.
 * @param description - HTML completo del editor.
 * @param type - Tipo de ticket.
 * @param category - Categoría seleccionada.
 * @returns Texto plano que debe cumplir la validación.
 */
export function getTicketDescriptionValidationContent(
  description: string,
  type: AsistiaTicketType,
  category: { fullPath?: string; name?: string } | null | undefined,
): string {
  const plain = stripHtml(description);

  if (!hasTicketDescriptionPrefix(description, type, category)) {
    return plain;
  }

  const prefixCandidates = [
    buildTicketDescriptionPrefixText(type, category),
    buildTicketDescriptionPrefixText(type, null),
  ].filter((value, index, array) => value.length > 0 && array.indexOf(value) === index);

  for (const prefixText of prefixCandidates) {
    if (plain.startsWith(prefixText)) {
      return plain.slice(prefixText.length).trimStart();
    }
  }

  return plain;
}

/**
 * Actualiza el prefijo al cambiar tipo o categoría. No modifica la descripción si el usuario quitó el prefijo.
 * @param description - HTML actual del editor.
 * @param oldType - Tipo anterior.
 * @param oldCategory - Categoría anterior.
 * @param newType - Tipo nuevo.
 * @param newCategory - Categoría nueva.
 * @returns Descripción con prefijo actualizado o sin cambios.
 */
export function updateTicketDescriptionPrefix(
  description: string,
  oldType: AsistiaTicketType,
  oldCategory: { fullPath?: string; name?: string } | null | undefined,
  newType: AsistiaTicketType,
  newCategory: { fullPath?: string; name?: string } | null | undefined,
): string {
  if (!description.trim()) {
    return applyTicketDescriptionPrefix("", newType, newCategory);
  }
  if (!hasTicketDescriptionPrefix(description, oldType, oldCategory)) {
    return description;
  }
  const body = extractTicketDescriptionBody(description, oldType, oldCategory);
  return applyTicketDescriptionPrefix(body, newType, newCategory);
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
  const normalizedDescription = normalizeDescriptionHtml(description);
  const normalizedPrefix = normalizeDescriptionHtml(prefix);
  if (normalizedPrefix && normalizedDescription.startsWith(normalizedPrefix)) {
    return normalizedDescription.slice(normalizedPrefix.length);
  }

  const match = normalizedDescription.match(TICKET_DESCRIPTION_PREFIX_PATTERN);
  if (match) {
    return normalizedDescription.slice(match[0].length);
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
  const isTechnician = hasTechnicianAccess(user);
  return {
    search: "",
    status: "",
    type: "",
    assignedToId: isTechnician && user?.id != null ? String(user.id) : "",
    requesterId: "",
    locationId: !isTechnician && user?.locationId != null ? String(user.locationId) : "",
    createdFrom: "",
    createdTo: "",
    involvingMe: undefined,
  };
}

/** Convierte input type="date" (YYYY-MM-DD) al inicio del día local en ISO8601. */
export function toApiDateFrom(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

/** Convierte input type="date" (YYYY-MM-DD) al fin del día local en ISO8601. */
export function toApiDateTo(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = new Date(`${trimmed}T23:59:59.999`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

/** @param user - Usuario autenticado. @returns Preset de historial por sede o null. */
export function buildSiteHistorialFilters(user: AuthUser | null): TicketFilterState | null {
  if (!user?.locationId) return null;
  return {
    search: "",
    status: "",
    type: "",
    assignedToId: "",
    requesterId: "",
    locationId: String(user.locationId),
    createdFrom: "",
    createdTo: "",
    involvingMe: false,
    statusesPreset: [...OPEN_STATUSES],
  };
}

/** @param status - Estado de ticket. @returns Preset de historial filtrado por estado. */
export function buildStatusHistorialFilters(
  status: "solved" | "closed",
): TicketFilterState {
  return {
    search: "",
    status,
    type: "",
    assignedToId: "",
    requesterId: "",
    locationId: "",
    createdFrom: "",
    createdTo: "",
  };
}

/** @returns Preset de historial del equipo (Estado Abiertos, sin filtros de actor/sede). */
export function buildMyGroupHistorialFilters(): TicketFilterState {
  return {
    search: "",
    status: "",
    type: "",
    assignedToId: "",
    requesterId: "",
    locationId: "",
    createdFrom: "",
    createdTo: "",
    involvingMe: false,
  };
}

/** @param locationId - ID de sede. @returns Preset de historial filtrado por esa sede. */
export function buildLocationHistorialFilters(locationId: number): TicketFilterState {
  return {
    search: "",
    status: "",
    type: "",
    assignedToId: "",
    requesterId: "",
    locationId: String(locationId),
    createdFrom: "",
    createdTo: "",
    involvingMe: false,
    statusesPreset: [...OPEN_STATUSES],
  };
}

/** @param technicianId - ID del técnico asignado. @returns Preset de historial filtrado por ese técnico. */
export function buildAssigneeHistorialFilters(technicianId: number): TicketFilterState {
  return {
    search: "",
    status: "",
    type: "",
    assignedToId: String(technicianId),
    requesterId: "",
    locationId: "",
    createdFrom: "",
    createdTo: "",
    involvingMe: false,
    statusesPreset: [...OPEN_STATUSES],
  };
}

/** @returns Preset de tickets abiertos asignados al usuario de servicio asistIA. */
export function buildUnassignedHistorialFilters(): TicketFilterState {
  return {
    search: "",
    status: "",
    type: "",
    assignedToId: String(ASISTIA_UNASSIGNED_TECHNICIAN_ID),
    requesterId: "",
    locationId: "",
    createdFrom: "",
    createdTo: "",
    involvingMe: false,
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
