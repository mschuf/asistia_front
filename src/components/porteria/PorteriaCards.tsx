/**
 * @file PorteriaCards.tsx
 * @description Grid de cards resumen para visitantes.
 */
import { Building2, CalendarDays, Factory, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PORTERIA_ADMINISTRACION_COLORS,
  PORTERIA_FABRICA_COLORS,
} from "@/lib/porteria.constants";
import type { PorteriaMetricCard } from "@/types/pages/porteria-page.types";

interface PorteriaCardsProps {
  metrics: PorteriaMetricCard[];
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
    cardClassName:
      "border-sky-200/90 bg-gradient-to-br from-sky-50 via-sky-50/70 to-white text-sky-900 shadow-sm shadow-sky-200/30 dark:border-sky-800/70 dark:from-sky-950/60 dark:via-sky-900/35 dark:to-sky-950/45 dark:text-sky-100 dark:shadow-sm dark:shadow-sky-950/35",
    iconClassName:
      "bg-sky-100 text-sky-700 ring-1 ring-sky-200/50 dark:bg-sky-900/55 dark:text-sky-200 dark:ring-sky-700/45",
  },
  day: {
    icon: CalendarDays,
    cardClassName:
      "border-amber-200/90 bg-gradient-to-br from-amber-50 via-amber-50/70 to-white text-amber-900 shadow-sm shadow-amber-200/30 dark:border-amber-800/70 dark:from-amber-950/60 dark:via-amber-900/35 dark:to-amber-950/45 dark:text-amber-100 dark:shadow-sm dark:shadow-amber-950/35",
    iconClassName:
      "bg-amber-100 text-amber-700 ring-1 ring-amber-200/50 dark:bg-amber-900/55 dark:text-amber-200 dark:ring-amber-700/45",
  },
  plant: {
    icon: Factory,
    cardClassName: PORTERIA_FABRICA_COLORS.metricCard,
    iconClassName: PORTERIA_FABRICA_COLORS.metricIcon,
  },
  admin: {
    icon: Building2,
    cardClassName: PORTERIA_ADMINISTRACION_COLORS.metricCard,
    iconClassName: PORTERIA_ADMINISTRACION_COLORS.metricIcon,
  },
};

const DEFAULT_STYLE = METRIC_STYLES.month;

/**
 * Muestra metricas principales del modulo Porteria.
 * @param props - Coleccion de metricas.
 * @returns Grid responsive de cards.
 */
export function PorteriaCards({ metrics }: PorteriaCardsProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => {
        const style = METRIC_STYLES[metric.id] ?? DEFAULT_STYLE;
        const Icon = style.icon;

        return (
          <article
            key={metric.id}
            className={cn(
              "relative overflow-hidden rounded-xl border p-4 shadow-soft transition-shadow hover:shadow-md",
              style.cardClassName,
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-inherit/80">{metric.title}</p>
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
    </section>
  );
}
