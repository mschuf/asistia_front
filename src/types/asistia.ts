export type AsistiaRole = "final_user" | "technician";

export type AsistiaTicketType = "incident" | "request";

export type AsistiaTicketStatus =
  | "new"
  | "assigned"
  | "planned"
  | "waiting"
  | "solved"
  | "closed";

export interface AuthUser {
  id: number;
  login: string;
  name: string;
  email: string | null;
  role: AsistiaRole;
  locationId: number | null;
  entityId?: number | null;
  entityName?: string | null;
  groupIds?: number[];
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: string;
  user: AuthUser;
}

export interface AsistiaCategory {
  id: number;
  name: string;
  fullPath: string;
  parentId: number | null;
  level: number;
}

export interface AsistiaLocation {
  id: number;
  name: string;
  fullPath: string;
  building: string | null;
  room: string | null;
}

export interface AsistiaUser {
  id: number;
  login: string;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  locationId: number | null;
  primaryGroupId: number | null;
  isActive: boolean;
}

export interface AsistiaTicketActor {
  id: number | null;
  name: string | null;
  email: string | null;
}

export interface AsistiaTicket {
  id: number;
  type: AsistiaTicketType;
  status: AsistiaTicketStatus;
  urgency: string;
  subject: string;
  description: string | null;
  category: { id: number; name: string } | null;
  location: { id: number | null; name: string | null } | null;
  requester: AsistiaTicketActor;
  technician: AsistiaTicketActor | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AsistiaTicketListResponse {
  items: AsistiaTicket[];
  total: number;
  page: number;
  limit: number;
}

export interface AsistiaUserListResponse {
  items: AsistiaUser[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateTicketInput {
  type: AsistiaTicketType;
  subject: string;
  description: string;
  categoryId: number;
  locationId?: number;
  assignedTechnicianId?: number;
  requesterId?: number;
}

export interface CreateTicketResponse extends AsistiaTicket {
  mail: { sent: boolean; error: string | null };
}
