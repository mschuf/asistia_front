/**
 * @file PorteriaSeguimientoCards.tsx
 * @description Cards de visitantes activos en seguimiento en tiempo real.
 */
import { Building2, Clock3, Factory, MapPin, OctagonAlert, ShieldAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PORTERIA_ADMINISTRACION_COLORS,
  PORTERIA_FABRICA_COLORS,
} from "@/lib/porteria.constants";
import type { PorteriaTrackingVisitor } from "@/types/pages/porteria-page.types";

interface PorteriaSeguimientoCardsProps {
  visitors: PorteriaTrackingVisitor[];
}

type TrackingStatus = PorteriaTrackingVisitor["status"];

interface StatusPresentation {
  incidentClassName: string;
  cornerClassName: string;
  iconClassName: string;
  Icon: LucideIcon;
  badgeVariant: "info" | "success" | "warning" | "danger";
  badgeLabel: string;
}

const ZONE_STYLES: Record<
  PorteriaTrackingVisitor["zone"],
  {
    label: string;
    icon: LucideIcon;
    cardClassName: string;
    iconClassName: string;
    entryBoxClassName: string;
    badgeVariant: "info" | "success" | "warning";
  }
> = {
  fabrica: {
    label: "Fabrica",
    icon: Factory,
    cardClassName: PORTERIA_FABRICA_COLORS.trackingCard,
    iconClassName: PORTERIA_FABRICA_COLORS.trackingIcon,
    entryBoxClassName: PORTERIA_FABRICA_COLORS.trackingEntryBox,
    badgeVariant: "success",
  },
  administracion: {
    label: "Administracion",
    icon: Building2,
    cardClassName: PORTERIA_ADMINISTRACION_COLORS.trackingCard,
    iconClassName: PORTERIA_ADMINISTRACION_COLORS.trackingIcon,
    entryBoxClassName: PORTERIA_ADMINISTRACION_COLORS.trackingEntryBox,
    badgeVariant: "info",
  },
  porteria: {
    label: "Porteria",
    icon: MapPin,
    cardClassName:
      "border-sky-200/90 bg-gradient-to-b from-sky-50/95 via-sky-50/45 to-white text-sky-950 shadow-sm shadow-sky-200/25 dark:border-sky-800/70 dark:from-sky-950/65 dark:via-sky-900/30 dark:to-card dark:text-sky-100 dark:shadow-sm dark:shadow-sky-950/35",
    iconClassName:
      "bg-sky-100 text-sky-700 ring-1 ring-sky-200/50 dark:bg-sky-900/55 dark:text-sky-200 dark:ring-sky-700/45",
    entryBoxClassName: "border-sky-200/60 bg-sky-50/55 dark:border-sky-800/50 dark:bg-sky-950/40",
    badgeVariant: "info",
  },
};

/**
 * Estilos visuales segun el estado del visitante.
 * @param status - Estado de seguimiento.
 * @param zoneBadge - Badge por defecto de la zona.
 * @returns Clases y etiqueta para renderizar la card.
 */
function getStatusPresentation(
  status: TrackingStatus,
  zoneBadge: "info" | "success" | "warning",
): StatusPresentation {
  if (status === "alerta") {
    return {
      incidentClassName: "porteria-blink-alerta",
      cornerClassName: "bg-amber-300/90 dark:bg-amber-500/40",
      iconClassName: "text-amber-950 dark:text-amber-100",
      Icon: ShieldAlert,
      badgeVariant: "warning",
      badgeLabel: "Alerta",
    };
  }

  if (status === "peligro") {
    return {
      incidentClassName: "porteria-blink-peligro",
      cornerClassName: "bg-red-300/90 dark:bg-red-500/40",
      iconClassName: "text-red-950 dark:text-red-100",
      Icon: OctagonAlert,
      badgeVariant: "danger",
      badgeLabel: "Peligro",
    };
  }

  return {
    incidentClassName: "",
    cornerClassName: "",
    iconClassName: "",
    Icon: ShieldAlert,
    badgeVariant: zoneBadge,
    badgeLabel: "Activo",
  };
}

/**
 * Muestra visitantes activos con cards coloreadas por zona y estado.
 * @param props - Lista de visitantes en seguimiento.
 * @returns Grid de cards o mensaje vacio.
 */
export function PorteriaSeguimientoCards({ visitors }: PorteriaSeguimientoCardsProps) {
  if (visitors.length === 0) {
    return (
      <section className="rounded-xl border border-dashed bg-muted/20 p-8 text-center">
        <p className="text-sm font-medium">No hay visitantes activos en este momento.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Los ingresos en curso apareceran aqui en tiempo real.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Visitantes en seguimiento</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {visitors.length} {visitors.length === 1 ? "persona activa" : "personas activas"} dentro del predio.
          </p>
        </div>
        <Badge variant="success">En vivo</Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visitors.map((visitor) => {
          const zoneStyle = ZONE_STYLES[visitor.zone];
          const ZoneIcon = zoneStyle.icon;
          const statusPresentation = getStatusPresentation(visitor.status, zoneStyle.badgeVariant);
          const StatusIcon = statusPresentation.Icon;
          const hasIncident = visitor.status !== "activo";

          return (
            <article
              key={visitor.id}
              className={cn(
                "relative rounded-xl border p-4 shadow-soft transition-shadow hover:shadow-md",
                hasIncident ? "overflow-visible" : "overflow-hidden",
                zoneStyle.cardClassName,
                hasIncident && statusPresentation.incidentClassName,
              )}
            >
              {hasIncident ? (
                <div
                  className={cn(
                    "absolute right-0 top-0 z-10 rounded-bl-lg px-2.5 py-1",
                    statusPresentation.cornerClassName,
                  )}
                >
                  <StatusIcon
                    className={cn("h-3.5 w-3.5", statusPresentation.iconClassName)}
                    aria-hidden="true"
                  />
                </div>
              ) : null}

              <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold">{visitor.name}</p>
                  <p className="mt-0.5 truncate text-sm opacity-75 dark:opacity-80">{visitor.company}</p>
                </div>
                <Badge variant={statusPresentation.badgeVariant}>{statusPresentation.badgeLabel}</Badge>
              </div>

              <div className="relative z-10 mt-4 space-y-2.5">
                <div className="flex items-center gap-2 text-sm">
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      zoneStyle.iconClassName,
                    )}
                  >
                    <ZoneIcon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:opacity-90">
                      Ubicacion
                    </p>
                    <p className="font-medium">{zoneStyle.label}</p>
                  </div>
                </div>

                <div
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                    zoneStyle.entryBoxClassName,
                  )}
                >
                  <Clock3 className="h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:opacity-90">
                      Ingreso
                    </p>
                    <p className="font-medium tabular-nums">{visitor.entryTime}</p>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
