/**
 * @file attachments.ts
 * @description Validación, formato y utilidades de adjuntos para tickets.
 */
const ALLOWED_ATTACHMENT_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".jpe",
  ".jfif",
  ".txt",
  ".md",
  ".pdf",
]);

export const MAX_ATTACHMENTS = 5;
export const MAX_ATTACHMENT_BYTES = 50 * 1024 * 1024;

export const ATTACHMENT_ACCEPT = ".png,.jpg,.jpeg,.jpe,.jfif,.txt,.md,.pdf";

const IMAGE_ATTACHMENT_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".jpe", ".jfif"]);

/**
 * Extrae la extensión en minúsculas de un nombre de archivo.
 * @param filename - Nombre del archivo.
 * @returns Extensión con punto o cadena vacía.
 */
function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot < 0) return "";
  return filename.slice(dot).toLowerCase();
}

/**
 * Formatea un tamaño en bytes a B, KB o MB legibles.
 * @param bytes - Tamaño en bytes.
 * @returns Cadena formateada.
 */
export function formatAttachmentSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Determina si un archivo es imagen por MIME o extensión.
 * @param mimeType - Tipo MIME.
 * @param filename - Nombre del archivo.
 * @returns `true` si es imagen.
 */
function isImageFile(mimeType: string, filename: string): boolean {
  if (mimeType.startsWith("image/")) return true;
  return IMAGE_ATTACHMENT_EXTENSIONS.has(extensionOf(filename));
}

/**
 * Indica si un `File` local es imagen admisible.
 * @param file - Archivo del navegador.
 * @returns `true` si es imagen.
 */
export function isAttachmentImage(file: File): boolean {
  return isImageFile(file.type, file.name);
}

/**
 * Indica si un adjunto de ticket almacenado es imagen.
 * @param attachment - Metadatos con MIME y nombre.
 * @returns `true` si es imagen.
 */
export function isTicketAttachmentImage(attachment: { mimeType: string; filename: string }): boolean {
  return isImageFile(attachment.mimeType, attachment.filename);
}

/**
 * Devuelve la etiqueta de extensión de un `File`.
 * @param file - Archivo local.
 * @returns Extensión en mayúsculas o `FILE`.
 */
export function attachmentExtensionLabel(file: File): string {
  return attachmentExtensionLabelFromFilename(file.name);
}

/**
 * Devuelve la etiqueta de extensión a partir del nombre.
 * @param filename - Nombre del archivo.
 * @returns Extensión en mayúsculas o `FILE`.
 */
export function attachmentExtensionLabelFromFilename(filename: string): string {
  const extension = extensionOf(filename);
  return extension ? extension.slice(1).toUpperCase() : "FILE";
}

/**
 * Valida un archivo individual contra tipo y tamaño permitidos.
 * @param file - Archivo a validar.
 * @returns Mensaje de error o null si es válido.
 */
export function validateAttachmentFile(file: File): string | null {
  const extension = extensionOf(file.name);
  if (!ALLOWED_ATTACHMENT_EXTENSIONS.has(extension)) {
    return `"${file.name}" no es un tipo permitido (PNG, JPG, TXT, MD, PDF).`;
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return `"${file.name}" supera el máximo de 50 MB.`;
  }
  if (file.size <= 0) {
    return `"${file.name}" está vacío.`;
  }
  return null;
}

/**
 * Valida una selección completa de adjuntos (cantidad y cada archivo).
 * @param files - Archivos seleccionados.
 * @returns Mensaje de error o null si es válido.
 */
export function validateAttachmentSelection(files: File[]): string | null {
  if (files.length > MAX_ATTACHMENTS) {
    return `Podés adjuntar hasta ${MAX_ATTACHMENTS} archivos.`;
  }
  for (const file of files) {
    const error = validateAttachmentFile(file);
    if (error) return error;
  }
  return null;
}

const MIME_EXTENSION_MAP: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "text/plain": ".txt",
  "text/markdown": ".md",
  "application/pdf": ".pdf",
};

/**
 * Normaliza un archivo pegado asignando extensión según MIME si falta.
 * @param file - Archivo del portapapeles.
 * @returns Archivo con nombre y extensión corregidos si aplica.
 */
export function normalizePastedFile(file: File): File {
  const extension = extensionOf(file.name);
  if (extension && ALLOWED_ATTACHMENT_EXTENSIONS.has(extension)) {
    return file;
  }

  const mappedExtension = MIME_EXTENSION_MAP[file.type.toLowerCase()];
  if (!mappedExtension) {
    return file;
  }

  const hasGenericName = !file.name || file.name === "image.png" || file.name === "blob";
  const basename = hasGenericName ? `pegado-${Date.now()}` : file.name.replace(/\.[^.]+$/, "");
  return new File([file], `${basename}${mappedExtension}`, { type: file.type });
}

/**
 * Extrae archivos del portapapeles de un evento paste/drop.
 * @param dataTransfer - Datos del portapapeles o null.
 * @returns Archivos normalizados listos para adjuntar.
 */
export function getClipboardFiles(dataTransfer: DataTransfer | null): File[] {
  if (!dataTransfer?.items) return [];

  return Array.from(dataTransfer.items)
    .filter((item) => item.kind === "file")
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null)
    .map(normalizePastedFile);
}

/**
 * Indica si un paste debe ignorarse por estar en un editor contenteditable.
 * @param target - Elemento foco del evento paste.
 * @returns `true` para no interceptar el paste.
 */
export function shouldIgnoreClipboardPasteForAttachments(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest('[contenteditable="true"]'));
}
