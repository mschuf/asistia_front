/**
 * @file PorteriaAuditStateComparison.tsx
 * @description Comparación visual before/after del snapshot de auditoría de visitas.
 */
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  collectAuditStateFields,
  formatAuditFieldValue,
  getAuditChangeKindLabel,
  getAuditFieldLabel,
  resolveAuditFieldChangeKind,
  type AuditFieldChangeKind,
} from "@/lib/porteria-audit-state";

interface PorteriaAuditStateComparisonProps {
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
  changedFields: string[];
  className?: string;
}

const GRID_COLUMNS = "grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] divide-x divide-border";

const CHANGE_KIND_VARIANT: Record<
  Exclude<AuditFieldChangeKind, "unchanged">,
  "success" | "danger" | "info"
> = {
  modified: "success",
  added: "info",
  removed: "danger",
};

const CHANGE_KIND_ROW_CLASS: Record<AuditFieldChangeKind, string> = {
  unchanged: "",
  modified: "bg-emerald-50/70 dark:bg-emerald-950/20",
  added: "bg-sky-50/70 dark:bg-sky-950/20",
  removed: "bg-red-50/70 dark:bg-red-950/20",
};

function StateValue({
  field,
  value,
  changeKind,
}: {
  field: string;
  value: unknown;
  changeKind: AuditFieldChangeKind;
}) {
  const formatted = formatAuditFieldValue(field, value);
  const isEmpty = formatted === "—";

  if (changeKind === "unchanged") {
    return (
      <span className={cn("text-sm", isEmpty && "text-muted-foreground")}>{formatted}</span>
    );
  }

  return (
    <Badge variant={CHANGE_KIND_VARIANT[changeKind]} className="max-w-full whitespace-normal text-left">
      {formatted}
    </Badge>
  );
}

function StateCell({
  field,
  value,
  valueKind,
  badgeKind,
}: {
  field: string;
  value: unknown;
  valueKind: AuditFieldChangeKind;
  badgeKind: AuditFieldChangeKind;
}) {
  return (
    <div className="space-y-1.5 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {getAuditFieldLabel(field)}
        </p>
        {badgeKind !== "unchanged" ? (
          <Badge variant={CHANGE_KIND_VARIANT[badgeKind]} className="text-[10px]">
            {getAuditChangeKindLabel(badgeKind)}
          </Badge>
        ) : null}
      </div>
      <StateValue field={field} value={value} changeKind={valueKind} />
    </div>
  );
}

/** Panel comparativo con scroll compartido entre estado anterior y posterior. */
export function PorteriaAuditStateComparison({
  beforeState,
  afterState,
  changedFields,
  className,
}: PorteriaAuditStateComparisonProps) {
  const fields = collectAuditStateFields(beforeState, afterState);

  if (fields.length === 0) {
    return (
      <div className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
        No hay datos de estado para este evento.
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-0 flex-col overflow-hidden rounded-md border bg-card", className)}>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div
          className={cn(
            GRID_COLUMNS,
            "sticky top-0 z-10 border-b bg-muted/95 text-sm font-semibold backdrop-blur-sm",
          )}
        >
          <div className="px-4 py-2.5">Estado anterior</div>
          <div className="px-4 py-2.5">Estado nuevo</div>
        </div>

        {fields.map((field) => {
          const changeKind = resolveAuditFieldChangeKind(
            field,
            beforeState,
            afterState,
            changedFields,
          );
          const beforeValue = beforeState?.[field];
          const afterValue = afterState?.[field];
          const beforeValueKind =
            changeKind === "modified" || changeKind === "removed" ? changeKind : "unchanged";
          const afterValueKind =
            changeKind === "modified" || changeKind === "added" ? changeKind : "unchanged";

          return (
            <div
              key={field}
              className={cn(
                GRID_COLUMNS,
                "border-b border-border/60 last:border-b-0",
                CHANGE_KIND_ROW_CLASS[changeKind],
              )}
            >
              <StateCell
                field={field}
                value={beforeValue}
                valueKind={beforeValueKind}
                badgeKind={changeKind !== "added" ? changeKind : "unchanged"}
              />
              <StateCell
                field={field}
                value={afterValue}
                valueKind={afterValueKind}
                badgeKind={changeKind !== "removed" ? changeKind : "unchanged"}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
