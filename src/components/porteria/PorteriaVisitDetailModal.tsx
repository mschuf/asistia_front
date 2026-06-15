/**
 * @file PorteriaVisitDetailModal.tsx
 * @description Modal de detalle cronologico de una visita en Porteria.
 */
import {
  Building2,
  CircleDot,
  ClipboardCheck,
  Clock3,
  DoorOpen,
  Factory,
  LogOut,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { PorteriaHistoryRecord } from "@/types/pages/porteria-page.types";

interface PorteriaVisitDetailModalProps {
  record: PorteriaHistoryRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TimelineItem {
  time: string;
  event: string;
  icon: LucideIcon;
  tone: "default" | "accent" | "muted";
}

interface VisitAlert {
  id: string;
  title: string;
  description: string;
  severity: "warning" | "danger";
  time: string;
}

const TIMELINE_ITEMS: TimelineItem[] = [
  { time: "12:00", event: "Entrada porton", icon: DoorOpen, tone: "default" },
  { time: "12:02", event: "Registro en porteria", icon: ClipboardCheck, tone: "accent" },
  { time: "12:05", event: "Ingreso a Administracion", icon: Building2, tone: "default" },
  { time: "12:17", event: "Ingreso a Planta", icon: Factory, tone: "default" },
  { time: "13:00", event: "Salida porteria", icon: LogOut, tone: "muted" },
  { time: "13:10", event: "Salida porton", icon: DoorOpen, tone: "muted" },
];

const SUMMARY_FIELDS: Array<{ key: keyof PorteriaHistoryRecord; label: string }> = [
  { key: "visitante", label: "Visitante" },
  { key: "documento", label: "Documento" },
  { key: "empresa", label: "Empresa" },
  { key: "motivo", label: "Motivo" },
  { key: "responsable", label: "Responsable" },
];

/** Alertas placeholder segun el registro seleccionado. */
function getVisitAlerts(record: PorteriaHistoryRecord): VisitAlert[] {
  if (record.id === 1 || record.id === 4) {
    return [];
  }

  if (record.id === 2) {
    return [
      {
        id: "missing-checkout",
        title: "Desaparicion sospechosa",
        description: "No se registro salida de Planta. Ultimo punto detectado: Administracion (12:05).",
        severity: "danger",
        time: "12:45",
      },
      {
        id: "zone-timeout",
        title: "Tiempo fuera de zona",
        description: "Permanencia en area restringida supero el limite autorizado (45 min).",
        severity: "warning",
        time: "12:50",
      },
    ];
  }

  return [
    {
      id: "unauthorized-zone",
      title: "Ingreso no autorizado",
      description: "Acceso detectado a sector sin autorizacion previa del responsable.",
      severity: "warning",
      time: "12:22",
    },
  ];
}

/**
 * Fila de detalle con etiqueta y valor.
 * @param props - Etiqueta y contenido hijo.
 * @returns Elemento dl/dt/dd.
 */
function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5 sm:grid-cols-[120px_1fr] sm:gap-3 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{children}</dd>
    </div>
  );
}

/**
 * Card de alertas y desaparicion sospechosa del visitante.
 * @param props - Registro de la visita.
 * @returns Seccion de alertas con estado y detalle.
 */
