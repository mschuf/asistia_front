import type { ReactNode } from "react";
import { AlertTriangle, Building2, ClipboardList, History, Ticket } from "lucide-react";
import { MobileRefreshFab } from "@/components/layout/MobileRefreshFab";
import { Loading } from "@/components/ui/loading";
import { TiOpenBySiteChart } from "@/components/tickets/TiOpenBySiteChart";
import type { TiMetricsResponse, TicketMetricSlice, MyTicketsMetricSlice } from "@/types/asistia";
import { cn } from "@/lib/utils";

interface TiMetricsProps {
  metrics: TiMetricsResponse | null;
  loading?: boolean;
  onGoToHistorial: () => void;
  onGoToHistorialForSite?: () => void;
  onRefresh?: () => void;
}

function MetricPercent({ slice }: { slice: TicketMetricSlice | MyTicketsMetricSlice }) {
  const openMonth = "openThisMonth" in slice ? slice.openThisMonth : 0;
  const totalMonth = slice.totalThisMonth;
  return (
    <p className="mt-1 text-sm text-muted-foreground">
      <span className="font-medium tabular-nums text-foreground">{slice.openPercent}%</span>
      <span className="ml-1">
        ({openMonth} / {totalMonth} del mes)
      </span>
    </p>
  );
}

interface MetricCardProps {
  label: string;
  value: number | string;
  icon: typeof Ticket;
  className: string;
  subtitle?: ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
}

function openCountLabel(count: number): string {
  return count === 1 ? "abierto" : "abiertos";
}

function MetricCard({
  label,
  value,
  icon: Icon,
  className,
  subtitle,
  onClick,
  ariaLabel
}: MetricCardProps) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums">
        {typeof value === "number" ? (
          <>
            {value}{" "}
            <span className="text-base font-medium">{openCountLabel(value)}</span>
          </>
        ) : (
          value
        )}
      </p>
      {subtitle}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel ?? label}
        className={cn(
          "rounded-md border p-4 text-left transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
      >
        {content}
      </button>
    );
  }

  return <div className={cn("rounded-md border p-4", className)}>{content}</div>;
}

export function TiMetrics({
  metrics,
  loading,
  onGoToHistorial,
  onGoToHistorialForSite,
  onRefresh,
}: TiMetricsProps) {
  if (loading && !metrics) {
    return (
      <>
        <div className="flex min-h-40 items-center justify-center">
          <Loading label="Cargando indicadores..." />
        </div>
        {onRefresh ? (
          <MobileRefreshFab visible onClick={onRefresh} loading={loading} />
        ) : null}
      </>
    );
  }

  if (!metrics) {
    return onRefresh ? (
      <MobileRefreshFab visible onClick={onRefresh} loading={loading} />
    ) : null;
  }

  const siteValue = metrics.mySite ? metrics.mySite.open : "—";
  const siteSubtitle = metrics.mySite ? (
    <MetricPercent slice={metrics.mySite} />
  ) : (
    <p className="mt-1 text-sm text-muted-foreground">Sin sede asignada en tu perfil</p>
  );

  return (
    <>
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Mi Sede"
          value={siteValue}
          icon={Building2}
          className={cn(
            "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-200",
            metrics.mySite && "cursor-pointer"
          )}
          onClick={metrics.mySite ? onGoToHistorialForSite : undefined}
          ariaLabel="Ir a historial filtrado por mi sede"
          subtitle={siteSubtitle}
        />
        <MetricCard
          label="Mis Tickets"
          value={metrics.myTickets.inProgress}
          icon={Ticket}
          className="cursor-pointer border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200"
          onClick={onGoToHistorial}
          ariaLabel="Ir a historial"
          subtitle={<MetricPercent slice={metrics.myTickets} />}
        />
        <MetricCard
          label="Mis Incidentes"
          value={metrics.myIncidents.open}
          icon={AlertTriangle}
          className="border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
          subtitle={<MetricPercent slice={metrics.myIncidents} />}
        />
        <MetricCard
          label="Mis Solicitudes"
          value={metrics.myRequests.open}
          icon={ClipboardList}
          className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"
          subtitle={<MetricPercent slice={metrics.myRequests} />}
        />
      </div>

      <TiOpenBySiteChart data={metrics.openByLocation} />

      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <History className="h-3.5 w-3.5" aria-hidden="true" />
        Mi Sede y Mis Tickets abren Historial con filtros aplicados
      </p>
    </div>
    {onRefresh ? (
      <MobileRefreshFab visible onClick={onRefresh} loading={loading} />
    ) : null}
  </>
  );
}
