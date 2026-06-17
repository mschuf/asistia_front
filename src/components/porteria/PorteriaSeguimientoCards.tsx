/**
 * @file PorteriaSeguimientoCards.tsx
 * @description Cards de visitantes activos en seguimiento en tiempo real.
 */
import { Building2, Clock3, Factory, Layers, OctagonAlert, ShieldAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PORTERIA_ADMINISTRACION_COLORS,
  PORTERIA_AMBAS_ZONAS_COLORS,
  PORTERIA_FABRICA_COLORS,
} from "@/lib/porteria.constants";
import type {
  PorteriaTrackingAccessType,
  PorteriaTrackingVisitor,
} from "@/types/pages/porteria-page.types";

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

interface AccessStyle {
  label: string;
  icon: LucideIcon;
  cardClassName: string;
  iconClassName: string;
  entryBoxClassName: string;
  badgeVariant: "info" | "success" | "warning";
  swatchClassName: string;
}

const ACCESS_STYLES: Record<PorteriaTrackingAccessType, AccessStyle> = {
  solo_fabrica: {
    label: "Solo fábrica",
    icon: Factory,
    cardClassName: PORTERIA_FABRICA_COLORS.trackingCard,
    iconClassName: PORTERIA_FABRICA_COLORS.trackingIcon,
    entryBoxClassName: PORTERIA_FABRICA_COLORS.trackingEntryBox,
    badgeVariant: "success",
    swatchClassName: "bg-amber-400",
  },
  solo_administracion: {
    label: "Solo administración",
    icon: Building2,
    cardClassName: PORTERIA_ADMINISTRACION_COLORS.trackingCard,
    iconClassName: PORTERIA_ADMINISTRACION_COLORS.trackingIcon,
    entryBoxClassName: PORTERIA_ADMINISTRACION_COLORS.trackingEntryBox,
    badgeVariant: "info",
    swatchClassName: "bg-red-500",
  },
  ambas: {
    label: "Fábrica y administración",
    icon: Layers,
    cardClassName: PORTERIA_AMBAS_ZONAS_COLORS.trackingCard,
    iconClassName: PORTERIA_AMBAS_ZONAS_COLORS.trackingIcon,
    entryBoxClassName: PORTERIA_AMBAS_ZONAS_COLORS.trackingEntryBox,
    badgeVariant: "success",
    swatchClassName: "bg-emerald-500",
  },
};

const TARJETA_SWATCH: Record<NonNullable<PorteriaTrackingVisitor["tarjetaColor"]>, string> = {
  rojo: "bg-red-500",
  amarillo: "bg-amber-400",
  verde: "bg-emerald-500",
};

/**
 * Estilos visuales segun el estado del visitante.
 * @param status - Estado de seguimiento.
 * @param zoneBadge - Badge por defecto del acceso.
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
 * Muestra visitantes activos con cards coloreadas por acceso y estado.
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

  const accessBreakdown = visitors.reduce(
    (counts, visitor) => {
      counts[visitor.accessType] += 1;
      return counts;
    },
    { solo_administracion: 0, solo_fabrica: 0, ambas: 0 } as Record<PorteriaTrackingAccessType, number>,
  );

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Visitantes en seguimiento</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {visitors.length} {visitors.length === 1 ? "persona activa" : "personas activas"} dentro del
            predio.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Admin {accessBreakdown.solo_administracion} · Fábrica {accessBreakdown.solo_fabrica} · Ambas{" "}
            {accessBreakdown.ambas}
          </p>
        </div>
        <Badge variant="success">En vivo</Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visitors.map((visitor) => {
          const accessStyle = ACCESS_STYLES[visitor.accessType];
          const AccessIcon = accessStyle.icon;
          const statusPresentation = getStatusPresentation(visitor.status, accessStyle.badgeVariant);
          const StatusIcon = statusPresentation.Icon;
          const hasIncident = visitor.status !== "activo";
          const swatchClassName = visitor.tarjetaColor
            ? TARJETA_SWATCH[visitor.tarjetaColor]
            : accessStyle.swatchClassName;

          return (
            <article
              key={visitor.id}
              className={cn(
                "relative rounded-xl border p-4 shadow-soft transition-shadow hover:shadow-md",
                hasIncident ? "overflow-visible" : "overflow-hidden",
                accessStyle.cardClassName,
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
                      accessStyle.iconClassName,
                    )}
                  >
                    <AccessIcon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:opacity-90">
                      Acceso
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn("h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10", swatchClassName)}
                        aria-hidden="true"
                      />
                      <p className="font-medium">{visitor.accessLabel}</p>
                    </div>
                  </div>
                </div>

                <div
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                    accessStyle.entryBoxClassName,
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
