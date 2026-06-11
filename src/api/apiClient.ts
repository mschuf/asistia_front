/**
 * @file apiClient.ts
 * @description Cliente HTTP centralizado con cookies, backdrop global, timeouts y manejo de JWT expirado.
 */
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const API_URL =
  configuredApiUrl ||
  (import.meta.env.DEV ? "/api/v1" : "");

if (!API_URL) {
  throw new Error("VITE_API_URL no esta configurado para este build.");
}

type RequestHook = () => void;
type UnauthorizedHook = (payload: ApiPayload | null) => void;

let onUnauthorized: UnauthorizedHook = () => {};
let onRequestStart: RequestHook = () => {};
let onRequestEnd: RequestHook = () => {};

interface ApiErrorOptions {
  status?: number;
  code?: string;
  details?: unknown;
}

interface ApiPayload {
  success?: boolean;
  message?: string | string[];
  code?: string;
  data?: unknown;
  [key: string]: unknown;
}

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: RequestMethod;
  data?: unknown;
  auth?: boolean;
  headers?: HeadersInit;
  showBackdrop?: boolean;
  timeoutMs?: number;
  signal?: AbortSignal;
  query?: Record<string, string | number | boolean | undefined | null>;
}

interface ConfigureApiClientOptions {
  onUnauthorizedFn?: UnauthorizedHook;
  onRequestStartFn?: RequestHook;
  onRequestEndFn?: RequestHook;
}

/**
 * Error tipado para respuestas fallidas de la API.
 */
export class ApiError extends Error {
  status?: number;
  code?: string;
  details?: unknown;

