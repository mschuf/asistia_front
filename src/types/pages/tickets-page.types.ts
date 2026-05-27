import type { AsistiaCategory, AsistiaLocation, AsistiaTicket, AsistiaTicketStatus } from "../asistia";

export type TicketsTab = "create" | "history";

export interface TicketFilterState {
  search: string;
  status: AsistiaTicketStatus | "";
  type: "incident" | "request" | "";
}

export interface UseTicketsResult {
  tab: TicketsTab;
  setTab: (tab: TicketsTab) => void;
  categories: AsistiaCategory[];
  locations: AsistiaLocation[];
  tickets: AsistiaTicket[];
  filteredTickets: AsistiaTicket[];
  filters: TicketFilterState;
  setFilters: (value: TicketFilterState) => void;
  loading: boolean;
  error: string;
  refreshTickets: () => Promise<void>;
  handleCreateTicket: (input: {
    type: "incident" | "request";
    subject: string;
    description: string;
    categoryId: number;
    locationId?: number;
    assignedTechnicianId?: number;
  }) => Promise<string>;
  handleStatusChange: (ticketId: number, status: AsistiaTicketStatus) => Promise<void>;
}
