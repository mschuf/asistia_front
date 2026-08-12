/**
 * @file TicketsPage.tsx
 * @description Página principal de tickets con pestañas indicadores, crear e historial.
 */
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { MobileRefreshFab } from "@/components/layout/MobileRefreshFab";
import { WorkspaceHeader } from "@/components/layout/WorkspaceHeader";
import { TiMetrics } from "@/components/tickets/TiMetrics";

import { TicketFilters } from "@/components/tickets/TicketFilters";

import { TicketForm } from "@/components/tickets/TicketForm";

import { TicketAssignModal } from "@/components/tickets/TicketAssignModal";
import { TicketResolveModal } from "@/components/tickets/TicketResolveModal";
import { TicketTable } from "@/components/tickets/TicketTable";

import { Button } from "@/components/ui/button";

import { EmptyState } from "@/components/ui/empty-state";

import { Loading } from "@/components/ui/loading";

import { Select } from "@/components/ui/select";

import { cn } from "@/lib/utils";

import { useAuth } from "@/context/AuthContext";

import { useTiMetrics } from "@/hooks/useTiMetrics";

import { useTickets } from "@/hooks/useTickets";

import {
  buildAssigneeHistorialFilters,
  buildLocationHistorialFilters,
  buildSiteHistorialFilters,
  buildStatusHistorialFilters,
  buildMyGroupHistorialFilters,
  buildUnassignedHistorialFilters,
  isTicketsAllPageSize,
  parseTicketsPageSize,
  TICKETS_PAGE_SIZE_ALL,
  TICKETS_PAGE_SIZE_OPTIONS,
} from "@/lib/tickets";

import type { AsistiaTicket, AsistiaTicketStatus } from "@/types/asistia";

/**
 * Orquesta pestañas, métricas, formulario de creación e historial de tickets.
 * @returns Vista completa de gestión de tickets.
 */
