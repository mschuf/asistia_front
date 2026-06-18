/**
 * @file visitas.ts
 * @description Cliente HTTP CRUD de visitas para el módulo Portería.
 */
import { apiClient } from "./apiClient";
import type { VisitaTarjetaColor } from "@/lib/visita-tarjeta-color";

export type VisitaEstado = "programada" | "activa" | "finalizada" | "cancelada";
export const VISITA_ZONA = ["administración", "fábrica"] as const;

export type VisitaZona = (typeof VISITA_ZONA)[number];

/** Etiquetas legibles para mostrar en UI. */
export const VISITA_ZONA_LABELS = {
  administración: "Administración",
  fábrica: "Fábrica",
} as const satisfies Record<VisitaZona, string>;
export type VisitaSeguimiento = "activo" | "alerta" | "peligro";

export interface Visita {
  id: number;
  personaId: number;
  visitante: string;
  hasFoto: boolean;
  documento: string;
  empresa: string | null;
  motivo: string;
  responsableNombre: string;
  estado: VisitaEstado;
  estadoSeguimiento: VisitaSeguimiento | null;
  zonasPermitidas: VisitaZona[];
  credencialNumero: string | null;
  tarjetaColor: VisitaTarjetaColor | null;
  entradaAt: string | null;
  salidaAt: string | null;
  observaciones: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VisitaListado {
  items: Visita[];
  total: number;
  page: number;
  limit: number;
}

export type VisitaSortColumn =
  | "id"
  | "visitante"
  | "documento"
  | "empresa"
  | "motivo"
  | "responsable"
  | "estado"
  | "entradaAt"
  | "salidaAt";

export type VisitaSortOrder = "asc" | "desc";

export interface ListarVisitasQuery {
  page?: number;
  limit?: number;
  search?: string;
  visitante?: string;
  documento?: string;
  empresa?: string;
  motivo?: string;
  responsable?: string;
  estado?: VisitaEstado;
  personaId?: number;
  entradaFrom?: string;
  entradaTo?: string;
  includeProgramadasSinEntrada?: boolean;
  sortBy?: VisitaSortColumn;
  sortOrder?: VisitaSortOrder;
}

export interface CrearVisitaPayload {
  personaId: number;
  motivo: string;
  responsableNombre: string;
  estado?: VisitaEstado;
  estadoSeguimiento?: VisitaSeguimiento;
  zonasPermitidas?: VisitaZona[];
  credencialNumero?: string;
  tarjetaColor: VisitaTarjetaColor;
  entradaAt?: string;
  salidaAt?: string;
  observaciones?: string;
}

export type ActualizarVisitaPayload = Partial<CrearVisitaPayload>;

export interface VisitaMetricsQuery {
  entradaFrom?: string;
  entradaTo?: string;
}

export interface VisitaMetrics {
  monthVisits: number;
  dayVisits: number;
  activeOnlyAdmin: number;
  activeOnlyFactory: number;
  activeBothZones: number;
  activeStaleWithoutCheckout: number;
}

/** Lista visitas con paginación, filtros y orden. */
export async function listarVisitas(query: ListarVisitasQuery = {}): Promise<VisitaListado> {
  return apiClient.get<VisitaListado>("/visitas", {
    query: query as Record<string, string | number | boolean | undefined | null>,
  });
}

/** Obtiene métricas agregadas de visitas para cards de Portería. */
export async function obtenerMetricasVisitas(query: VisitaMetricsQuery = {}): Promise<VisitaMetrics> {
  return apiClient.get<VisitaMetrics>("/visitas/metrics", {
    query: query as Record<string, string | number | boolean | undefined | null>,
  });
}

/** Lista visitas activas para el panel de seguimiento en Portería. */
export async function listarVisitasActivas(limit = 100): Promise<Visita[]> {
  const result = await listarVisitas({
    estado: "activa",
    limit,
    sortBy: "entradaAt",
    sortOrder: "asc",
  });
  return result.items;
}

/** Obtiene una visita por ID. */
export async function obtenerVisita(id: number): Promise<Visita> {
  return apiClient.get<Visita>(`/visitas/${id}`);
}

/** Crea una visita nueva. */
export async function crearVisita(payload: CrearVisitaPayload): Promise<Visita> {
  return apiClient.post<Visita>("/visitas", payload);
}

/** Actualiza una visita existente. */
export async function actualizarVisita(id: number, payload: ActualizarVisitaPayload): Promise<Visita> {
  return apiClient.patch<Visita>(`/visitas/${id}`, payload);
}

/** Elimina definitivamente una visita programada o cancelada. */
export async function eliminarVisita(id: number): Promise<{ id: number; deleted: true }> {
  return apiClient.delete<{ id: number; deleted: true }>(`/visitas/${id}`);
}

/** Finaliza una visita activa registrando la salida y observaciones opcionales. */
export async function finalizarVisita(id: number, observaciones: string): Promise<Visita> {
  return actualizarVisita(id, {
    estado: "finalizada",
    salidaAt: new Date().toISOString(),
    observaciones: observaciones.trim(),
  });
}
