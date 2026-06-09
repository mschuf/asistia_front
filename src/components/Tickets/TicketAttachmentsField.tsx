import { FileText, Paperclip, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import {
  ATTACHMENT_ACCEPT,
  attachmentExtensionLabel,
  formatAttachmentSize,
  getClipboardFiles,
  isAttachmentImage,
  MAX_ATTACHMENTS,
  shouldIgnoreClipboardPasteForAttachments,
  validateAttachmentSelection,
} from "@/lib/attachments";
import { cn } from "@/lib/utils";

interface TicketAttachmentsFieldProps {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  error?: string;
}

export function TicketAttachmentsField({
  files,
  onChange,
  disabled = false,
  error,
}: TicketAttachmentsFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef(files);
  const [selectionError, setSelectionError] = useState("");
  const [previewUrls, setPreviewUrls] = useState<(string | null)[]>([]);

  filesRef.current = files;

  useEffect(() => {
    const urls = files.map((file) => (isAttachmentImage(file) ? URL.createObjectURL(file) : null));
    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [files]);

  const addFiles = useCallback(
    (incoming: File[]) => {
      if (!incoming.length || disabled) return;

      const merged = [...filesRef.current, ...incoming];
      const validationError = validateAttachmentSelection(merged);
      if (validationError) {
        setSelectionError(validationError);
        return;
      }

      setSelectionError("");
      onChange(merged.slice(0, MAX_ATTACHMENTS));
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [disabled, onChange],
  );

  const handleSelect = (selected: FileList | null) => {
    if (!selected?.length) return;
    addFiles(Array.from(selected));
  };

  useEffect(() => {
    if (disabled) return;

    const handleDocumentPaste = (event: Event) => {
      if (!(event instanceof ClipboardEvent)) return;
      if (filesRef.current.length >= MAX_ATTACHMENTS) return;
      if (shouldIgnoreClipboardPasteForAttachments(event.target)) return;

      const pastedFiles = getClipboardFiles(event.clipboardData);
      if (!pastedFiles.length) return;

      event.preventDefault();
      addFiles(pastedFiles);
    };

    document.addEventListener("paste", handleDocumentPaste);
    return () => document.removeEventListener("paste", handleDocumentPaste);
  }, [addFiles, disabled]);

  const removeFile = (index: number) => {
    setSelectionError("");
    onChange(files.filter((_, currentIndex) => currentIndex !== index));
  };

  const displayError = error ?? selectionError;

  return (
    <Field id={inputId} label="Adjuntos" error={displayError}>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Máx. {MAX_ATTACHMENTS} archivos, 50 MB c/u. PNG, JPG, TXT, MD, PDF. También podés pegar
          archivos con Ctrl+V.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            multiple
            accept={ATTACHMENT_ACCEPT}
            className="sr-only"
            disabled={disabled || files.length >= MAX_ATTACHMENTS}
            onChange={(event) => handleSelect(event.target.files)}
          />
          <Button
            type="button"
            variant="outline"
            disabled={disabled || files.length >= MAX_ATTACHMENTS}
            onClick={() => inputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" aria-hidden="true" />
            Agregar archivos
          </Button>
          {files.length > 0 ? (
            <span className="text-sm text-muted-foreground">
              {files.length}/{MAX_ATTACHMENTS} seleccionados
            </span>
          ) : null}
        </div>

        {files.length > 0 ? (
          <ul className="flex flex-wrap gap-3">
            {files.map((file, index) => {
              const previewUrl = previewUrls[index];
              const isImage = Boolean(previewUrl);

              return (
                <li
                  key={`${file.name}-${file.size}-${index}`}
                  className="group relative aspect-square w-28 shrink-0"
                >
                  <div
                    className={cn(
                      "relative h-full w-full overflow-hidden rounded-md border border-input bg-muted/20",
                      isImage ? "bg-muted" : "flex flex-col items-center justify-center gap-1 p-2",
                    )}
                  >
                    {isImage && previewUrl ? (
                      <img
                        src={previewUrl}
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <>
                        <FileText className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                        <span className="text-xs font-semibold uppercase text-muted-foreground">
                          {attachmentExtensionLabel(file)}
                        </span>
                      </>
                    )}

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-6">
                      <p className="truncate text-xs font-medium text-white" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-[10px] text-white/80">{formatAttachmentSize(file.size)}</p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    title="Quitar adjunto"
                    disabled={disabled}
                    aria-label={`Quitar ${file.name}`}
                    onClick={() => removeFile(index)}
                    className="absolute -right-2 -top-2 h-7 w-7 rounded-full opacity-100 shadow-sm transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </Field>
  );
}
