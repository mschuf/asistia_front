import { ApiError } from "@/api/apiClient";

export function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") return true;
  return error instanceof ApiError && error.code === "REQUEST_ABORTED";
}
