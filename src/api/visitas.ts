/**
 * @file visitas.ts
 * @description Cliente HTTP CRUD de visitas para el módulo Portería.
 */
import { apiClient } from "./apiClient";
import type { VisitaTarjetaColor } from "@/lib/visita-tarjeta-color";

const VISITA_PHOTO_UPLOAD_TIMEOUT_MS = 180_000;

export type VisitaEstado = "programada" | "activa" | "sin_salida" | "finalizada" | "cancelada";

export type EliminarVisitaResult = { id: number; deleted: true } | { id: number; cancelled: true };

/** Indica si la visita puede eliminarse desde la UI. */
export function isVisitaEliminable(_estado: VisitaEstado): boolean {
  return true;
}

/** Indica si eliminar cancelará la visita (activa/sin_salida) en lugar de borrarla. */
export function requiereCancelacionAlEliminar(estado: VisitaEstado): boolean {
  return estado === "activa" || estado === "sin_salida";
}

/** Etiquetas legibles de estado de visita para UI. */
export const VISITA_ESTADO_LABELS: Record<VisitaEstado, string> = {
  programada: "Programada",
  activa: "Activa",
  sin_salida: "Sin salida",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
};
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
  hasVisitaFoto: boolean;
  documento: string;
  empresa: string | null;
  motivo: string;
  motivoVisitaId: number | null;
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
  motivoVisitaId: number;
  responsableNombre: string;
  responsableId?: number;
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

export interface ResponsableCandidate {
  id: number;
  fullName: string;
  subtitle: string;
}

export interface ResponsableCandidateListado {
  items: ResponsableCandidate[];
  total: number;
}

/** Busca usuarios GLPI activos para el selector de responsable al crear visitas. */
export async function searchResponsableCandidates(
  search: string,
  limit = 20,
  options?: { signal?: AbortSignal; id?: number },
): Promise<ResponsableCandidateListado> {
  return apiClient.get<ResponsableCandidateListado>("/visitas/responsable-candidates", {
    ...options,
    query: {
      search: search.trim() || undefined,
      limit,
      id: options?.id,
    },
  });
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

export interface ListarVisitasActivasOptions {
  limit?: number;
  entradaFrom?: string;
  entradaTo?: string;
}

/** Lista visitas activas para el panel de seguimiento en Portería. */
export async function listarVisitasActivas(
  options: ListarVisitasActivasOptions = {},
): Promise<Visita[]> {
  const { limit = 100, entradaFrom, entradaTo } = options;
  const result = await listarVisitas({
    estado: "activa",
    limit,
    entradaFrom,
    entradaTo,
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

/** Elimina una visita: cancela las activas o borra permanentemente el resto. */
export async function eliminarVisita(id: number): Promise<EliminarVisitaResult> {
  return apiClient.delete<EliminarVisitaResult>(`/visitas/${id}`);
}

/** Finaliza una visita activa o sin salida registrando la salida y observaciones opcionales. */
export async function finalizarVisita(id: number, observaciones: string): Promise<Visita> {
  return actualizarVisita(id, {
    estado: "finalizada",
    salidaAt: new Date().toISOString(),
    observaciones: observaciones.trim(),
  });
}

/** Obtiene la foto de una visita como blob autenticado por cookie. */
export async function obtenerFotoVisitaBlob(
  visitaId: number,
  options?: { signal?: AbortSignal },
): Promise<Blob> {
  const { blob } = await apiClient.download(`/visitas/${visitaId}/foto`, {
    signal: options?.signal,
    showBackdrop: false,
  });
  return blob;
}

/** Sube o reemplaza la foto de una visita. */
export async function subirFotoVisita(
  visitaId: number,
  file: File,
  options?: { signal?: AbortSignal },
): Promise<Visita> {
  const formData = new FormData();
  formData.append("file", file);
  return apiClient.post<Visita>(`/visitas/${visitaId}/foto`, formData, {
    timeoutMs: VISITA_PHOTO_UPLOAD_TIMEOUT_MS,
    signal: options?.signal,
  });
}
