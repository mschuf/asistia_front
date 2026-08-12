import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  Pencil,
  Plus,
  Power,
  Search,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  createRequestType,
  deactivateRequestType,
  listRequestTypes,
  updateRequestType,
  type RequestType,
  type RequestTypeSortColumn,
  type RequestTypeSortOrder,
} from "@/api/requestTypes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import { Select } from "@/components/ui/select";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";

const PAGE_SIZES = [15, 50, 100] as const;
const PAGE_SIZE_ALL = "all";
type PageSize = (typeof PAGE_SIZES)[number] | typeof PAGE_SIZE_ALL;

interface Filters {
  search: string;
  id: string;
  name: string;
  isActive: "" | "true" | "false";
}

interface SortState {
  column: RequestTypeSortColumn;
  order: RequestTypeSortOrder;
}

const EMPTY_FILTERS: Filters = { search: "", id: "", name: "", isActive: "" };

export default function RequestTypesPage() {
  const toast = useToast();
  const [items, setItems] = useState<RequestType[]>([]);
  const [draftFilters, setDraftFilters] = useState<Filters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(EMPTY_FILTERS);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [sort, setSort] = useState<SortState | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(15);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RequestType | null>(null);
  const [formName, setFormName] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<RequestType | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await listRequestTypes(
        {
          page,
          limit: pageSize === PAGE_SIZE_ALL ? 15 : pageSize,
          all: pageSize === PAGE_SIZE_ALL ? true : undefined,
          search: appliedFilters.search.trim() || undefined,
          id: appliedFilters.id ? Number(appliedFilters.id) : undefined,
          name: appliedFilters.name.trim() || undefined,
          isActive:
            appliedFilters.isActive === "" ? undefined : appliedFilters.isActive === "true",
          sortBy: sort?.column,
          sortOrder: sort?.order,
        },
        { showBackdrop: false },
      );
      setItems(response.items);
      setTotal(response.total);
      if (pageSize !== PAGE_SIZE_ALL) {
        const pages = Math.max(1, Math.ceil(response.total / pageSize));
        if (page > pages) setPage(pages);
      }
    } catch (loadError) {
      setItems([]);
      setTotal(0);
      setError(
        loadError instanceof Error ? loadError.message : "No se pudo cargar el catálogo de software.",
      );
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, pageSize, sort]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages =
    pageSize === PAGE_SIZE_ALL ? 1 : Math.max(1, Math.ceil(total / pageSize));
  const rangeFrom =
    total === 0 ? 0 : pageSize === PAGE_SIZE_ALL ? 1 : (page - 1) * pageSize + 1;
  const rangeTo =
    pageSize === PAGE_SIZE_ALL ? total : Math.min(page * pageSize, total);

  const hasAdvancedFilters = useMemo(
    () => Boolean(draftFilters.id || draftFilters.name || draftFilters.isActive),
    [draftFilters],
  );

  function applySearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedFilters({ ...draftFilters });
    setPage(1);
  }

  function changeSort(column: RequestTypeSortColumn) {
    setSort((current) => {
      if (!current || current.column !== column) return { column, order: "desc" };
      if (current.order === "desc") return { column, order: "asc" };
      return null;
    });
    setPage(1);
  }

  function openCreate() {
    setEditing(null);
    setFormName("");
    setFormActive(true);
    setDialogOpen(true);
  }

  function openEdit(item: RequestType) {
    setEditing(item);
    setFormName(item.name);
    setFormActive(item.isActive);
    setDialogOpen(true);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = formName.trim();
    if (!name) {
      toast.error("Ingresá un nombre.", "Software");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateRequestType(editing.id, { name, isActive: formActive });
        toast.success("Software actualizado.", "Software");
      } else {
        await createRequestType({ name, isActive: formActive });
        toast.success("Software creado.", "Software");
      }
      setDialogOpen(false);
      await load();
    } catch (saveError) {
      toast.error(
        saveError instanceof Error ? saveError.message : "No se pudo guardar el software.",
        "Software",
      );
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeactivate() {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      await deactivateRequestType(deactivateTarget.id);
      toast.success("Software desactivado.", "Software");
      setDeactivateTarget(null);
      await load();
    } catch (deactivateError) {
      toast.error(
        deactivateError instanceof Error
          ? deactivateError.message
          : "No se pudo desactivar el software.",
        "Software",
      );
    } finally {
      setDeactivating(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Software</h1>
          <p className="text-sm text-muted-foreground">
            Administración de tipos disponibles para tickets de software.
          </p>
        </div>
        <Button type="button" onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo software
        </Button>
      </div>

      <form className="rounded-md border bg-card p-4 shadow-soft" onSubmit={applySearch}>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={draftFilters.search}
            onChange={(event) =>
              setDraftFilters((current) => ({ ...current, search: event.target.value }))
            }
            className="px-9"
            placeholder="Buscar en todos los campos..."
            aria-label="Búsqueda general"
          />
          <button
            type="button"
            onClick={() => setAdvancedOpen((current) => !current)}
            className="absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Mostrar búsqueda avanzada"
            aria-expanded={advancedOpen}
          >
            <ChevronDown
              className={cn("h-4 w-4 transition-transform", advancedOpen && "rotate-180")}
              aria-hidden="true"
            />
          </button>
        </div>

        {advancedOpen ? (
          <div className="mt-4 grid gap-4 border-t pt-4 sm:grid-cols-3">
            <Field id="software-filter-id" label="ID">
              <Input
                id="software-filter-id"
                type="number"
                min={1}
                value={draftFilters.id}
                onChange={(event) =>
                  setDraftFilters((current) => ({ ...current, id: event.target.value }))
                }
                placeholder="ID exacto"
              />
            </Field>
            <Field id="software-filter-name" label="Nombre">
              <Input
                id="software-filter-name"
                value={draftFilters.name}
                onChange={(event) =>
                  setDraftFilters((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Contiene..."
              />
            </Field>
            <Field id="software-filter-status" label="Estado">
              <Select
                id="software-filter-status"
                value={draftFilters.isActive}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    isActive: event.target.value as Filters["isActive"],
                  }))
                }
              >
                <option value="">Todos</option>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </Select>
            </Field>
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-end gap-3">
          {hasAdvancedFilters ? (
            <span className="text-xs text-muted-foreground">Filtros avanzados preparados</span>
          ) : null}
          <Button type="submit" disabled={loading}>Buscar</Button>
        </div>
      </form>

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex min-h-40 items-center justify-center rounded-md border bg-card">
          <Loading label="Cargando software..." />
        </div>
      ) : error ? null : items.length === 0 ? (
        <EmptyState
          title="Sin software"
          description="No hay registros para los filtros aplicados."
        />
      ) : (
        <div className="overflow-hidden rounded-md border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <SortableHeader
                    column="id"
                    label="ID"
                    sort={sort}
                    onChange={changeSort}
                  />
                  <SortableHeader
                    column="name"
                    label="Nombre"
                    sort={sort}
                    onChange={changeSort}
                  />
                  <SortableHeader
                    column="isActive"
                    label="Estado"
                    sort={sort}
                    onChange={changeSort}
                  />
                  <th className="px-4 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 tabular-nums">{item.id}</td>
                    <td className="px-4 py-3 font-medium">{item.name || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={item.isActive ? "success" : "danger"}>
                        {item.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          title="Editar"
                          aria-label={`Editar ${item.name}`}
                          onClick={() => openEdit(item)}
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          title="Desactivar"
                          aria-label={`Desactivar ${item.name}`}
                          disabled={!item.isActive}
                          onClick={() => setDeactivateTarget(item)}
                        >
                          <Power className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {total > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Mostrar por página</span>
              <Select
                className="h-9 w-24"
                value={String(pageSize)}
                onChange={(event) => {
                  const value = event.target.value;
                  setPageSize(value === PAGE_SIZE_ALL ? PAGE_SIZE_ALL : Number(value) as PageSize);
                  setPage(1);
                }}
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
                <option value={PAGE_SIZE_ALL}>Todos</option>
              </Select>
            </label>
            <p className="text-sm text-muted-foreground">
              Mostrando {rangeFrom} - {rangeTo} de {total} elementos
            </p>
          </div>
          {pageSize !== PAGE_SIZE_ALL ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => current - 1)}
              >
                Anterior
              </Button>
              <span className="min-w-28 text-center text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((current) => current + 1)}
              >
                Siguiente
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => !saving && setDialogOpen(open)}
        title={editing ? "Editar software" : "Nuevo software"}
        description="El nombre aparecerá en el selector de creación de tickets."
      >
        <form className="space-y-4" onSubmit={(event) => void save(event)}>
          <Field id="software-name" label="Nombre">
            <Input
              id="software-name"
              value={formName}
              onChange={(event) => setFormName(event.target.value.slice(0, 255))}
              maxLength={255}
              required
              autoFocus
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={formActive}
              onChange={(event) => setFormActive(event.target.checked)}
            />
            Activo
          </label>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" disabled={saving} onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={Boolean(deactivateTarget)}
        onOpenChange={(open) => !open && !deactivating && setDeactivateTarget(null)}
        title="Desactivar software"
        description={`¿Desactivar “${deactivateTarget?.name ?? ""}”? Ya no aparecerá al crear tickets.`}
      >
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={deactivating}
            onClick={() => setDeactivateTarget(null)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={deactivating}
            onClick={() => void confirmDeactivate()}
          >
            {deactivating ? "Desactivando..." : "Desactivar"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function SortableHeader({
  column,
  label,
  sort,
  onChange,
}: {
  column: RequestTypeSortColumn;
  label: string;
  sort: SortState | null;
  onChange: (column: RequestTypeSortColumn) => void;
}) {
  const active = sort?.column === column;
  return (
    <th
      className="px-4 py-3 font-semibold"
      aria-sort={!active ? "none" : sort.order === "asc" ? "ascending" : "descending"}
    >
      <button
        type="button"
        className="inline-flex items-center gap-1.5 hover:text-foreground"
        onClick={() => onChange(column)}
      >
        {label}
        {!active ? (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" aria-hidden="true" />
        ) : sort.order === "asc" ? (
          <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
        )}
      </button>
    </th>
  );
}
