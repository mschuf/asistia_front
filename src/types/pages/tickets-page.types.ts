import type {
  AsistiaCategory,
  AsistiaLocation,
  AsistiaTicket,
  AsistiaTicketStatus,
  AsistiaTicketType,
  AsistiaUser
} from "../asistia";

export type TicketsTab = "metricas" | "crear" | "historial";

export interface TicketFilterState {
  search: string;
  status: AsistiaTicketStatus | "";
  type: AsistiaTicketType | "";
  assignedToId: string;
  locationId: string;
}

export interface TicketPaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UseTicketsOptions {
  onTicketCreated?: (ticketId: number) => void | Promise<void>;
}

export interface UseTicketsResult {
  tab: TicketsTab;
  setTab: (tab: TicketsTab) => void;
  categories: AsistiaCategory[];
  locations: AsistiaLocation[];
  technicians: AsistiaUser[];
  tickets: AsistiaTicket[];
  pagination: TicketPaginationState;
  setPage: (page: number) => void;
  filters: TicketFilterState;
  setFilters: (value: TicketFilterState) => void;
  loading: boolean;
  catalogsLoading: boolean;
  error: string;
  catalogsError: string;
  techniciansError: string;
  refreshTickets: () => Promise<void>;
  handleCreateTicket: (input: {
    type: AsistiaTicketType;
    subject: string;
    description: string;
    categoryId: number;
    locationId?: number;
    assignedTechnicianId?: number;
    requesterId?: number;
  }) => Promise<void>;
  handleStatusChange: (ticketId: number, status: AsistiaTicketStatus) => Promise<void>;
  statusChanging: { ticketId: number; status: AsistiaTicketStatus } | null;
}