  /**
   * Crea un error de API con metadatos HTTP opcionales.
   * @param message - Mensaje legible para el usuario.
   * @param options - Estado HTTP, código de error y detalles del payload.
   */
  constructor(message: string, { status, code, details }: ApiErrorOptions = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Registra callbacks globales para inicio/fin de petición y sesión expirada.
 * @param options - Hooks de unauthorized, request start y request end.
 */
export function configureApiClient({
  onUnauthorizedFn,
  onRequestStartFn,
  onRequestEndFn
}: ConfigureApiClientOptions): void {
  if (typeof onUnauthorizedFn === "function") onUnauthorized = onUnauthorizedFn;
  if (typeof onRequestStartFn === "function") onRequestStart = onRequestStartFn;
  if (typeof onRequestEndFn === "function") onRequestEnd = onRequestEndFn;
}

/**
 * Construye la URL absoluta con query string opcional.
 * @param path - Ruta relativa del endpoint.
 * @param query - Parámetros de consulta a serializar.
 * @returns URL completa contra el origen actual.
 */
function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const base = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`, window.location.origin);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/**
 * Extrae un mensaje legible del payload de error de la API.
 * @param payload - Cuerpo parseado de la respuesta.
 * @param fallback - Mensaje por defecto si no hay mensaje en el payload.
 * @returns Mensaje de error para mostrar al usuario.
 */
function extractMessage(payload: ApiPayload | null, fallback: string): string {
  if (!payload) return fallback;
  if (Array.isArray(payload.message)) return payload.message.join(". ");
  if (typeof payload.message === "string") return payload.message;
  return fallback;
}

/**
 * Detecta si la respuesta 401 corresponde a un token JWT expirado.
 * @param payload - Cuerpo de la respuesta de error.
 * @returns `true` si el token expiró o es inválido por antigüedad.
 */
function isExpiredToken(payload: ApiPayload | null): boolean {
  const message = String(payload?.message ?? "").toLowerCase();
  return payload?.code === "TOKEN_EXPIRED" || (message.includes("token") && message.includes("expir"));
}

/**
 * Ejecuta una petición HTTP con credenciales, timeout y normalización del envelope `{ success, data }`.
 * @param path - Ruta del endpoint.
 * @param options - Método, cuerpo, headers, backdrop y señal de aborto.
 * @returns Datos tipados del campo `data` o el payload completo.
 * @throws {ApiError} Si la respuesta no es OK, fue cancelada o excedió el timeout.
 */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = "GET",
    data,
    auth = true,
    headers = {},
    showBackdrop = true,
    timeoutMs,
    signal: externalSignal,
    query
  } = options;
  const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
  const hasAbort = typeof AbortController !== "undefined";
  const useTimeout = hasAbort && typeof timeoutMs === "number" && timeoutMs > 0;
  const useExternal = hasAbort && externalSignal != null;
  const controller = useTimeout || useExternal ? new AbortController() : null;
  const timeoutId =
    controller && useTimeout ? setTimeout(() => controller.abort(), timeoutMs) : null;

  if (controller && useExternal) {
    if (externalSignal!.aborted) {
      controller.abort();
    } else {
      externalSignal!.addEventListener("abort", () => controller.abort(), { once: true });
    }
  }

  if (showBackdrop) onRequestStart();

  try {
    const response = await fetch(buildUrl(path, query), {
      method,
      credentials: "include",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...headers
      },
      signal: controller?.signal,
      body:
        data !== undefined ? (isFormData ? data : JSON.stringify(data)) : undefined
    });

    const raw = await response.text();
    let payload: ApiPayload | null = null;

    if (raw) {
      try {
        payload = JSON.parse(raw) as ApiPayload;
      } catch {
        payload = { message: raw };
      }
    }

    if (!response.ok) {
      if (response.status === 401 && auth && isExpiredToken(payload)) {
        onUnauthorized(payload);
      }

      throw new ApiError(extractMessage(payload, "Error inesperado en la API"), {
        status: response.status,
        code: payload?.code,
        details: payload
      });
    }

    if (payload && payload.success === true && "data" in payload) {
      return payload.data as T;
    }

    return payload as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      if (externalSignal?.aborted) {
        throw new ApiError("La solicitud fue cancelada.", { code: "REQUEST_ABORTED" });
      }
      throw new ApiError("La solicitud está tardando demasiado. Intentá nuevamente.");
    }

    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
    if (showBackdrop) onRequestEnd();
  }
}

/**
 * Cliente HTTP con métodos REST que delegan en `request`.
 */
export const apiClient = {
  /**
   * Realiza una petición GET.
   * @param path - Ruta del endpoint.
   * @param options - Opciones de autenticación, query y timeout.
   * @returns Datos tipados de la respuesta.
   */
  get<T>(path: string, options?: Omit<RequestOptions, "method">): Promise<T> {
    return request<T>(path, { ...options, method: "GET" });
  },
  /**
   * Realiza una petición POST con cuerpo opcional.
   * @param path - Ruta del endpoint.
   * @param data - Cuerpo JSON o FormData.
   * @param options - Opciones adicionales de la petición.
   * @returns Datos tipados de la respuesta.
   */
  post<T>(path: string, data?: unknown, options?: Omit<RequestOptions, "method" | "data">): Promise<T> {
    return request<T>(path, { ...options, method: "POST", data });
  },
  /**
   * Realiza una petición PUT con cuerpo opcional.
   * @param path - Ruta del endpoint.
   * @param data - Cuerpo de la petición.
   * @param options - Opciones adicionales de la petición.
   * @returns Datos tipados de la respuesta.
   */
  put<T>(path: string, data?: unknown, options?: Omit<RequestOptions, "method" | "data">): Promise<T> {
    return request<T>(path, { ...options, method: "PUT", data });
  },
  /**
   * Realiza una petición PATCH con cuerpo opcional.
   * @param path - Ruta del endpoint.
   * @param data - Cuerpo parcial a actualizar.
   * @param options - Opciones adicionales de la petición.
   * @returns Datos tipados de la respuesta.
   */
  patch<T>(path: string, data?: unknown, options?: Omit<RequestOptions, "method" | "data">): Promise<T> {
    return request<T>(path, { ...options, method: "PATCH", data });
  },
  /**
   * Realiza una petición DELETE.
   * @param path - Ruta del endpoint.
   * @param options - Opciones adicionales de la petición.
   * @returns Datos tipados de la respuesta.
   */
  delete<T>(path: string, options?: Omit<RequestOptions, "method">): Promise<T> {
    return request<T>(path, { ...options, method: "DELETE" });
  },
  /**
   * Descarga un archivo binario sin envelope JSON.
   * @param path - Ruta del endpoint.
   * @param options - Query, backdrop y señal de aborto.
   * @returns Blob y nombre de archivo sugerido.
   */
  async download(
    path: string,
    options?: Omit<RequestOptions, "method" | "data">,
  ): Promise<{ blob: Blob; filename: string }> {
    const { showBackdrop = true, signal, query } = options ?? {};
    if (showBackdrop) onRequestStart();

    try {
      const response = await fetch(buildUrl(path, query), {
        method: "GET",
        credentials: "include",
        signal,
      });

      if (!response.ok) {
        const raw = await response.text();
        let payload: ApiPayload | null = null;
        if (raw) {
          try {
            payload = JSON.parse(raw) as ApiPayload;
          } catch {
            payload = { message: raw };
          }
        }

        if (response.status === 401 && isExpiredToken(payload)) {
          onUnauthorized(payload);
        }

        throw new ApiError(extractMessage(payload, "No se pudo descargar el archivo"), {
          status: response.status,
          code: payload?.code,
          details: payload,
        });
      }

      const blob = await response.blob();
      const filename = parseDownloadFilename(response.headers.get("Content-Disposition"));
      return { blob, filename };
    } finally {
      if (showBackdrop) onRequestEnd();
    }
  }
};

/**
 * Extrae nombre de archivo desde Content-Disposition.
 * @param header - Cabecera HTTP Content-Disposition.
 * @returns Nombre de archivo o fallback genérico.
 */
function parseDownloadFilename(header: string | null): string {
  if (!header) return "descarga";

  const utfMatch = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utfMatch?.[1]) {
    try {
      return decodeURIComponent(utfMatch[1].trim());
    } catch {
      return utfMatch[1].trim();
    }
  }

  const plainMatch = header.match(/filename="?([^";]+)"?/i);
  return plainMatch?.[1]?.trim() || "descarga";
}
