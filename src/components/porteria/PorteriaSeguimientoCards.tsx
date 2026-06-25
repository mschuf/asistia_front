/**
 * @file PorteriaSeguimientoCards.tsx
 * @description Cards de visitantes activos en seguimiento en tiempo real.
 */
import { Building2, Clock3, Factory, Layers, OctagonAlert, ShieldAlert, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrackingVisitorPhoto } from "@/components/porteria/TrackingVisitorPhoto";
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
}

interface AccessStyle {
  label: string;
  icon: LucideIcon;
  cardClassName: string;
  iconClassName: string;
  entryBoxClassName: string;
  swatchClassName: string;
}

const ACCESS_STYLES: Record<PorteriaTrackingAccessType, AccessStyle> = {
  solo_fabrica: {
    label: "Fábrica",
    icon: Factory,
    cardClassName: PORTERIA_FABRICA_COLORS.trackingCard,
    iconClassName: PORTERIA_FABRICA_COLORS.trackingIcon,
    entryBoxClassName: PORTERIA_FABRICA_COLORS.trackingEntryBox,
    swatchClassName: "bg-amber-400",
  },
  solo_administracion: {
    label: "Administración",
    icon: Building2,
    cardClassName: PORTERIA_ADMINISTRACION_COLORS.trackingCard,
    iconClassName: PORTERIA_ADMINISTRACION_COLORS.trackingIcon,
    entryBoxClassName: PORTERIA_ADMINISTRACION_COLORS.trackingEntryBox,
    swatchClassName: "bg-red-500",
  },
  ambas: {
    label: "Fábrica y administración",
    icon: Layers,
    cardClassName: PORTERIA_AMBAS_ZONAS_COLORS.trackingCard,
    iconClassName: PORTERIA_AMBAS_ZONAS_COLORS.trackingIcon,
    entryBoxClassName: PORTERIA_AMBAS_ZONAS_COLORS.trackingEntryBox,
    swatchClassName: "bg-sky-400",
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
 * @returns Clases para renderizar la card.
 */
function getStatusPresentation(status: TrackingStatus): StatusPresentation {
  if (status === "alerta") {
    return {
      incidentClassName: "porteria-blink-alerta",
      cornerClassName: "bg-amber-300/90 dark:bg-amber-500/40",
      iconClassName: "text-amber-950 dark:text-amber-100",
      Icon: ShieldAlert,
    };
  }

  if (status === "peligro") {
    return {
      incidentClassName: "porteria-blink-peligro",
      cornerClassName: "bg-red-300/90 dark:bg-red-500/40",
      iconClassName: "text-red-950 dark:text-red-100",
      Icon: OctagonAlert,
    };
  }

  return {
    incidentClassName: "",
    cornerClassName: "",
    iconClassName: "",
    Icon: ShieldAlert,
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
        </div>
        <Badge variant="success">En vivo</Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visitors.map((visitor) => {
          const accessStyle = ACCESS_STYLES[visitor.accessType];
          const AccessIcon = accessStyle.icon;
          const statusPresentation = getStatusPresentation(visitor.status);
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

              <div className="relative z-10">
                <TrackingVisitorPhoto
                  visitaId={visitor.id}
                  personaId={visitor.personaId}
                  hasVisitaFoto={visitor.hasVisitaFoto}
                  hasPersonaFoto={visitor.hasPersonaFoto}
                  name={visitor.name}
                  previewMaxSizePx={600}
                  className="absolute right-0 top-2 z-10 h-[8.75rem] w-[8.75rem]"
                />

                <div className="min-w-0 pr-[9.25rem]">
                  <p className="truncate text-base font-semibold">{visitor.name}</p>
                  <p className="mt-0.5 truncate text-sm opacity-75 dark:opacity-80">{visitor.company}</p>
                </div>

                <div className="mt-2.5 space-y-2.5">
                  <div className="mr-[9.25rem]">
                    <div
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                        accessStyle.entryBoxClassName,
                      )}
                    >
                      <AccessIcon className="h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:opacity-90">
                            Acceso
                          </p>
                          <span
                            className={cn("h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10", swatchClassName)}
                            aria-hidden="true"
                          />
                        </div>
                        <p className="truncate font-medium">{visitor.accessLabel}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mr-[9.25rem]">
                    <div
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                        accessStyle.entryBoxClassName,
                      )}
                    >
                      <UserRound className="h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:opacity-90">
                          Responsable
                        </p>
                        <p className="truncate font-medium">{visitor.responsable}</p>
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
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
