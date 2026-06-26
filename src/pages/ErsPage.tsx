/**
 * @file ErsPage.tsx
 * @description Pantalla de listado de ERS para TI y final_user.
 */
import { useEffect, useState } from "react";
import { ApiError } from "@/api/apiClient";
import {
  listarEstadosProyecto,
  obtenerErs,
  type ErsListItem,
  type ErsProjectState,
} from "@/api/ers";
import { ErsEditDialog } from "@/components/ers/ErsEditDialog";
import { ErsFilters } from "@/components/ers/ErsFilters";
import { ErsTable } from "@/components/ers/ErsTable";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useErsList } from "@/hooks/useErsList";
import { ERS_PAGE_SIZE_ALL, ERS_PAGE_SIZE_OPTIONS, isErsAllPageSize, parseErsPageSize } from "@/lib/ers";

/** Página principal de ERS. */
export default function ErsPage() {
  const toast = useToast();
  const { isTechnician } = useAuth();
  const {
    items,
    filters,
    setFilters,
    applyFilters,
    sort,
    setSortColumn,
    pagination,
    setPage,
    setPageLimit,
    loading,
    error,
    reload,
  } = useErsList();
  const [states, setStates] = useState<ErsProjectState[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [editingRow, setEditingRow] = useState<ErsListItem | null>(null);
  const [editingDetail, setEditingDetail] = useState<Awaited<ReturnType<typeof obtenerErs>> | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingStates(true);
    void listarEstadosProyecto()
      .then((response) => {
        if (!cancelled) setStates(response);
      })
      .catch(() => {
        if (!cancelled) setStates([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingStates(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const numericLimit =
    typeof pagination.limit === "number" ? pagination.limit : ERS_PAGE_SIZE_OPTIONS[0];
  const showingAll = isErsAllPageSize(pagination.limit);
  const paginationFrom =
    pagination.total === 0 ? 0 : showingAll ? 1 : (pagination.page - 1) * numericLimit + 1;
  const paginationTo = showingAll ? pagination.total : Math.min(pagination.page * numericLimit, pagination.total);

  const openEdit = async (row: ErsListItem) => {
    setEditingRow(row);
    setLoadingDetail(true);
    setEditingDetail(null);
    try {
      const detail = await obtenerErs(row.projectId);
      setEditingDetail(detail);
    } catch (loadError) {
      const message = loadError instanceof ApiError ? loadError.message : "No se pudo cargar el detalle del ERS.";
      toast.error(message, "ERS");
      setEditingRow(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground">IRS</p>
          <h1 className="text-lg font-semibold">ERS</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isTechnician ? "Vista TI: edición de proyectos ERS." : "Vista usuario: seguimiento de tus ERS."}
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => void reload()}>
          Actualizar
        </Button>
      </div>

      <ErsFilters
        filters={filters}
        onChange={setFilters}
        onApply={applyFilters}
        states={states}
        isTechnician={isTechnician}
      />

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      {loading ? (
        <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground shadow-soft">
          Cargando ERS...
        </div>
      ) : (
        <ErsTable
          rows={items}
          isTechnician={isTechnician}
          sortColumn={sort?.column ?? null}
          sortOrder={sort?.order ?? null}
          onSortColumnChange={setSortColumn}
          onEdit={isTechnician ? (row) => void openEdit(row) : undefined}
        />
      )}

      {pagination.total > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="whitespace-nowrap">Mostrar por página</span>
              <Select
                aria-label="Mostrar por página"
                className="h-9 w-24 shrink-0 px-2 py-1 text-center text-sm font-medium tabular-nums text-foreground"
                value={showingAll ? ERS_PAGE_SIZE_ALL : String(pagination.limit)}
                onChange={(event) => {
                  const nextLimit = parseErsPageSize(event.target.value);
                  if (nextLimit) setPageLimit(nextLimit);
                }}
              >
                {ERS_PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
                <option value={ERS_PAGE_SIZE_ALL}>Todos</option>
              </Select>
            </label>
            <p className="text-sm text-muted-foreground">
              Mostrando {paginationFrom}-{paginationTo} de {pagination.total} elementos
            </p>
          </div>
          {!showingAll ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPage(pagination.page - 1)}
              >
                Anterior
              </Button>
              <span className="min-w-24 text-center text-sm text-muted-foreground">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage(pagination.page + 1)}
              >
                Siguiente
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {isTechnician ? (
        <ErsEditDialog
          open={editingRow !== null}
          onOpenChange={(open) => {
            if (!open) {
              setEditingRow(null);
              setEditingDetail(null);
            }
          }}
          detail={loadingDetail ? null : editingDetail}
          states={states}
          loadingStates={loadingStates}
          onSaved={(saved) => {
            setEditingDetail(saved);
            void reload();
          }}
        />
      ) : null}
    </div>
  );
}

