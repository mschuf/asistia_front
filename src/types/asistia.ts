/**
 * @file asistia.ts
 * @description Tipos de dominio de Asistia: usuarios, tickets, catálogos, métricas y respuestas de API.
 */

/** Rol de usuario en el sistema Asistia. */
export type AsistiaRole = "final_user" | "technician";

/** Tipo de ticket: incidente o solicitud. */
export type AsistiaTicketType = "incident" | "request";

/** Estado del ciclo de vida de un ticket. */
export type AsistiaTicketStatus =
  | "new"
  | "assigned"
  | "planned"
  | "waiting"
  | "solved"
  | "closed";

/** Usuario autenticado con datos de sesión y permisos. */
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
  isSuperAdmin?: boolean;
}

/** Credenciales enviadas al endpoint de login. */
export interface LoginPayload {
  username: string;
  password: string;
}

/** Respuesta exitosa del login con usuario y tiempo de expiración. */
export interface LoginResponse {
  expiresIn: string;
  user: AuthUser;
}

/** Estado de sesión activa con fecha de expiración en epoch. */
export interface SessionResponse {
  user: AuthUser;
  expiresAt: number;
}

/** Categoría jerárquica de tickets. */
export interface AsistiaCategory {
  id: number;
  name: string;
  fullPath: string;
  parentId: number | null;
  level: number;
}

/** Ubicación física asociada a tickets o usuarios. */
export interface AsistiaLocation {
  id: number;
  name: string;
  fullPath: string;
  building: string | null;
  room: string | null;
}

/** Usuario del directorio Asistia (técnico o solicitante). */
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

/** Actor involucrado en un ticket (solicitante o técnico). */
export interface AsistiaTicketActor {
  id: number | null;
  name: string | null;
  email: string | null;
}

/** Ticket con relaciones resumidas de categoría, ubicación y actores. */
export interface AsistiaTicket {
  id: number;
  type: AsistiaTicketType;
  status: AsistiaTicketStatus;
  urgency: string;
  subject: string;
  /** Tag corto (glpi_tickets.name). Se muestra entre corchetes junto a la categoría. */
  tag: string | null;
  description: string | null;
  category: { id: number; name: string } | null;
  /** Software seleccionado al crear tickets de categoría Software. */
  software?: { id: number; name: string } | null;
  location: { id: number | null; name: string | null } | null;
  requester: AsistiaTicketActor;
  technician: AsistiaTicketActor | null;
  createdAt: string | null;
  updatedAt: string | null;
  solvedAt: string | null;
  closedAt: string | null;
}

/** Respuesta paginada de listado de tickets. */
export interface AsistiaTicketListResponse {
  items: AsistiaTicket[];
  total: number;
  page: number;
  limit: number;
}

/** Respuesta paginada de listado de usuarios. */
export interface AsistiaUserListResponse {
  items: AsistiaUser[];
  total: number;
  page: number;
  limit: number;
}

/** Datos mínimos para crear un ticket. */
export interface CreateTicketInput {
  type: AsistiaTicketType;
  subject: string;
  /** Tag corto opcional (glpi_tickets.name), máx. 15 caracteres. Solo lo envía TI/super admin. */
  tag?: string;
  description: string;
  categoryId: number;
  requestTypeId?: number;
  locationId?: number;
  assignedTechnicianId?: number;
  requesterId?: number;
}

/** Respuesta mínima de POST /tickets. El detalle se obtiene vía list/GET. */
export interface CreateTicketResponse {
  id: number;
  subject: string;
  mail: { sent: boolean; error: string | null };
}

/** Archivo adjunto asociado a un ticket. */
export interface TicketAttachment {
  id: number;
  ticketId: number;
  filename: string;
  mimeType: string;
  size: number;
  uploadedById?: number;
  createdAt: string;
}

/** Respuesta al actualizar el estado de un ticket. */
export interface UpdateTicketStatusResponse {
  id: number;
  status: AsistiaTicketStatus;
}

/** Métricas agregadas de tickets abiertos en un ámbito. */
export interface TicketMetricSlice {
  open: number;
  openPercent: number;
  openThisMonth: number;
  totalThisMonth: number;
}

/** Métricas de tickets propios del técnico autenticado. */
export interface MyTicketsMetricSlice {
  inProgress: number;
  openPercent: number;
  openThisMonth: number;
  totalThisMonth: number;
}

/** Conteo de tickets abiertos agrupados por ubicación. */
export interface OpenByLocationMetric {
  locationId: number;
  name: string;
  open: number;
}

/** Conteo de tickets abiertos agrupados por técnico asignado. */
export interface OpenByAssigneeMetric {
  technicianId: number;
  name: string;
  open: number;
}

/** Conteo global de tickets abiertos pendientes de asignación humana. */
export interface UnassignedMetric {
  open: number;
}

/** Respuesta del endpoint de métricas para el panel de TI. */
export interface TiMetricsResponse {
  myTickets: MyTicketsMetricSlice;
  mySite: TicketMetricSlice | null;
  myIncidents: TicketMetricSlice;
  myRequests: TicketMetricSlice;
  myGroup: TicketMetricSlice;
  unassigned?: UnassignedMetric;
  mySolved: TicketMetricSlice;
  myClosed: TicketMetricSlice;
  openByLocation: OpenByLocationMetric[];
  openByAssignee: OpenByAssigneeMetric[];
}
