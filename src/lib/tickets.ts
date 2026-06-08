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

export function statusLabel(status: AsistiaTicketStatus): string {
  return TICKET_STATUS_LABELS[status] ?? status;
}

export function typeLabel(type: AsistiaTicketType): string {
  return TICKET_TYPE_LABELS[type] ?? type;
}

export function urgencyLabel(urgency: string): string {
  return TICKET_URGENCY_LABELS[urgency] ?? urgency;
}

export function isTicketOpen(ticket: AsistiaTicket): boolean {
  return OPEN_STATUSES.includes(ticket.status);
}

export function isTicketInProgress(ticket: AsistiaTicket): boolean {
  return IN_PROGRESS_STATUSES.includes(ticket.status);
}

/** Mes calendario actual en UTC (alineado con el backend). */
export function isInCurrentMonth(isoDate: string | null): boolean {
  if (!isoDate) return false;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getUTCFullYear() === now.getUTCFullYear() && date.getUTCMonth() === now.getUTCMonth()
  );
}

export function formatOpenPercent(open: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((open / total) * 100);
}

export function isTicketClosed(ticket: AsistiaTicket): boolean {
  return ticket.status === "closed";
}

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

export function canTransitionTicketStatus(
  from: AsistiaTicketStatus,
  to: AsistiaTicketStatus
): boolean {
  if (from === to) return false;
  return ALLOWED_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isTicketOverdue(ticket: AsistiaTicket): boolean {
  if (!isTicketOpen(ticket)) return false;
  const reference = ticket.updatedAt ?? ticket.createdAt;
  if (!reference) return false;
  const date = new Date(reference);
  if (Number.isNaN(date.getTime())) return false;
  const days = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
  return days >= 7;
}

export function statusBadgeVariant(
  status: AsistiaTicketStatus
): "default" | "success" | "info" | "warning" {
  if (status === "closed") return "success";
  if (status === "solved") return "info";
  if (status === "waiting") return "warning";
  return "default";
}

export function buildCategoryOptions(
  categories: Array<{ id: number; name: string; fullPath: string }>
) {
  return categories.map((category) => ({
    value: String(category.id),
    label: category.fullPath || category.name,
    searchText: `${category.name} ${category.fullPath}`.toLowerCase(),
  }));
}

export function buildLocationOptions(
  locations: Array<{ id: number; name: string; fullPath: string }>
) {
  return locations.map((location) => ({
    value: String(location.id),
    label: locationDisplayName(location),
    searchText: `${location.name} ${location.fullPath}`.toLowerCase(),
  }));
}

export function buildLocationFilterOptions(
  locations: Array<{ id: number; name: string; fullPath: string }>
) {
  return buildLocationOptions(locations).sort((left, right) =>
    left.label.localeCompare(right.label, "es")
  );
}

export function locationDisplayName(location: { name: string; fullPath: string }): string {
  return location.name || location.fullPath;
}

export function locationCompanyName(locationName: string): string {
  const trimmed = locationName.trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0] ?? "";
}

export function categoryFirstWord(fullPath: string): string {
  const trimmed = fullPath.trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0] ?? "";
}

export function buildTicketDescriptionPrefix(
  type: AsistiaTicketType,
  category: { fullPath?: string; name?: string } | undefined,
): string {
  const typeText = typeLabel(type);
  if (!typeText) return "";

  const firstWord = categoryFirstWord(category?.fullPath ?? "");
  const prefixText = firstWord ? `${typeText} ${firstWord}` : typeText;
  return `<p>${prefixText}</p>`;
}

export function prependTicketDescriptionPrefix(
  description: string,
  type: AsistiaTicketType,
  category: { fullPath?: string; name?: string } | undefined,
): string {
  const prefix = buildTicketDescriptionPrefix(type, category);
  return prefix ? `${prefix}${description}` : description;
}

export function findLocationById(
  locations: Array<{ id: number; name: string; fullPath: string }>,
  locationId: number | null | undefined
) {
  if (!locationId) return null;
  const normalizedId = Number(locationId);
  if (!Number.isFinite(normalizedId) || normalizedId <= 0) return null;
  return locations.find((location) => location.id === normalizedId) ?? null;
}

export function buildRequesterDisplayLabel(
  user: { fullName: string; login: string; locationId: number | null },
  locations: Array<{ id: number; name: string; fullPath: string }>,
): string {
  const name = user.fullName || user.login;
  const location = findLocationById(locations, user.locationId);
  const locationName = location ? locationDisplayName(location) : null;
  return locationName ? `${name} (${locationName})` : name;
}

export function buildInitialTicketFilters(user: AuthUser | null): TicketFilterState {
  return {
    search: "",
    status: "",
    type: "",
    assignedToId: user?.role === "technician" ? String(user.id) : "",
    locationId: "",
  };
}

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

export function buildTechnicianFilterOptions(
  technicians: AsistiaUser[],
  currentUser: AuthUser | null
) {
  return [...technicians]
    .filter((technician) => technician.isActive)
    .sort((left, right) => left.fullName.localeCompare(right.fullName, "es"))
    .map((technician) => ({
      value: String(technician.id),
      label:
        currentUser?.id === technician.id ? `${technician.fullName} (yo)` : technician.fullName,
      searchText: `${technician.fullName} ${technician.login}`.toLowerCase(),
    }));
}
