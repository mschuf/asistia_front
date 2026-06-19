/**
 * @file PorteriaCards.tsx
 * @description Grid de cards resumen para visitantes.
 */
import { AlertTriangle, Building2, CalendarDays, Factory, Layers, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PORTERIA_ADMINISTRACION_COLORS,
  PORTERIA_ALERT_COLORS,
  PORTERIA_AMBAS_ZONAS_COLORS,
  PORTERIA_FABRICA_COLORS,
  PORTERIA_SKY_METRIC_COLORS,
} from "@/lib/porteria.constants";
import type { PorteriaMetricCard, PorteriaMetricsDateFilterState } from "@/types/pages/porteria-page.types";
import { PorteriaMetricsDateFilter } from "@/components/porteria/PorteriaMetricsDateFilter";

interface PorteriaCardsProps {
  metrics: PorteriaMetricCard[];
  metricsDateFilter: PorteriaMetricsDateFilterState;
  onMetricsDateFilterChange: (filter: PorteriaMetricsDateFilterState) => void;
}

const METRIC_STYLES: Record<
  string,
  {
    icon: LucideIcon;
    cardClassName: string;
    iconClassName: string;
  }
> = {
  month: {
    icon: Users,
    cardClassName: PORTERIA_AMBAS_ZONAS_COLORS.metricCard,
    iconClassName: PORTERIA_AMBAS_ZONAS_COLORS.metricIcon,
  },
  day: {
    icon: CalendarDays,
    cardClassName:
      "border-amber-200/90 bg-gradient-to-br from-amber-50 via-amber-50/70 to-white text-amber-900 shadow-sm shadow-amber-200/30 dark:border-amber-800/70 dark:from-amber-950/60 dark:via-amber-900/35 dark:to-amber-950/45 dark:text-amber-100 dark:shadow-sm dark:shadow-amber-950/35",
    iconClassName:
      "bg-amber-100 text-amber-700 ring-1 ring-amber-200/50 dark:bg-amber-900/55 dark:text-amber-200 dark:ring-amber-700/45",
  },
  adminOnly: {
    icon: Building2,
    cardClassName: PORTERIA_ADMINISTRACION_COLORS.metricCard,
    iconClassName: PORTERIA_ADMINISTRACION_COLORS.metricIcon,
  },
  factoryOnly: {
    icon: Factory,
    cardClassName: PORTERIA_FABRICA_COLORS.metricCard,
    iconClassName: PORTERIA_FABRICA_COLORS.metricIcon,
  },
  bothZones: {
    icon: Layers,
    cardClassName: PORTERIA_SKY_METRIC_COLORS.metricCard,
    iconClassName: PORTERIA_SKY_METRIC_COLORS.metricIcon,
  },
  staleCheckout: {
    icon: AlertTriangle,
    cardClassName: PORTERIA_ALERT_COLORS.metricCard,
    iconClassName: PORTERIA_ALERT_COLORS.metricIcon,
  },
};

const DEFAULT_STYLE = METRIC_STYLES.month;

/**
 * Muestra metricas principales del modulo Porteria.
 * @param props - Coleccion de metricas.
 * @returns Grid responsive de cards.
 */
export function PorteriaCards({
  metrics,
  metricsDateFilter,
  onMetricsDateFilterChange,
}: PorteriaCardsProps) {
  return (
    <section className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map((metric) => {
          const style = METRIC_STYLES[metric.id] ?? DEFAULT_STYLE;
          const Icon = style.icon;
          const isAlert = metric.id === "staleCheckout" && Number(metric.value) > 0;

          return (
            <article
              key={metric.id}
              className={cn(
                "relative overflow-hidden rounded-xl border p-4 shadow-soft transition-shadow hover:shadow-md",
                style.cardClassName,
                isAlert && "porteria-blink-peligro",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-inherit/80">{metric.title}</p>
                  {metric.subtitle ? (
                    <p className="mt-0.5 text-xs text-inherit/60">{metric.subtitle}</p>
                  ) : null}
                  <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">{metric.value}</p>
                </div>
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm ring-1 ring-black/5 dark:ring-white/10",
                    style.iconClassName,
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
              </div>
            </article>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        
        <div className="w-full sm:ml-auto sm:w-auto">
          <PorteriaMetricsDateFilter value={metricsDateFilter} onChange={onMetricsDateFilterChange} />
        </div>
      </div>
    </section>
  );
}
