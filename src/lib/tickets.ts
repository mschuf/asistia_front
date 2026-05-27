import type { AsistiaTicket, AsistiaTicketStatus, AsistiaTicketType } from "@/types/asistia";
import { TICKET_STATUS_LABELS, TICKET_TYPE_LABELS } from "@/lib/constants";

const OPEN_STATUSES: AsistiaTicketStatus[] = ["new", "assigned", "planned", "waiting"];

export function statusLabel(status: AsistiaTicketStatus): string {
  return TICKET_STATUS_LABELS[status] ?? status;
}

export function typeLabel(type: AsistiaTicketType): string {
  return TICKET_TYPE_LABELS[type] ?? type;
}

export function isTicketOpen(ticket: AsistiaTicket): boolean {
  return OPEN_STATUSES.includes(ticket.status);
}

export function isTicketClosed(ticket: AsistiaTicket): boolean {
  return ticket.status === "closed";
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
    label: location.fullPath || location.name,
    searchText: `${location.name} ${location.fullPath}`.toLowerCase(),
  }));
}
