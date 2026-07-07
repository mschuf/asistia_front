/**
 * @file TicketsCloseBulkPage.tsx
 * @description Cierre masivo de tickets 100% vía SQL sobre GLPI (super admin).
 */
import { useState } from "react";
import { Lock } from "lucide-react";
import { CloseBulkConfirmDialog } from "@/components/tickets-close/CloseBulkConfirmDialog";
import { TicketCloseDetailModal } from "@/components/tickets-close/TicketCloseDetailModal";
import { TicketsCloseFilters } from "@/components/tickets-close/TicketsCloseFilters";
import { TicketsCloseTable } from "@/components/tickets-close/TicketsCloseTable";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import { Select } from "@/components/ui/select";
import { useToast } from "@/context/ToastContext";
import { useTicketsCloseBulk } from "@/hooks/useTicketsCloseBulk";
import {
  isTicketsAllPageSize,
  parseTicketsPageSize,
  TICKETS_PAGE_SIZE_ALL,
  TICKETS_PAGE_SIZE_OPTIONS,
} from "@/lib/tickets";

/**
 * Página de cierre masivo de tickets: filtros, tabla seleccionable y confirmación.
 * @returns Página del cierre masivo superadmin.
 */
export default function TicketsCloseBulkPage() {
  const toast = useToast();
  const {
    items,
    filters,
    setFilters,
    applyFilters,
    hasQueried,
    search,
    setSearch,
    applySearch,
    pagination,
    setPage,
    setPageLimit,
    sort,
    setSortColumn,
    loading,
    error,
    refresh,
    selectedIds,
    toggleSelected,
    toggleSelectAllVisible,
    closing,
    closeSelected,
  } = useTicketsCloseBulk();

  const [detailTicketId, setDetailTicketId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const numericLimit =
    typeof pagination.limit === "number" ? pagination.limit : TICKETS_PAGE_SIZE_OPTIONS[0];
  const showingAll = isTicketsAllPageSize(pagination.limit);
  const paginationFrom =
    pagination.total === 0 ? 0 : showingAll ? 1 : (pagination.page - 1) * numericLimit + 1;
  const paginationTo = showingAll
    ? pagination.total
    : Math.min(pagination.page * numericLimit, pagination.total);

  const handleConfirmClose = async () => {
    const result = await closeSelected();
    setConfirmOpen(false);
    if (!result) return;

    const parts = [`Se cerraron ${result.closed} de ${result.requested} tickets seleccionados.`];
    if (result.skipped > 0) parts.push(`${result.skipped} ya no eran elegibles.`);
    if (result.failed > 0) parts.push(`${result.failed} fallaron.`);

    if (result.failed > 0) {
      toast.error(parts.join(" "), "Cierre masivo");
    } else {
      toast.success(parts.join(" "), "Cierre masivo");
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-muted-foreground">Super-Admin</p>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <h1 className="text-lg font-semibold">Cerrar tickets</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Consulta y cierre masivo de tickets directamente en la base de datos de GLPI.
        </p>
      </div>

      <TicketsCloseFilters
        filters={filters}
        onChange={setFilters}
        onApply={applyFilters}
        loading={loading}
      />

      {!hasQueried ? (
        <EmptyState
          title="Sin consultas todavía"
          description="Elegí un rango de fechas y estados, y presioná Consultar para ver los tickets candidatos."
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <form
              className="flex w-full max-w-sm items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                applySearch();
              }}
            >
              <Input
                placeholder="Buscar por ID, asunto o descripción"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <Button type="submit" variant="outline">
                Buscar
              </Button>
            </form>
            {selectedIds.size > 0 ? (
              <div className="flex items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  {selectedIds.size}{" "}
                  {selectedIds.size === 1 ? "ticket seleccionado" : "tickets seleccionados"}
                </p>
                <Button type="button" onClick={() => setConfirmOpen(true)}>
                  Cerrar seleccionados
                </Button>
              </div>
            ) : null}
          </div>

          {loading && items.length === 0 ? <Loading label="Cargando tickets..." /> : null}

          {error && !loading ? (
            <EmptyState
              title="No se pudo cargar el listado"
              description={error}
              action={
                <Button type="button" variant="outline" onClick={() => void refresh()}>
                  Reintentar
                </Button>
              }
            />
          ) : (
            <>
              <TicketsCloseTable
                items={items}
                selectedIds={selectedIds}
                onToggleRow={toggleSelected}
                onToggleAllVisible={toggleSelectAllVisible}
                onViewDetail={setDetailTicketId}
                sortColumn={sort?.column ?? null}
                sortOrder={sort?.order ?? null}
                onSortColumnChange={setSortColumn}
              />

              {pagination.total > 0 ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="whitespace-nowrap">Mostrar por página</span>
                      <Select
                        aria-label="Mostrar por página"
                        className="h-9 w-24 shrink-0 px-2 py-1 text-center text-sm font-medium tabular-nums text-foreground"
                        value={
                          isTicketsAllPageSize(pagination.limit)
                            ? TICKETS_PAGE_SIZE_ALL
                            : String(pagination.limit)
                        }
                        onChange={(event) => {
                          const nextLimit = parseTicketsPageSize(event.target.value);
                          if (nextLimit) setPageLimit(nextLimit);
                        }}
                      >
                        {TICKETS_PAGE_SIZE_OPTIONS.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                        <option value={TICKETS_PAGE_SIZE_ALL}>Todos</option>
                      </Select>
                    </label>
                    <p className="text-sm text-muted-foreground">
                      Mostrando {paginationFrom}-{paginationTo} de {pagination.total} registros
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
            </>
          )}
        </>
      )}

      <TicketCloseDetailModal
        ticketId={detailTicketId}
        open={detailTicketId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailTicketId(null);
        }}
      />

      <CloseBulkConfirmDialog
        open={confirmOpen}
        count={selectedIds.size}
        loading={closing}
        onOpenChange={setConfirmOpen}
        onConfirm={() => void handleConfirmClose()}
      />
    </div>
  );
}