function AlertsCard({ record }: { record: PorteriaHistoryRecord }) {
  const alerts = getVisitAlerts(record);
  const hasCriticalAlert = alerts.some((alert) => alert.severity === "danger");
  const hasAlerts = alerts.length > 0;

  return (
    <section
      className={cn(
        "space-y-3 rounded-xl border p-4 shadow-soft",
        hasCriticalAlert
          ? "border-red-200/80 bg-gradient-to-br from-red-500/5 to-transparent dark:border-red-900/60"
          : hasAlerts
            ? "border-amber-200/80 bg-gradient-to-br from-amber-500/5 to-transparent dark:border-amber-900/60"
            : "border-border bg-card",
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert
            className={cn(
              "h-4 w-4",
              hasCriticalAlert
                ? "text-red-600 dark:text-red-400"
                : hasAlerts
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-primary",
            )}
            aria-hidden="true"
          />
          <div>
            <h3 className="text-sm font-semibold">Alertas / Desaparicion sospechosa</h3>
            
          </div>
        </div>
        <Badge variant={hasCriticalAlert ? "danger" : hasAlerts ? "warning" : "success"}>
          {hasCriticalAlert ? "Critica" : hasAlerts ? "Con alertas" : "Sin alertas"}
        </Badge>
      </div>

      {hasAlerts ? (
        <ul className="space-y-2.5">
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className={cn(
                "rounded-lg border px-3 py-2.5",
                alert.severity === "danger"
                  ? "border-red-200/70 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20"
                  : "border-amber-200/70 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20",
              )}
            >
              <div className="flex items-start gap-2.5">
                <TriangleAlert
                  className={cn(
                    "mt-0.5 h-4 w-4 shrink-0",
                    alert.severity === "danger"
                      ? "text-red-600 dark:text-red-400"
                      : "text-amber-600 dark:text-amber-400",
                  )}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{alert.title}</p>
                    <span className="text-xs text-muted-foreground">{alert.time}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{alert.description}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed border-emerald-200/70 bg-emerald-50/30 px-3 py-4 text-center dark:border-emerald-900/50 dark:bg-emerald-950/10">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
            No se detectaron alertas ni desapariciones sospechosas.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            El recorrido del visitante coincide con los puntos de control registrados.
          </p>
        </div>
      )}
    </section>
  );
}

/**
 * Renderiza el detalle de una visita dentro de un modal amplio.
 * @param props - Registro seleccionado y control de apertura.
 * @returns Modal con resumen y linea de tiempo o null.
 */
export function PorteriaVisitDetailModal({ record, open, onOpenChange }: PorteriaVisitDetailModalProps) {
  if (!record) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Visita #${record.id}`}
      description="Detalle completo del recorrido y datos del visitante."
      className="max-h-[min(92vh,880px)] max-w-4xl"
      contentClassName="space-y-6 pb-6"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-lg border bg-gradient-to-br from-primary/5 to-transparent p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fecha visita</p>
          <p className="mt-2 text-lg font-semibold">01/01/2026</p>
        </article>
        <article className="rounded-lg border bg-gradient-to-br from-emerald-500/5 to-transparent p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Duracion</p>
          <div className="mt-2 flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <p className="text-lg font-semibold">01:10</p>
          </div>
        </article>
        <article className="rounded-lg border bg-gradient-to-br from-sky-500/5 to-transparent p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Estado</p>
          <div className="mt-2">
            <Badge variant="success">Finalizada</Badge>
          </div>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="space-y-4">
          <section className="space-y-3 rounded-xl border bg-card p-4 shadow-soft">
            <div className="flex items-center gap-2 border-b pb-3">
              <CircleDot className="h-4 w-4 text-primary" aria-hidden="true" />
              <h3 className="text-sm font-semibold">Informacion del visitante</h3>
            </div>
            <dl className="space-y-2.5">
              {SUMMARY_FIELDS.map(({ key, label }) => (
                <DetailRow key={key} label={label}>
                  {record[key]}
                </DetailRow>
              ))}
            </dl>
          </section>

          <AlertsCard record={record} />
        </div>

        <section className="space-y-3 rounded-xl border bg-card p-4 shadow-soft">
          <div className="flex items-center gap-2 border-b pb-3">
            <Clock3 className="h-4 w-4 text-primary" aria-hidden="true" />
            <h3 className="text-sm font-semibold">Recorrido de la visita</h3>
          </div>

          <ol className="relative space-y-0 pl-1">
            {TIMELINE_ITEMS.map((item, index) => {
              const Icon = item.icon;
              const isLast = index === TIMELINE_ITEMS.length - 1;

              return (
                <li key={`${record.id}-${item.time}-${item.event}`} className="relative flex gap-4 pb-6 last:pb-0">
                  {!isLast ? (
                    <span
                      className="absolute left-[15px] top-8 h-[calc(100%-12px)] w-px bg-border"
                      aria-hidden="true"
                    />
                  ) : null}

                  <span
                    className={cn(
                      "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background shadow-sm",
                      item.tone === "accent" && "border-primary/40 bg-primary/10 text-primary",
                      item.tone === "muted" && "border-muted-foreground/30 text-muted-foreground",
                      item.tone === "default" && "border-border text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>

                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.time}</p>
                    <p className="mt-1 text-sm font-medium">{item.event}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </Dialog>
  );
}
