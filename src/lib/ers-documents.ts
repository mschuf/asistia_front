/**
 * @file ers-documents.ts
 * @description Validación y presentación de documentos seleccionados para ERS.
 */
import type { ErsDocument } from "@/services/ersDocumentsService";

export const ERS_DOCUMENT_ACCEPT = ".png,.jpg,.jpeg,.gif,.pdf,.txt";
export const MAX_ERS_DOCUMENT_BATCH = 5;
export const MAX_ERS_DOCUMENT_BYTES = 50 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "pdf", "txt"]);

export function documentExtension(name: string): string {
  const index = name.lastIndexOf(".");
  return index >= 0 ? name.slice(index + 1).toLowerCase() : "";
}

export function validateErsDocumentBatch(files: File[]): string | null {
  if (files.length > MAX_ERS_DOCUMENT_BATCH) return "Podés seleccionar hasta 5 archivos por lote.";
  for (const file of files) {
    if (!ALLOWED_EXTENSIONS.has(documentExtension(file.name))) {
      return `“${file.name}” no es una imagen, PDF o TXT permitido.`;
    }
    if (file.size <= 0) return `“${file.name}” está vacío.`;
    if (file.size > MAX_ERS_DOCUMENT_BYTES) return `“${file.name}” supera el máximo de 50 MB.`;
  }
  return null;
}

export function isErsDocumentImage(document: ErsDocument): boolean {
  return document.mimeType.startsWith("image/") || ["png", "jpg", "jpeg", "gif"].includes(documentExtension(document.name));
}

export function ersDocumentTypeLabel(document: ErsDocument): string {
  if (isErsDocumentImage(document)) return "Imagen";
  if (document.mimeType === "application/pdf" || documentExtension(document.name) === "pdf") return "PDF";
  if (document.mimeType === "text/plain" || documentExtension(document.name) === "txt") return "TXT";
  return document.mimeType || "Archivo";
}
