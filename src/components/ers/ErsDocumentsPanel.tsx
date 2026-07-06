/**
 * @file ErsDocumentsPanel.tsx
 * @description Carga, búsqueda, listado y previsualización de documentos ERS.
 */
import { ArrowDown, ArrowUp, ChevronsUpDown, ChevronDown, Download, Eye, FileText, Loader2, Search, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AttachmentImagePreview } from "@/components/tickets/AttachmentImagePreview";
import { ErsDocumentPicker } from "@/components/ers/ErsDocumentPicker";
import { ErsDocumentDeleteConfirmDialog } from "@/components/ers/ErsDocumentDeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/context/ToastContext";
import { ersDocumentTypeLabel, isErsDocumentImage } from "@/lib/ers-documents";
import { cn } from "@/lib/utils";
import {
  downloadErsDocument,
  deleteErsDocument,
  fetchErsDocumentBlob,
  listErsDocuments,
  uploadErsDocument,
  type ErsDocument,
  type ErsDocumentLimit,
  type ErsDocumentSortColumn,
} from "@/services/ersDocumentsService";

interface Filters {
  search: string;
  name: string;
  type: "" | "image" | "pdf" | "text";
  dateFrom: string;
  dateTo: string;
}

interface Props {
  projectId?: number;
  files: File[];
  onFilesChange: (files: File[]) => void;
  onDocumentsCountChange?: (count: number) => void;
}

const EMPTY_FILTERS: Filters = { search: "", name: "", type: "", dateFrom: "", dateTo: "" };

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("es-PY", { dateStyle: "short", timeStyle: "short" }).format(date);
}

