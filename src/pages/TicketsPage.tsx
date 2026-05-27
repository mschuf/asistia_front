import { BarChart3, FilePlus2, History, RefreshCw } from "lucide-react";
import { TiMetrics } from "@/components/tickets/TiMetrics";
import { TicketFilters } from "@/components/tickets/TicketFilters";
import { TicketForm } from "@/components/tickets/TicketForm";
import { TicketTable } from "@/components/tickets/TicketTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Loading } from "@/components/ui/loading";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useTickets } from "@/hooks/useTickets";
import { roleLabel } from "@/utils/role";
import type { TicketsTab } from "@/types/pages/tickets-page.types";

const desktopTabs: Array<{ tab: TicketsTab; label: string; icon: typeof BarChart3 }> = [
  { tab: "metricas", label: "Métricas", icon: BarChart3 },
  { tab: "crear", label: "Crear", icon: FilePlus2 },
  { tab: "historial", label: "Historial", icon: History }
];

export default function TicketsPage() {
  const { user, role, isTechnician } = useAuth();
  const {
    tab,
    setTab,
    categories,
    locations,
    filteredTickets,
    filters,
    setFilters,
    loading,
    error,
    refreshTickets,
    handleCreateTicket,
    handleStatusChange
  } = useTickets();

  if (loading && !filteredTickets.length && tab !== "crear") {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Loading label="Cargando tickets..." />
      </div>
    );
  }

  if (error && !filteredTickets.length && tab !== "crear") {
    return (
      <EmptyState
        title="No se pudieron cargar los tickets"
        description={error}
        action={
          <Button type="button" variant="outline" onClick={() => void refreshTickets()}>
            Reintentar
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div>
            <p className="text-lg font-semibold">Tickets</p>
            <p className="text-sm text-muted-foreground">
              {isTechnician
                ? "Gestioná solicitudes e incidentes asignados o del equipo."
                : "Creá y seguí tus solicitudes de soporte."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">{roleLabel(role)}</Badge>
            {user?.entityName ? <Badge variant="info">{user.entityName}</Badge> : null}
            {user?.locationId ? <Badge variant="default">Sede #{user.locationId}</Badge> : null}
          </div>
        </div>

        <div className="hidden sm:flex sm:items-center sm:gap-2">
          <div className="flex rounded-md border bg-card p-1">
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
          <Button type="button" variant="outline" size="sm" onClick={() => void refreshTickets()}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Actualizar
          </Button>
        </div>
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {tab === "metricas" ? <TiMetrics tickets={filteredTickets} /> : null}

      {tab === "crear" && user ? (
        <TicketForm
          categories={categories}
          locations={locations}
          isTechnician={isTechnician}
          user={user}
          onSubmit={handleCreateTicket}
        />
      ) : null}

      {tab === "historial" ? (
        <div className="space-y-4">
          <TicketFilters filters={filters} onChange={setFilters} />
          {loading ? (
            <div className="flex min-h-40 items-center justify-center">
              <Loading label="Cargando tickets..." />
            </div>
          ) : (
            <TicketTable
              tickets={filteredTickets}
              onStatusChange={(ticketId, status) => void handleStatusChange(ticketId, status)}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
