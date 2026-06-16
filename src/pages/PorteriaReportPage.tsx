/**
 * @file PorteriaReportPage.tsx
 * @description Reporte superadmin de visitas de portería.
 */
import { ClipboardList } from "lucide-react";
import { PorteriaReportFilters } from "@/components/reports/PorteriaReportFilters";
import { PorteriaReportTable } from "@/components/reports/PorteriaReportTable";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Loading } from "@/components/ui/loading";
import { Select } from "@/components/ui/select";
import { usePorteriaReport } from "@/hooks/usePorteriaReport";
import {
  isTicketsAllPageSize,
  parseTicketsPageSize,
  TICKETS_PAGE_SIZE_ALL,
  TICKETS_PAGE_SIZE_OPTIONS,
} from "@/lib/tickets";

/**
 * Vista de reporte de visitas de portería con filtros, tabla y paginación.
 * @returns Página del reporte superadmin.
 */
export default function PorteriaReportPage() {
  const {
    items,
    filters,
    setFilters,
    applyFilters,
    pagination,
    setPage,
    setPageLimit,
    sort,
    setSortColumn,
    loading,
    error,
    refresh,
    exporting,
    downloadReport,
  } = usePorteriaReport();

  const numericLimit =
    typeof pagination.limit === "number" ? pagination.limit : TICKETS_PAGE_SIZE_OPTIONS[0];
  const showingAll = isTicketsAllPageSize(pagination.limit);
  const paginationFrom =
    pagination.total === 0 ? 0 : showingAll ? 1 : (pagination.page - 1) * numericLimit + 1;
  const paginationTo = showingAll
    ? pagination.total
    : Math.min(pagination.page * numericLimit, pagination.total);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-muted-foreground">Super-Admin</p>
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <h1 className="text-lg font-semibold">Visitas de portería</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Reporte de ingresos y visitas registradas en portería.
        </p>
      </div>

      <PorteriaReportFilters filters={filters} onChange={setFilters} onApply={applyFilters} />

      {loading && items.length === 0 ? <Loading label="Cargando reporte..." /> : null}

      {error && !loading ? (
        <EmptyState
          title="No se pudo cargar el reporte"
          description={error}
          action={
            <Button type="button" variant="outline" onClick={() => void refresh()}>
              Reintentar
            </Button>
          }
        />
      ) : (
        <>
          <PorteriaReportTable
            items={items}
            sortColumn={sort?.column ?? null}
            sortOrder={sort?.order ?? null}
            onSortColumnChange={setSortColumn}
          />

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={Boolean(exporting)}
              onClick={() => void downloadReport("pdf")}
            >
              <PdfFileIcon className="mr-2 h-4 w-4 shrink-0" />
              {exporting === "pdf" ? "Generando PDF..." : "Descargar PDF"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={Boolean(exporting)}
              onClick={() => void downloadReport("xlsx")}
            >
              <ExcelFileIcon className="mr-2 h-4 w-4 shrink-0" />
              {exporting === "xlsx" ? "Generando Excel..." : "Descargar Excel"}
            </Button>
          </div>

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
    </div>
  );
}

/** Icono de archivo PDF. */
function PdfFileIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#DC2626"
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
      />
      <path fill="#fff" fillOpacity="0.9" d="M14 2v6h6" />
      <text
        x="12"
        y="16.5"
        fill="#fff"
        fontSize="5.5"
        fontWeight="700"
        textAnchor="middle"
        fontFamily="system-ui, sans-serif"
      >
        PDF
      </text>
    </svg>
  );
}

/** Icono de archivo Excel. */
function ExcelFileIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#16A34A"
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
      />
      <path fill="#fff" fillOpacity="0.9" d="M14 2v6h6" />
      <text
        x="12"
        y="16.5"
        fill="#fff"
        fontSize="5.5"
        fontWeight="700"
        textAnchor="middle"
        fontFamily="system-ui, sans-serif"
      >
        XLS
      </text>
    </svg>
  );
}
