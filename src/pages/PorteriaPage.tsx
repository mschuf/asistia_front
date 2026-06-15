/**
 * @file PorteriaPage.tsx
 * @description Pagina principal del modulo Porteria.
 */
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { PorteriaCards } from "@/components/porteria/PorteriaCards";
import { PorteriaHistoryFilters } from "@/components/porteria/PorteriaHistoryFilters";
import { PorteriaHistoryTable } from "@/components/porteria/PorteriaHistoryTable";
import { PorteriaSeguimientoCards } from "@/components/porteria/PorteriaSeguimientoCards";
import { PorteriaTabs } from "@/components/porteria/PorteriaTabs";
import { PorteriaVisitDetailModal } from "@/components/porteria/PorteriaVisitDetailModal";
import { usePorteria } from "@/hooks/usePorteria";
import {
  isPorteriaAllPageSize,
  parsePorteriaPageSize,
  PORTERIA_PAGE_SIZE_ALL,
  PORTERIA_PAGE_SIZE_OPTIONS,
} from "@/lib/porteria";

/**
 * Renderiza cards, tabs y placeholders funcionales de Porteria.
 * @returns Vista del modulo Porteria.
 */
export default function PorteriaPage() {
  const {
    tab,
    setTab,
    metrics,
    trackingVisitors,
    historyRows,
    historyPagination,
    filters,
    setFilters,
    applyFilters,
    sort,
    setSortColumn,
    setPage,
    setPageLimit,
    selectedRecord,
    selectRecord,
    clearSelectedRecord,
  } = usePorteria();

  const numericLimit =
    typeof historyPagination.limit === "number"
      ? historyPagination.limit
      : PORTERIA_PAGE_SIZE_OPTIONS[0];
  const showingAll = isPorteriaAllPageSize(historyPagination.limit);
  const paginationFrom =
    historyPagination.total === 0
      ? 0
      : showingAll
        ? 1
        : (historyPagination.page - 1) * numericLimit + 1;
  const paginationTo = showingAll
    ? historyPagination.total
    : Math.min(historyPagination.page * numericLimit, historyPagination.total);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold">porterIA</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Seguimiento de visitas y control de ingresos.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="info">Acceso restringido</Badge>
          </div>
        </div>

        <PorteriaTabs value={tab} onChange={setTab} />
      </div>

      {tab === "seguimiento" ? (
        <>
          <PorteriaCards metrics={metrics} />
          <PorteriaSeguimientoCards visitors={trackingVisitors} />
        </>
      ) : (
        <section className="space-y-4">
          <PorteriaHistoryFilters
            filters={filters}
            onChange={setFilters}
            onApply={applyFilters}
          />

          <PorteriaHistoryTable
            rows={historyRows}
            selectedId={selectedRecord?.id ?? null}
            sortColumn={sort?.column ?? null}
            sortOrder={sort?.order ?? null}
            onSortColumnChange={setSortColumn}
            onRowClick={selectRecord}
          />

          {historyPagination.total > 0 ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="whitespace-nowrap">Mostrar por pagina</span>
                  <Select
                    aria-label="Mostrar por pagina"
                    className="h-9 w-24 shrink-0 px-2 py-1 text-center text-sm font-medium tabular-nums text-foreground"
                    value={
                      isPorteriaAllPageSize(historyPagination.limit)
                        ? PORTERIA_PAGE_SIZE_ALL
                        : String(historyPagination.limit)
                    }
                    onChange={(event) => {
                      const nextLimit = parsePorteriaPageSize(event.target.value);
                      if (nextLimit) setPageLimit(nextLimit);
                    }}
                  >
                    {PORTERIA_PAGE_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                    <option value={PORTERIA_PAGE_SIZE_ALL}>Todos</option>
                  </Select>
                </label>
                <p className="text-sm text-muted-foreground">
                  Mostrando {paginationFrom}-{paginationTo} de {historyPagination.total} visitas
                </p>
              </div>
              {!showingAll ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={historyPagination.page <= 1}
                    onClick={() => setPage(historyPagination.page - 1)}
                  >
                    Anterior
                  </Button>
                  <span className="min-w-24 text-center text-sm text-muted-foreground">
                    Pagina {historyPagination.page} de {historyPagination.totalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={historyPagination.page >= historyPagination.totalPages}
                    onClick={() => setPage(historyPagination.page + 1)}
                  >
                    Siguiente
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}

          <PorteriaVisitDetailModal
            record={selectedRecord}
            open={selectedRecord !== null}
            onOpenChange={(open) => {
              if (!open) clearSelectedRecord();
            }}
          />
        </section>
      )}
    </div>
  );
}
