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

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot < 0) return "";
  return filename.slice(dot).toLowerCase();
}

export function formatAttachmentSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageFile(mimeType: string, filename: string): boolean {
  if (mimeType.startsWith("image/")) return true;
  return IMAGE_ATTACHMENT_EXTENSIONS.has(extensionOf(filename));
}

export function isAttachmentImage(file: File): boolean {
  return isImageFile(file.type, file.name);
}

export function isTicketAttachmentImage(attachment: { mimeType: string; filename: string }): boolean {
  return isImageFile(attachment.mimeType, attachment.filename);
}

export function attachmentExtensionLabel(file: File): string {
  return attachmentExtensionLabelFromFilename(file.name);
}

export function attachmentExtensionLabelFromFilename(filename: string): string {
  const extension = extensionOf(filename);
  return extension ? extension.slice(1).toUpperCase() : "FILE";
}

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

export function getClipboardFiles(dataTransfer: DataTransfer | null): File[] {
  if (!dataTransfer?.items) return [];

  return Array.from(dataTransfer.items)
    .filter((item) => item.kind === "file")
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null)
    .map(normalizePastedFile);
}

export function shouldIgnoreClipboardPasteForAttachments(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest('[contenteditable="true"]'));
}
