import { BarChart3, FilePlus2, History, RefreshCw } from "lucide-react";
import { useRef, useState } from "react";

import { MobileRefreshFab } from "@/components/layout/MobileRefreshFab";
import { TiMetrics } from "@/components/tickets/TiMetrics";

import { TicketFilters } from "@/components/tickets/TicketFilters";

import { TicketForm } from "@/components/tickets/TicketForm";

import { TicketAssignModal } from "@/components/tickets/TicketAssignModal";
import { TicketResolveModal } from "@/components/tickets/TicketResolveModal";
import { TicketTable } from "@/components/tickets/TicketTable";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import { EmptyState } from "@/components/ui/empty-state";

import { Loading } from "@/components/ui/loading";

import { cn } from "@/lib/utils";

import { useAuth } from "@/context/AuthContext";

import { useTiMetrics } from "@/hooks/useTiMetrics";

import { useTickets } from "@/hooks/useTickets";

import {
  buildSiteHistorialFilters,
  findLocationById,
  locationCompanyName,
  locationDisplayName,
} from "@/lib/tickets";

import { roleLabel } from "@/utils/role";

import type { AsistiaTicket, AsistiaTicketStatus } from "@/types/asistia";
import type { TicketsTab } from "@/types/pages/tickets-page.types";

const desktopTabs: Array<{
  tab: TicketsTab;
  label: string;
  icon: typeof BarChart3;
}> = [
  { tab: "metricas", label: "Indicadores", icon: BarChart3 },

  { tab: "crear", label: "Crear", icon: FilePlus2 },

  { tab: "historial", label: "Historial", icon: History },
];

export default function TicketsPage() {
  const { user, role, isTechnician } = useAuth();
  const refreshMetricsRef = useRef<(() => Promise<void>) | undefined>(
    undefined,
  );

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
  } = useTiMetrics({ enabled: isTechnician, isTabActive: tab === "metricas" });

  refreshMetricsRef.current = refreshMetrics;

  const [resolveTarget, setResolveTarget] = useState<AsistiaTicket | null>(null);
  const [assignTarget, setAssignTarget] = useState<AsistiaTicket | null>(null);

  const handleTicketStatusChange = (ticketId: number, status: AsistiaTicketStatus) => {
    if (status === "solved" && isTechnician) {
      const ticket = tickets.find((item) => Number(item.id) === Number(ticketId));
      if (ticket) {
        setResolveTarget(ticket);
      }
      return;
    }
    void handleStatusChange(ticketId, status);
  };

  const userLocation = findLocationById(locations, user?.locationId);

  const userLocationName = userLocation
    ? locationDisplayName(userLocation)
    : null;

  const userCompanyName = userLocationName
    ? locationCompanyName(userLocationName)
    : null;

  const paginationFrom =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const paginationTo = Math.min(
    pagination.page * pagination.limit,
    pagination.total,
  );

  async function handleRefresh() {
    if (tab === "historial") {
      await refreshTickets();
    }

    if (tab === "metricas" && isTechnician) {
      await refreshMetrics();
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div>
            {/*<p className="text-lg font-semibold">Tickets</p>*/}
            {/* <p className="text-sm text-muted-foreground">
              {isTechnician
                ? "Gestioná solicitudes e incidentes asignados o del equipo."
                : "Creá y seguí tus solicitudes de soporte."}
            </p> */}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant={role === "technician" ? "success" : "default"}>
              {roleLabel(role)}
            </Badge>

            {user?.name ? (
              <Badge className="bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950/40 dark:text-orange-200 dark:ring-orange-800">
                {user.name}
              </Badge>
            ) : null}

            {userCompanyName ? (
              <Badge variant="info">{userCompanyName}</Badge>
            ) : null}

            {userLocationName ? (
              <Badge variant="default">{userLocationName}</Badge>
            ) : null}
          </div>
        </div>

        <div className="ml-auto hidden shrink-0 items-center gap-2 sm:flex">
          {tab === "historial" || (tab === "metricas" && isTechnician) ? (
            <div className="flex shrink-0 rounded-md border bg-card p-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => void handleRefresh()}
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          ) : null}

          <div className="flex shrink-0 rounded-md border bg-card p-1">
            {desktopTabs.map(({ tab: nextTab, label, icon: Icon }) => (
              <Button
                key={nextTab}
                type="button"
                size="sm"
                variant={tab === nextTab ? "default" : "ghost"}
                className={cn("gap-2")}
                onClick={() => setTab(nextTab)}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />

                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {metricsError && tab === "metricas" && isTechnician ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {metricsError}
        </p>
      ) : null}

      {tab === "metricas" && isTechnician ? (
        <TiMetrics
          metrics={tiMetrics}
          loading={metricsLoading}
          onGoToHistorial={() => setTab("historial")}
          onGoToHistorialForSite={() => {
            const preset = buildSiteHistorialFilters(user);
            if (preset) goToHistorialWithFilters(preset);
          }}
          onRefresh={() => void refreshMetrics()}
        />
      ) : null}

      {tab === "metricas" && !isTechnician ? (
        <EmptyState
          title="Indicadores"
          description="Las indicadores detalladas están disponibles para el rol de soporte TI."
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
                onStatusChange={handleTicketStatusChange}
                statusChanging={statusChanging}
                onAssignClick={isTechnician ? setAssignTarget : undefined}
                assigning={assigning}
              />

              <TicketResolveModal
                ticket={resolveTarget}
                open={resolveTarget !== null}
                onOpenChange={(open) => {
                  if (!open) setResolveTarget(null);
                }}
                submitting={
                  resolveTarget !== null &&
                  statusChanging?.ticketId === Number(resolveTarget.id) &&
                  statusChanging.status === "solved"
                }
                onConfirm={(resolutionNote) => {
                  if (!resolveTarget) return;
                  void handleStatusChange(resolveTarget.id, "solved", { resolutionNote }).then(
                    (ok) => {
                      if (ok) setResolveTarget(null);
                    }
                  );
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
                  <p className="text-sm text-muted-foreground">
                    Mostrando {paginationFrom}-{paginationTo} de{" "}
                    {pagination.total} tickets
                  </p>
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
