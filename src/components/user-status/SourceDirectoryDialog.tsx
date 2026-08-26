import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, Download, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ApiError } from "@/api/apiClient";
import { triggerBrowserDownload } from "@/api/reports";
import {
  downloadSourceDirectoryExcel,
  listSourceDirectory,
  USER_STATUS_SOURCES,
  type SourceDirectoryResponse,
  type SourceDirectoryUser,
  type UserStatusCode,
  type UserStatusSource,
} from "@/api/userStatus";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";

const SOURCE_LABELS: Record<UserStatusSource, string> = { AD: "AD", SAP: "SAP", OFFICE: "Office", GLPI: "GLPI" };
const STATUS_LABELS: Record<UserStatusCode, string> = {
  ACTIVO: "Activo", INACTIVO: "Inactivo", BLOQUEADO: "Bloqueado", EXPIRADO: "Expirado",
  NO_ENCONTRADO: "No encontrado", ERROR: "Error", DESCONOCIDO: "Desconocido",
};
const STATUS_VARIANT: Record<UserStatusCode, BadgeProps["variant"]> = {
  ACTIVO: "success", INACTIVO: "danger", BLOQUEADO: "warning", EXPIRADO: "warning",
  NO_ENCONTRADO: "default", ERROR: "danger", DESCONOCIDO: "info",
};
type PageSize = 15 | 50 | 100 | "all";
type SortColumn = "identifier" | "name" | "status" | "email";

interface DirectoryFilters {
  search: string;
  identifier: string;
  name: string;
  status: "" | UserStatusCode;
  email: string;
}