export default function TicketsPage() {
  const navigate = useNavigate();
  const { user, isTechnician, isSuperAdmin } = useAuth();
  const refreshMetricsRef = useRef<(() => Promise<void>) | undefined>(
    undefined,
  );
  const ersPagePrefetchedRef = useRef(false);

  const {
    tab,

    setTab,

    goToHistorialWithFilters,

    categories,

    locations,

    historyLocations,

    technicians,

    tickets,

    pagination,

    setPage,

    setPageLimit,

    sort,

    setSortColumn,

    filters,

    setFilters,

    applyFilters,

    loading,

    catalogsLoading,

    locationsLoading,

    techniciansLoading,

    error,

    catalogsError,

    techniciansError,

    refreshTickets,

    patchTicket,

    handleCreateTicket,

    handleStatusChange,

    statusChanging,

    handleAssignTicket,

    assigning,
  } = useTickets({
    onTicketCreated: () => refreshMetricsRef.current?.(),
  });

  const {
    metrics: tiMetrics,

    loading: metricsLoading,

    error: metricsError,

    refreshMetrics,
  } = useTiMetrics({ enabled: tab === "metricas", isTabActive: tab === "metricas" });

  refreshMetricsRef.current = refreshMetrics;

  const [statusNoteModal, setStatusNoteModal] = useState<{
    ticket: AsistiaTicket;
    mode: "solved" | "closed";
  } | null>(null);
  const [assignTarget, setAssignTarget] = useState<AsistiaTicket | null>(null);

  useEffect(() => {
    if (tab !== "historial" || ersPagePrefetchedRef.current) return;
    ersPagePrefetchedRef.current = true;
    void import("./NuevoErsPage");
  }, [tab]);

  /**
   * Intercepta resolución de técnicos para abrir modal con nota obligatoria.
   * @param ticketId - ID del ticket.
   * @param status - Estado destino.
   * @returns void
   */
  const handleTicketStatusChange = (ticketId: number, status: AsistiaTicketStatus) => {
    if (!isTechnician && status !== "closed") {
      return;
    }

    if (status === "solved" && isTechnician) {
      const ticket = tickets.find((item) => Number(item.id) === Number(ticketId));
      if (ticket) {
        setStatusNoteModal({ ticket, mode: "solved" });
      }
      return;
    }

    if (status === "closed") {
      const ticket = tickets.find((item) => Number(item.id) === Number(ticketId));
      if (ticket) {
        setStatusNoteModal({ ticket, mode: "closed" });
      }
      return;
    }

    void handleStatusChange(ticketId, status);
  };

  const badgeLocations = locations.length > 0 ? locations : historyLocations;
  const numericLimit =
    typeof pagination.limit === "number" ? pagination.limit : TICKETS_PAGE_SIZE_OPTIONS[0];
  const showingAll = isTicketsAllPageSize(pagination.limit);
  const paginationFrom =
    pagination.total === 0 ? 0 : showingAll ? 1 : (pagination.page - 1) * numericLimit + 1;
  const paginationTo = showingAll
    ? pagination.total
    : Math.min(pagination.page * numericLimit, pagination.total);

  /** Recarga historial o métricas según la pestaña activa. @returns void */
  async function handleRefresh() {
    if (tab === "historial") {
      await refreshTickets();
    }

    if (tab === "metricas") {
      await refreshMetrics();
    }
  }

  return (
    <div
      className={cn(
        "space-y-5",
        tab === "historial" &&
          "w-full min-w-0 min-[1600px]:mx-auto min-[1600px]:max-w-[97.5vw]",
      )}
    >
      <WorkspaceHeader
        locations={badgeLocations}
        onRefresh={tab === "historial" || tab === "metricas" ? () => void handleRefresh() : undefined}
        refreshing={tab === "historial" ? loading : metricsLoading}
      />

      {metricsError && tab === "metricas" ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {metricsError}
        </p>
      ) : null}

      {tab === "metricas" ? (
        <TiMetrics
          metrics={tiMetrics}
          loading={metricsLoading}
          showMySite={isTechnician}
          isTechnician={isTechnician}
          onGoToHistorial={() => setTab("historial")}
          onGoToHistorialForSite={
            isTechnician
              ? () => {
                  const preset = buildSiteHistorialFilters(user);
                  if (preset) goToHistorialWithFilters(preset);
                }
              : undefined
          }
          onGoToHistorialForGroup={
            isTechnician
              ? () => goToHistorialWithFilters(buildMyGroupHistorialFilters())
              : undefined
          }
          onGoToHistorialForUnassigned={
            isTechnician
              ? () => goToHistorialWithFilters(buildUnassignedHistorialFilters())
              : undefined
          }
          onGoToHistorialForSolved={
            !isTechnician
              ? () => goToHistorialWithFilters(buildStatusHistorialFilters("solved"))
              : undefined
          }
          onGoToHistorialForClosed={
            !isTechnician
              ? () => goToHistorialWithFilters(buildStatusHistorialFilters("closed"))
              : undefined
          }
          onRefresh={() => void refreshMetrics()}
          showOpenBySiteChart={isTechnician}
          onGoToHistorialForLocation={
            isTechnician
              ? (locationId) => goToHistorialWithFilters(buildLocationHistorialFilters(locationId))
              : undefined
          }
          onGoToHistorialForAssignee={
            isTechnician
              ? (technicianId) => goToHistorialWithFilters(buildAssigneeHistorialFilters(technicianId))
              : undefined
          }
        />
      ) : null}

      {tab === "crear" && user ? (
        catalogsLoading ? (
          <div className="flex min-h-40 items-center justify-center">
            <Loading label="Cargando formulario..." />
          </div>
        ) : catalogsError ? (
          <EmptyState
            title="No se pudo cargar el formulario"
            description={catalogsError}
          />
        ) : (
          <TicketForm
            categories={categories}
            locations={locations}
            isTechnician={isTechnician}
            isSuperAdmin={isSuperAdmin}
            user={user}
            onSubmit={handleCreateTicket}
          />
        )
      ) : null}

      {tab === "historial" ? (
        <div className="space-y-4">
          <TicketFilters
            filters={filters}
            onChange={setFilters}
            onApply={applyFilters}
            locations={historyLocations}
            technicians={technicians}
            user={user}
            locationsLoading={locationsLoading}
            techniciansLoading={techniciansLoading}
          />

          {catalogsError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {catalogsError}
            </p>
          ) : null}

          {techniciansError ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {techniciansError}
            </p>
          ) : null}

          {error && !loading ? (
            <EmptyState
              title="No se pudieron cargar los tickets"
              description={error}
              action={
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void refreshTickets()}
                >
                  Reintentar
                </Button>
              }
            />
          ) : (
            <>
              <TicketTable
                tickets={tickets}
                sortColumn={sort?.column ?? null}
                sortOrder={sort?.order ?? null}
                onSortColumnChange={setSortColumn}
                onStatusChange={handleTicketStatusChange}
                statusChanging={statusChanging}
                onAssignClick={isTechnician ? setAssignTarget : undefined}
                onEscalate={
                  isTechnician
                    ? (ticket) => navigate(`/ers/escalar/${ticket.id}`)
                    : undefined
                }
                assigning={assigning}
                statusActionIds={
                  isTechnician && !isSuperAdmin
                    ? ["solved", "waiting"]
                    : isTechnician
                      ? undefined
                      : ["closed"]
                }
                isSuperAdmin={isSuperAdmin}
                showSoftware={isTechnician}
                onTicketUpdated={patchTicket}
              />

              <TicketResolveModal
                ticket={statusNoteModal?.ticket ?? null}
                mode={statusNoteModal?.mode}
                open={statusNoteModal !== null}
                onOpenChange={(open) => {
                  if (!open) setStatusNoteModal(null);
                }}
                submitting={
                  statusNoteModal !== null &&
                  statusChanging?.ticketId === Number(statusNoteModal.ticket.id) &&
                  statusChanging.status === statusNoteModal.mode
                }
                onConfirm={(resolutionNote) => {
                  if (!statusNoteModal) return;
                  const { ticket, mode } = statusNoteModal;
                  void handleStatusChange(ticket.id, mode, { resolutionNote }).then((ok) => {
                    if (ok) setStatusNoteModal(null);
                  });
                }}
              />

              <TicketAssignModal
                ticket={assignTarget}
                locations={historyLocations}
                open={assignTarget !== null}
                onOpenChange={(open) => {
                  if (!open) setAssignTarget(null);
                }}
                submitting={
                  assignTarget !== null &&
                  assigning?.ticketId === Number(assignTarget.id)
                }
                onConfirm={(input) => {
                  if (!assignTarget) return;
                  void handleAssignTicket(assignTarget.id, input).then((ok) => {
                    if (ok) setAssignTarget(null);
                  });
                }}
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
                      Mostrando {paginationFrom}-{paginationTo} de{" "}
                      {pagination.total} elementos
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
      ) : null}

      {tab === "historial" ? (
        <MobileRefreshFab
          visible
          onClick={() => void handleRefresh()}
          loading={loading}
        />
      ) : null}
    </div>
  );
}
