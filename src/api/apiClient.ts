const API_URL =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? "http://localhost:1001/api/v1" : "");

if (!API_URL) {
  throw new Error("VITE_API_URL no esta configurado para este build.");
}

type TokenGetter = () => string | null;
type RequestHook = () => void;
type UnauthorizedHook = (payload: ApiPayload | null) => void;

let getToken: TokenGetter = () => null;
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
  getTokenFn?: TokenGetter;
  onUnauthorizedFn?: UnauthorizedHook;
  onRequestStartFn?: RequestHook;
  onRequestEndFn?: RequestHook;
}

export class ApiError extends Error {
  status?: number;
  code?: string;
  details?: unknown;

  constructor(message: string, { status, code, details }: ApiErrorOptions = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function configureApiClient({
  getTokenFn,
  onUnauthorizedFn,
  onRequestStartFn,
  onRequestEndFn
}: ConfigureApiClientOptions): void {
  if (typeof getTokenFn === "function") getToken = getTokenFn;
  if (typeof onUnauthorizedFn === "function") onUnauthorized = onUnauthorizedFn;
  if (typeof onRequestStartFn === "function") onRequestStart = onRequestStartFn;
  if (typeof onRequestEndFn === "function") onRequestEnd = onRequestEndFn;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const base = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

function extractMessage(payload: ApiPayload | null, fallback: string): string {
  if (!payload) return fallback;
  if (Array.isArray(payload.message)) return payload.message.join(". ");
  if (typeof payload.message === "string") return payload.message;
  return fallback;
}

function isExpiredToken(payload: ApiPayload | null): boolean {
  const message = String(payload?.message ?? "").toLowerCase();
  return payload?.code === "TOKEN_EXPIRED" || (message.includes("token") && message.includes("expir"));
}

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
    const token = auth ? getToken() : null;
    const response = await fetch(buildUrl(path, query), {
      method,
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

export const apiClient = {
  get<T>(path: string, options?: Omit<RequestOptions, "method">): Promise<T> {
    return request<T>(path, { ...options, method: "GET" });
  },
  post<T>(path: string, data?: unknown, options?: Omit<RequestOptions, "method" | "data">): Promise<T> {
    return request<T>(path, { ...options, method: "POST", data });
  },
  put<T>(path: string, data?: unknown, options?: Omit<RequestOptions, "method" | "data">): Promise<T> {
    return request<T>(path, { ...options, method: "PUT", data });
  },
  patch<T>(path: string, data?: unknown, options?: Omit<RequestOptions, "method" | "data">): Promise<T> {
    return request<T>(path, { ...options, method: "PATCH", data });
  },
  delete<T>(path: string, options?: Omit<RequestOptions, "method">): Promise<T> {
    return request<T>(path, { ...options, method: "DELETE" });
  }
};
