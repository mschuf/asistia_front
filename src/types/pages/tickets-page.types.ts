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
  statusesPreset?: AsistiaTicketStatus[];
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
  goToHistorialWithFilters: (preset: TicketFilterState) => void;
  categories: AsistiaCategory[];
  locations: AsistiaLocation[];
  historyLocations: AsistiaLocation[];
  technicians: AsistiaUser[];
  tickets: AsistiaTicket[];
  pagination: TicketPaginationState;
  setPage: (page: number) => void;
  filters: TicketFilterState;
  setFilters: (value: TicketFilterState) => void;
  applyFilters: (filters?: TicketFilterState) => void;
  loading: boolean;
  catalogsLoading: boolean;
  locationsLoading: boolean;
  techniciansLoading: boolean;
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
    attachments?: File[];
  }) => Promise<void>;
  handleStatusChange: (
    ticketId: number,
    status: AsistiaTicketStatus,
    options?: { resolutionNote?: string }
  ) => Promise<boolean>;
  statusChanging: { ticketId: number; status: AsistiaTicketStatus } | null;
  handleAssignTicket: (
    ticketId: number,
    input: { technicianId?: number; locationId?: number }
  ) => Promise<boolean>;
  assigning: { ticketId: number } | null;
}
