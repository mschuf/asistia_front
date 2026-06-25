/**
 * @file PorteriaVisitDetailModal.tsx
 * @description Modal de detalle cronologico de una visita en Porteria.
 */
import { CircleDot, Clock3, DoorOpen, LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import {
  calculateHistoryVisitDuration,
  formatHistoryVisitDate,
  formatHistoryVisitTime,
  getHistoryEstadoBadgeVariant,
  getHistoryEstadoLabel,
} from "@/lib/porteria";
import { cn } from "@/lib/utils";
import type { PorteriaHistoryRecord } from "@/types/pages/porteria-page.types";
import { TrackingVisitorPhoto } from "@/components/porteria/TrackingVisitorPhoto";

interface PorteriaVisitDetailModalProps {
  record: PorteriaHistoryRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TimelineItem {
  id: string;
  time: string;
  event: string;
  icon: LucideIcon;
  tone: "default" | "muted";
}

const SUMMARY_FIELDS: Array<{ key: keyof PorteriaHistoryRecord; label: string }> = [
  { key: "visitante", label: "Visitante" },
  { key: "documento", label: "Documento" },
  { key: "empresa", label: "Empresa" },
  { key: "motivo", label: "Motivo" },
  { key: "responsable", label: "Responsable" },
];

/** @param record - Registro de la visita. @returns Hora de salida legible segun estado. */
function formatTimelineSalidaTime(record: PorteriaHistoryRecord): string {
  if (record.estado === "activa") return "-";
  if (record.estado === "sin_salida") return "???";
  return formatHistoryVisitTime(record.salidaAt);
}

/** @param record - Registro de la visita. @returns Eventos de entrada y salida para el recorrido. */
function buildVisitTimeline(record: PorteriaHistoryRecord): TimelineItem[] {
  return [
    {
      id: "entrada",
      time: formatHistoryVisitTime(record.entradaAt),
      event: "Entrada",
      icon: DoorOpen,
      tone: "default",
    },
    {
      id: "salida",
      time: formatTimelineSalidaTime(record),
      event: "Salida",
      icon: LogOut,
      tone: "muted",
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
 * Renderiza el detalle de una visita dentro de un modal amplio.
 * @param props - Registro seleccionado y control de apertura.
 * @returns Modal con resumen y linea de tiempo o null.
 */
export function PorteriaVisitDetailModal({ record, open, onOpenChange }: PorteriaVisitDetailModalProps) {
  if (!record) return null;

  const timelineItems = buildVisitTimeline(record);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Visita #${record.id}`}
      description="Detalle de la visita y datos del visitante."
      className="max-h-[min(92vh,880px)] max-w-4xl"
      contentClassName="space-y-6 pb-6"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-lg border bg-gradient-to-br from-primary/5 to-transparent p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fecha visita</p>
          <p className="mt-2 text-lg font-semibold">{formatHistoryVisitDate(record.entradaAt)}</p>
        </article>
        <article className="rounded-lg border bg-gradient-to-br from-emerald-500/5 to-transparent p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Duracion</p>
          <div className="mt-2 flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <p className="text-lg font-semibold">
              {calculateHistoryVisitDuration(record.entradaAt, record.salidaAt, record.estado)}
            </p>
          </div>
        </article>
        <article className="rounded-lg border bg-gradient-to-br from-sky-500/5 to-transparent p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Estado</p>
          <div className="mt-2">
            <Badge variant={getHistoryEstadoBadgeVariant(record.estado)}>
              {getHistoryEstadoLabel(record.estado)}
            </Badge>
          </div>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="space-y-3 rounded-xl border bg-card p-4 shadow-soft">
          <div className="flex items-center gap-2 border-b pb-3">
            <CircleDot className="h-4 w-4 text-primary" aria-hidden="true" />
            <h3 className="text-sm font-semibold">Informacion del visitante</h3>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <TrackingVisitorPhoto
              visitaId={record.id}
              personaId={record.personaId}
              hasVisitaFoto={record.hasVisitaFoto}
              hasPersonaFoto={record.hasPersonaFoto}
              name={record.visitante}
              className="h-28 w-28 shrink-0"
            />
            <dl className="min-w-0 flex-1 space-y-2.5">
              {SUMMARY_FIELDS.map(({ key, label }) => (
                <DetailRow key={key} label={label}>
                  {record[key]}
                </DetailRow>
              ))}
            </dl>
          </div>
        </section>

        <section className="space-y-3 rounded-xl border bg-card p-4 shadow-soft">
          <div className="flex items-center gap-2 border-b pb-3">
            <Clock3 className="h-4 w-4 text-primary" aria-hidden="true" />
            <h3 className="text-sm font-semibold">Recorrido de la visita</h3>
          </div>

          <ol className="relative space-y-0 pl-1">
            {timelineItems.map((item, index) => {
              const Icon = item.icon;
              const isLast = index === timelineItems.length - 1;

              return (
                <li key={`${record.id}-${item.id}`} className="relative flex gap-4 pb-6 last:pb-0">
                  {!isLast ? (
                    <span
                      className="absolute left-[15px] top-8 h-[calc(100%-12px)] w-px bg-border"
                      aria-hidden="true"
                    />
                  ) : null}

                  <span
                    className={cn(
                      "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background shadow-sm",
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
