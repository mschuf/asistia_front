/**
 * @file ErsDocumentPicker.tsx
 * @description Selector controlado de documentos pendientes para un proyecto ERS.
 */
import { FileText, Paperclip, X } from "lucide-react";
import { useId, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ERS_DOCUMENT_ACCEPT, MAX_ERS_DOCUMENT_BATCH, validateErsDocumentBatch } from "@/lib/ers-documents";
import { formatAttachmentSize } from "@/lib/attachments";

interface Props {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  trailingAction?: ReactNode;
}

export function ErsDocumentPicker({ files, onChange, disabled = false, trailingAction }: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  const addFiles = (incoming: File[]) => {
    const next = [...files, ...incoming];
    const validation = validateErsDocumentBatch(next);
    if (validation) {
      setError(validation);
      return;
    }
    setError("");
    onChange(next);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Agregar documentos</p>
          <p className="text-xs text-muted-foreground">Hasta 5 por lote, 50 MB cada uno. PNG, JPG, GIF, PDF o TXT.</p>
        </div>
        <input
          ref={inputRef}
          id={id}
          type="file"
          multiple
          accept={ERS_DOCUMENT_ACCEPT}
          className="sr-only"
          disabled={disabled || files.length >= MAX_ERS_DOCUMENT_BATCH}
          onChange={(event) => addFiles(Array.from(event.target.files ?? []))}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" disabled={disabled || files.length >= MAX_ERS_DOCUMENT_BATCH} onClick={() => inputRef.current?.click()}>
            <Paperclip className="h-4 w-4" aria-hidden="true" /> Seleccionar archivos
          </Button>
          {trailingAction}
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {files.length ? (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li key={`${file.name}-${file.size}-${index}`} className="flex items-center gap-3 rounded-md bg-muted/40 px-3 py-2">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatAttachmentSize(file.size)}</p>
              </div>
              <Button type="button" variant="ghost" size="icon" disabled={disabled} aria-label={`Quitar ${file.name}`} onClick={() => onChange(files.filter((_, current) => current !== index))}>
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
