/**
 * @file PorteriaAuditDetailModal.tsx
 * @description Modal de detalle del evento de auditoría de portería.
 */
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { PorteriaAuditStateComparison } from "@/components/reports/PorteriaAuditStateComparison";
import { getHistoryEstadoLabel, getHistoryEstadoBadgeVariant } from "@/lib/porteria";
import { formatAuditFieldValue, formatPorteriaAuditActorLabel, getAuditFieldLabel } from "@/lib/porteria-audit-state";
import type { PorteriaAuditLog } from "@/types/pages/porteria-audit-report.types";

interface PorteriaAuditDetailModalProps {
  record: PorteriaAuditLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ACTION_LABELS: Record<PorteriaAuditLog["action"], string> = {
  "visita.created": "Registro",
  "visita.updated": "Edición",
  "visita.closed": "Cierre",
  "visita.deleted": "Eliminación",
};

/** Modal de detalle para revisar before/after y metadatos del evento auditado. */
export function PorteriaAuditDetailModal({
  record,
  open,
  onOpenChange,
}: PorteriaAuditDetailModalProps) {
  if (!record) return null;

  const actorLabel = formatPorteriaAuditActorLabel(record.actorUserId, record.actorName);

  const metadataEntries = Object.entries(record.metadata ?? {}).filter(
    ([, value]) => value !== null && value !== undefined,
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Auditoría de visita #${record.visitaId}`}
      description={`${ACTION_LABELS[record.action]} — ${new Date(record.occurredAt).toLocaleString("es-AR")}`}
      className="max-h-[min(96vh,1490px)] max-w-5xl"
      contentClassName="flex min-h-0 flex-1 flex-col overflow-hidden py-4"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="shrink-0 grid grid-cols-1 gap-3 rounded-md border bg-muted/30 p-3 text-sm md:grid-cols-2">
          <DetailRow label="Actor" value={actorLabel} />
          <DetailRow label="Visitante" value={record.visitante ?? "—"} />
          <DetailRow label="Documento" value={record.documento ?? "—"} />
          <DetailRow label="Transición de estado">
            <EstadoTransition before={record.estadoBefore} after={record.estadoAfter} />
          </DetailRow>
          <div className="md:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Campos modificados
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {record.changedFields.length > 0 ? (
                record.changedFields.map((field) => (
                  <Badge key={field} variant="success">
                    {getAuditFieldLabel(field)}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Sin cambios detectados</span>
              )}
            </div>
          </div>
        </div>

        <PorteriaAuditStateComparison
          className="min-h-0 flex-1 max-h-[25.5rem]"
          beforeState={record.beforeState}
          afterState={record.afterState}
          changedFields={record.changedFields}
        />

        {metadataEntries.length > 0 ? (
          <div className="shrink-0 space-y-2 rounded-md border bg-card p-3">
            <h3 className="text-sm font-semibold">Información adicional</h3>
            <dl className="grid gap-2 sm:grid-cols-2">
              {metadataEntries.map(([key, value]) => (
                <div key={key} className="rounded-md bg-muted/30 px-3 py-2">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {getAuditFieldLabel(key)}
                  </dt>
                  <dd className="mt-1 text-sm">{formatAuditFieldValue(key, value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
      </div>
    </Dialog>
  );
}

function DetailRow({
  label,
  value,
  children,
  className,
}: {
  label: string;
  value?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 break-words text-sm">{children ?? value}</div>
    </div>
  );
}

function EstadoTransition({
  before,
  after,
}: {
  before: PorteriaAuditLog["estadoBefore"];
  after: PorteriaAuditLog["estadoAfter"];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {before ? (
        <Badge variant={getHistoryEstadoBadgeVariant(before)}>{getHistoryEstadoLabel(before)}</Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      )}
      <span className="text-muted-foreground" aria-hidden="true">
        →
      </span>
      {after ? (
        <Badge variant={getHistoryEstadoBadgeVariant(after)}>{getHistoryEstadoLabel(after)}</Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      )}
    </div>
  );
}
