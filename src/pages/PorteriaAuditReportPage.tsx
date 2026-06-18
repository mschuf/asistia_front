/**
 * @file PorteriaAuditReportPage.tsx
 * @description Reporte superadmin de auditoría de visitas de portería.
 */
import { ClipboardList } from "lucide-react";
import { PorteriaAuditDetailModal } from "@/components/reports/PorteriaAuditDetailModal";
import { PorteriaAuditReportFilters } from "@/components/reports/PorteriaAuditReportFilters";
import { PorteriaAuditReportTable } from "@/components/reports/PorteriaAuditReportTable";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Loading } from "@/components/ui/loading";
import { Select } from "@/components/ui/select";
import { usePorteriaAuditReport } from "@/hooks/usePorteriaAuditReport";
import {
  isTicketsAllPageSize,
  parseTicketsPageSize,
  TICKETS_PAGE_SIZE_ALL,
  TICKETS_PAGE_SIZE_OPTIONS,
} from "@/lib/tickets";
import { useState } from "react";
import type { PorteriaAuditLog } from "@/types/pages/porteria-audit-report.types";

/** Vista principal de auditoría completa de portería para superadmin. */
export default function PorteriaAuditReportPage() {
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
  } = usePorteriaAuditReport();
  const [selectedRecord, setSelectedRecord] = useState<PorteriaAuditLog | null>(null);

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
          <h1 className="text-lg font-semibold">Auditoría de portería</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Trazabilidad completa de quién registró, editó, cerró o eliminó visitas.
        </p>
      </div>

      <PorteriaAuditReportFilters filters={filters} onChange={setFilters} onApply={applyFilters} />

      {loading && items.length === 0 ? <Loading label="Cargando auditoría..." /> : null}

      {error && !loading ? (
        <EmptyState
          title="No se pudo cargar la auditoría"
          description={error}
          action={
            <Button type="button" variant="outline" onClick={() => void refresh()}>
              Reintentar
            </Button>
          }
        />
      ) : (
        <>
          <PorteriaAuditReportTable
            items={items}
            selectedId={selectedRecord?.id ?? null}
            sortColumn={sort?.column ?? null}
            sortOrder={sort?.order ?? null}
            onSortColumnChange={setSortColumn}
            onRowClick={setSelectedRecord}
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
                  Mostrando {paginationFrom}-{paginationTo} de {pagination.total} eventos
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

      <PorteriaAuditDetailModal
        record={selectedRecord}
        open={selectedRecord !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedRecord(null);
        }}
      />
    </div>
  );
}
