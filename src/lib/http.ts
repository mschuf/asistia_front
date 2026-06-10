/**
 * @file http.ts
 * @description Utilidades HTTP auxiliares para detectar cancelaciones y abortos de petición.
 */
import { ApiError } from "@/api/apiClient";

/**
 * Determina si un error proviene de una petición abortada por el usuario o por timeout.
 * @param error - Error capturado en un bloque catch.
 * @returns `true` si es `AbortError` del DOM o `ApiError` con código `REQUEST_ABORTED`.
 */
export function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") return true;
  return error instanceof ApiError && error.code === "REQUEST_ABORTED";
}