export function ErsDocumentsPanel({ projectId, files, onFilesChange, onDocumentsCountChange }: Props) {
  const toast = useToast();
  const [items, setItems] = useState<ErsDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<ErsDocumentLimit>("15");
  const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
  const [advanced, setAdvanced] = useState(false);
  const [sort, setSort] = useState<{ column: ErsDocumentSortColumn; order: "asc" | "desc" } | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const [previewDocument, setPreviewDocument] = useState<ErsDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<ErsDocument | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback((signal?: AbortSignal) => {
    if (!projectId) return Promise.resolve();
    setLoading(true);
    setError("");
    return listErsDocuments(projectId, {
      page,
      limit,
      search: applied.search || undefined,
      name: applied.name || undefined,
      type: applied.type || undefined,
      dateFrom: applied.dateFrom || undefined,
      dateTo: applied.dateTo || undefined,
      sortBy: sort?.column,
      sortOrder: sort?.order,
    }, signal)
      .then((response) => {
        if (signal?.aborted) return;
        setItems(response.items);
        setTotal(response.total);
        if (!Object.values(applied).some(Boolean)) onDocumentsCountChange?.(response.total);
      })
      .catch(() => {
        if (!signal?.aborted) setError("No se pudieron cargar los documentos del proyecto.");
      })
      .finally(() => {
        if (!signal?.aborted) setLoading(false);
      });
  }, [applied, limit, onDocumentsCountChange, page, projectId, sort]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, reloadToken]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const totalPages = useMemo(() => limit === "all" ? 1 : Math.max(1, Math.ceil(total / Number(limit))), [limit, total]);
  const start = total === 0 ? 0 : limit === "all" ? 1 : (page - 1) * Number(limit) + 1;
  const end = limit === "all" ? total : Math.min(total, page * Number(limit));

  const applyFilters = () => {
    setApplied({ ...draft });
    setPage(1);
  };

  const setSortColumn = (column: ErsDocumentSortColumn) => {
    setPage(1);
    setSort((current) => {
      if (!current || current.column !== column) return { column, order: "desc" };
      if (current.order === "desc") return { column, order: "asc" };
      return null;
    });
  };

  const handleUpload = async () => {
    if (!projectId || files.length === 0) return;
    setUploading(true);
    const failed: File[] = [];
    let uploaded = 0;
    for (const file of files) {
      try {
        await uploadErsDocument(projectId, file);
        uploaded += 1;
      } catch {
        failed.push(file);
      }
    }
    onFilesChange(failed);
    setUploading(false);
    if (uploaded) {
      toast.success(`${uploaded} documento${uploaded === 1 ? "" : "s"} guardado${uploaded === 1 ? "" : "s"}.`, "ERS");
      setReloadToken((value) => value + 1);
      void listErsDocuments(projectId, { page: 1, limit: "15" })
        .then((response) => onDocumentsCountChange?.(response.total))
        .catch(() => undefined);
    }
    if (failed.length) toast.error(`No se pudieron guardar: ${failed.map((file) => file.name).join(", ")}.`, "ERS");
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    setPreviewDocument(null);
  };

  const handlePreview = async (document: ErsDocument) => {
    if (!projectId) return;
    setPreviewLoading(true);
    try {
      const blob = await fetchErsDocumentBlob(projectId, document.id);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
      setPreviewDocument(document);
    } catch {
      toast.error("No se pudo abrir el documento.", "ERS");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async (document: ErsDocument) => {
    if (!projectId) return;
    setDownloadingId(document.id);
    try {
      await downloadErsDocument(projectId, document);
    } catch {
      toast.error("No se pudo descargar el documento.", "ERS");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async () => {
    if (!projectId || !documentToDelete) return;
    setDeleting(true);
    try {
      await deleteErsDocument(projectId, documentToDelete.id);
      setDocumentToDelete(null);
      toast.success("Documento eliminado correctamente.", "ERS");
      if (items.length === 1 && page > 1) setPage((value) => value - 1);
      else setReloadToken((value) => value + 1);
      void listErsDocuments(projectId, { page: 1, limit: "15" })
        .then((response) => onDocumentsCountChange?.(response.total))
        .catch(() => undefined);
    } catch {
      toast.error("No se pudo eliminar el documento.", "ERS");
    } finally {
      setDeleting(false);
    }
  };

  const sortIcon = (column: ErsDocumentSortColumn) => {
    if (sort?.column !== column) return <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />;
    return sort.order === "desc" ? <ArrowDown className="h-4 w-4" aria-hidden="true" /> : <ArrowUp className="h-4 w-4" aria-hidden="true" />;
  };

  return (
    <div className="space-y-4 rounded-md border bg-card p-4 shadow-soft">
      <ErsDocumentPicker
        files={files}
        onChange={onFilesChange}
        disabled={uploading}
        trailingAction={projectId ? (
          <Button type="button" disabled={uploading || files.length === 0} onClick={() => void handleUpload()}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
            {uploading ? "Subiendo..." : "Subir archivos"}
          </Button>
        ) : null}
      />
      {!projectId ? (
        <p className="text-sm text-muted-foreground">Los archivos seleccionados se subirán cuando guardes el nuevo proyecto.</p>
      ) : null}

      {projectId ? (
        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input value={draft.search} onChange={(event) => setDraft((current) => ({ ...current, search: event.target.value }))} placeholder="Buscar en todos los campos..." className="pl-9 pr-10" />
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted" aria-label={advanced ? "Ocultar búsqueda avanzada" : "Mostrar búsqueda avanzada"} onClick={() => setAdvanced((value) => !value)}>
                <ChevronDown className={cn("h-4 w-4 transition-transform", advanced && "rotate-180")} aria-hidden="true" />
              </button>
            </div>
            <Button type="button" onClick={applyFilters}><Search className="h-4 w-4" aria-hidden="true" /> Buscar</Button>
          </div>
          {advanced ? (
            <div className="grid grid-cols-1 gap-3 rounded-md border bg-muted/20 p-3 md:grid-cols-4">
              <label className="space-y-1 text-sm"><span>Nombre</span><Input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} /></label>
              <label className="space-y-1 text-sm"><span>Tipo</span><Select value={draft.type} onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value as Filters["type"] }))}><option value="">Todos</option><option value="image">Imagen</option><option value="pdf">PDF</option><option value="text">TXT</option></Select></label>
              <label className="space-y-1 text-sm"><span>Desde</span><Input type="date" value={draft.dateFrom} onChange={(event) => setDraft((current) => ({ ...current, dateFrom: event.target.value }))} /></label>
              <label className="space-y-1 text-sm"><span>Hasta</span><Input type="date" value={draft.dateTo} onChange={(event) => setDraft((current) => ({ ...current, dateTo: event.target.value }))} /></label>
            </div>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {([["name", "Nombre"], ["type", "Tipo"], ["createdAt", "Fecha"]] as const).map(([column, label]) => (
                    <th key={column} className="px-4 py-3 font-semibold"><button type="button" className="inline-flex items-center gap-1" onClick={() => setSortColumn(column)}>{label}{sortIcon(column)}</button></th>
                  ))}
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Cargando documentos...</td></tr> : null}
                {!loading && items.length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No hay documentos para mostrar.</td></tr> : null}
                {!loading ? items.map((document) => (
                  <tr key={document.id} className="border-t">
                    <td className="max-w-[360px] px-4 py-3"><span className="flex items-center gap-2"><FileText className="h-4 w-4 shrink-0 text-muted-foreground" /><span className="truncate" title={document.name}>{document.name}</span></span></td>
                    <td className="px-4 py-3">{ersDocumentTypeLabel(document)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(document.createdAt)}</td>
                    <td className="px-4 py-3"><div className="flex justify-end gap-1"><Button type="button" variant="ghost" size="icon" title="Ver" disabled={previewLoading} onClick={() => void handlePreview(document)}><Eye className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" title="Descargar" disabled={downloadingId === document.id} onClick={() => void handleDownload(document)}>{downloadingId === document.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}</Button><Button type="button" variant="ghost" size="icon" title="Eliminar" aria-label={`Eliminar ${document.name}`} className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDocumentToDelete(document)}><Trash2 className="h-4 w-4" /></Button></div></td>
                  </tr>
                )) : null}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col justify-between gap-3 text-sm sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2"><span>Mostrar por página</span><Select value={limit} onChange={(event) => { setLimit(event.target.value as ErsDocumentLimit); setPage(1); }} className="w-24"><option value="15">15</option><option value="50">50</option><option value="100">100</option><option value="all">Todos</option></Select><span className="text-muted-foreground">Mostrando {start} - {end} de {total} elementos</span></div>
            <div className="flex items-center gap-2"><Button type="button" variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Anterior</Button><span className="whitespace-nowrap">Página {Math.min(page, totalPages)} de {totalPages}</span><Button type="button" variant="outline" disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)}>Siguiente</Button></div>
          </div>
        </div>
      ) : null}

      {previewDocument && previewUrl && isErsDocumentImage(previewDocument) ? <AttachmentImagePreview src={previewUrl} alt={previewDocument.name} filename={previewDocument.name} onClose={closePreview} /> : null}
      <Dialog open={Boolean(previewDocument && previewUrl && !isErsDocumentImage(previewDocument))} onOpenChange={(open) => { if (!open) closePreview(); }} title={previewDocument?.name ?? "Documento"} className="h-[90vh] max-w-5xl" contentClassName="p-0">
        {previewUrl ? <iframe src={previewUrl} title={previewDocument?.name ?? "Documento"} className="h-full min-h-[70vh] w-full border-0" /> : null}
      </Dialog>
      <ErsDocumentDeleteConfirmDialog documentName={documentToDelete?.name ?? null} deleting={deleting} onOpenChange={(open) => { if (!open) setDocumentToDelete(null); }} onConfirm={() => void handleDelete()} />
    </div>
  );
}
