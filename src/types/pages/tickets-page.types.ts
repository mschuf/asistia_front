import type {
  AsistiaCategory,
  AsistiaLocation,
  AsistiaTicket,
  AsistiaTicketStatus,
  AsistiaTicketType
} from "../asistia";

export type TicketsTab = "metricas" | "crear" | "historial";

export interface TicketFilterState {
  search: string;
  status: AsistiaTicketStatus | "";
  type: AsistiaTicketType | "";
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
    type: AsistiaTicketType;
    subject: string;
    description: string;
    categoryId: number;
    locationId?: number;
    assignedTechnicianId?: number;
  }) => Promise<string>;
  handleStatusChange: (ticketId: number, status: AsistiaTicketStatus) => Promise<void>;
}