const EMPTY_FILTERS: DirectoryFilters = { search: "", identifier: "", name: "", status: "", email: "" };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SourceDirectoryDialog({ open, onOpenChange }: Props) {
  const toast = useToast();
  const [directory, setDirectory] = useState<SourceDirectoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [source, setSource] = useState<UserStatusSource>("AD");
  const [draftFilters, setDraftFilters] = useState<DirectoryFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<DirectoryFilters>(EMPTY_FILTERS);
  const [advanced, setAdvanced] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<PageSize>(15);
  const [sort, setSort] = useState<{ column: SortColumn; order: "asc" | "desc" } | null>(null);

  useEffect(() => {
    if (!open) {
      setDirectory(null); setError(null); setSource("AD");
      setDraftFilters(EMPTY_FILTERS); setAppliedFilters(EMPTY_FILTERS);
      setAdvanced(false); setPage(1); setLimit(15); setSort(null);
      return;
    }
    const controller = new AbortController();
    setLoading(true); setError(null);
    void listSourceDirectory(controller.signal)
      .then((result) => { if (!controller.signal.aborted) setDirectory(result); })
      .catch((caught) => {
        if (controller.signal.aborted) return;
        setError(caught instanceof ApiError ? caught.message : "No se pudo cargar el directorio de fuentes.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [open]);

  const bucket = directory?.[source];
  const filtered = useMemo(() => {
    const items = bucket?.items ?? [];
    const search = appliedFilters.search.trim().toLowerCase();
    const matched = items.filter((row) => {
      if (appliedFilters.identifier && !row.identifier.toLowerCase().includes(appliedFilters.identifier.trim().toLowerCase())) return false;
      if (appliedFilters.name && !row.name.toLowerCase().includes(appliedFilters.name.trim().toLowerCase())) return false;
      if (appliedFilters.status && row.status !== appliedFilters.status) return false;
      if (appliedFilters.email && !(row.email ?? "").toLowerCase().includes(appliedFilters.email.trim().toLowerCase())) return false;
      if (!search) return true;
      return [row.identifier, row.name, row.email, row.status, row.detail, row.externalId, row.schema]
        .filter(Boolean).some((value) => String(value).toLowerCase().includes(search));
    });
    if (!sort) return matched;
    return [...matched].sort((left, right) => {
      const a = String(left[sort.column] ?? "");
      const b = String(right[sort.column] ?? "");
      const compared = a.localeCompare(b, "es", { sensitivity: "base" });
      return sort.order === "asc" ? compared : -compared;
    });
  }, [appliedFilters, bucket?.items, sort]);

  const total = filtered.length;
  const totalPages = limit === "all" ? 1 : Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const pageItems = limit === "all" ? filtered : filtered.slice((safePage - 1) * limit, safePage * limit);
  const from = total === 0 ? 0 : limit === "all" ? 1 : (safePage - 1) * limit + 1;
  const to = limit === "all" ? total : Math.min(safePage * limit, total);

  function applyFilters() {
    setPage(1);
    setAppliedFilters({ ...draftFilters });
  }

  function toggleSort(column: SortColumn) {
    setPage(1);
    setSort((current) => {
      if (!current || current.column !== column) return { column, order: "desc" };
      if (current.order === "desc") return { column, order: "asc" };
      return null;
    });
  }

  async function downloadExcel() {
    setExporting(true);
    toast.info("Generando Excel… la consulta a las 4 fuentes puede tardar.", "Directorio de fuentes");
    try {
      const file = await downloadSourceDirectoryExcel();
      triggerBrowserDownload(file.blob, file.filename);
      toast.success("Excel descargado.", "Directorio de fuentes");
    } catch (caught) {
      toast.error(caught instanceof ApiError ? caught.message : "No se pudo descargar el Excel.", "Directorio de fuentes");
    } finally {
      setExporting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Directorio de fuentes"
      description="Usuarios actuales en AD, SAP, Office y GLPI. Solo lectura; no se modifica ninguna base."
      className="max-h-[min(92vh,880px)] max-w-6xl"
      headerActions={
        <Button type="button" variant="outline" className="gap-2" disabled={loading || exporting} onClick={() => void downloadExcel()}>
          <Download className="h-4 w-4" aria-hidden="true" />
          {exporting ? "Generando…" : "Descargar Excel"}
        </Button>
      }
    >
      {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="py-8 text-center text-sm text-muted-foreground">Consultando las 4 fuentes… esto puede tardar.</p> : directory ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1 border-b" role="tablist" aria-label="Fuentes">
            {USER_STATUS_SOURCES.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={source === item}
                className={cn(
                  "rounded-t-md px-3 py-2 text-sm font-medium",
                  source === item ? "border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => { setSource(item); setPage(1); }}
              >
                {SOURCE_LABELS[item]} ({directory[item].items.length})
              </button>
            ))}
          </div>

          {bucket?.error ? <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{bucket.error}</p> : null}

          <div className="rounded-md border bg-card p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  value={draftFilters.search}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, search: event.target.value }))}
                  placeholder="Buscar en todos los campos..."
                  className="pl-9 pr-10"
                  aria-label="Búsqueda general"
                />
                <button
                  type="button"
                  onClick={() => setAdvanced((current) => !current)}
                  className="absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-expanded={advanced}
                  aria-label={advanced ? "Ocultar búsqueda avanzada" : "Mostrar búsqueda avanzada"}
                >
                  <ChevronDown className={cn("h-4 w-4 transition-transform", advanced && "rotate-180")} aria-hidden="true" />
                </button>
              </div>
              <Button type="button" className="gap-2 sm:w-auto" onClick={applyFilters}>
                <Search className="h-4 w-4" aria-hidden="true" />
                Buscar
              </Button>
            </div>
            {advanced ? (
              <div className="mt-3 grid gap-3 border-t pt-3 sm:grid-cols-2 xl:grid-cols-4">
                <FilterInput label="Identificador" value={draftFilters.identifier} onChange={(value) => setDraftFilters((current) => ({ ...current, identifier: value }))} />
                <FilterInput label="Nombre" value={draftFilters.name} onChange={(value) => setDraftFilters((current) => ({ ...current, name: value }))} />
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Estado</span>
                  <Select value={draftFilters.status} onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value as DirectoryFilters["status"] }))}>
                    <option value="">Todos</option>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </Select>
                </label>
                <FilterInput label="Correo" value={draftFilters.email} onChange={(value) => setDraftFilters((current) => ({ ...current, email: value }))} />
              </div>
            ) : null}
          </div>

          {pageItems.length === 0 ? <EmptyState title="Sin usuarios" description="No hay resultados para los filtros aplicados en esta fuente." /> : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-muted text-xs uppercase text-muted-foreground">
                  <tr>
                    <SortableHeader column="identifier" label="Identificador" sort={sort} onSort={toggleSort} />
                    <SortableHeader column="name" label="Nombre" sort={sort} onSort={toggleSort} />
                    <SortableHeader column="status" label="Estado" sort={sort} onSort={toggleSort} />
                    <th className="px-3 py-2 font-semibold">Detalle</th>
                    <th className="px-3 py-2 font-semibold">Id externo</th>
                    <SortableHeader column="email" label="Correo" sort={sort} onSort={toggleSort} />
                    {source === "SAP" ? <th className="px-3 py-2 font-semibold">Esquema</th> : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pageItems.map((row) => (
                    <DirectoryRow key={`${row.source}-${row.identifier}-${row.schema ?? ""}`} row={row} showSchema={source === "SAP"} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {total > 0 ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Mostrar por página</span>
                  <Select className="h-9 w-24 text-center" value={String(limit)} onChange={(event) => { setPage(1); setLimit((event.target.value === "all" ? "all" : Number(event.target.value)) as PageSize); }}>
                    <option value="15">15</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <option value="all">Todos</option>
                  </Select>
                </label>
                <p className="text-sm text-muted-foreground">Mostrando {from} - {to} de {total} elementos</p>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" disabled={safePage <= 1 || limit === "all"} onClick={() => setPage(safePage - 1)}>Anterior</Button>
                <span className="min-w-28 text-center text-sm text-muted-foreground">Página {safePage} de {totalPages}</span>
                <Button type="button" variant="outline" size="sm" disabled={safePage >= totalPages || limit === "all"} onClick={() => setPage(safePage + 1)}>Siguiente</Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </Dialog>
  );
}

function DirectoryRow({ row, showSchema }: { row: SourceDirectoryUser; showSchema: boolean }) {
  return (
    <tr className="hover:bg-muted/40">
      <td className="px-3 py-2 font-medium">{row.identifier}</td>
      <td className="px-3 py-2">{row.name}</td>
      <td className="px-3 py-2"><Badge variant={STATUS_VARIANT[row.status]}>{STATUS_LABELS[row.status]}</Badge></td>
      <td className="px-3 py-2 text-muted-foreground">{row.detail ?? "—"}</td>
      <td className="px-3 py-2 text-muted-foreground">{row.externalId ?? "—"}</td>
      <td className="px-3 py-2">{row.email ?? "—"}</td>
      {showSchema ? <td className="px-3 py-2">{row.schema ?? "—"}</td> : null}
    </tr>
  );
}

function SortableHeader({ column, label, sort, onSort }: { column: SortColumn; label: string; sort: { column: SortColumn; order: "asc" | "desc" } | null; onSort: (column: SortColumn) => void }) {
  const active = sort?.column === column;
  return (
    <th className="px-3 py-2 font-semibold" aria-sort={active ? (sort.order === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" onClick={() => onSort(column)} className="inline-flex items-center gap-1.5 hover:text-foreground">
        {label}
        {active ? (sort.order === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />}
      </button>
    </th>
  );
}

function FilterInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
