/**
 * @file ErsHistoryPage.tsx
 * @description Pantalla timeline del historial informativo de ERS.
 */
import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Clock3, RefreshCw, UserCircle2 } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "@/api/apiClient";
import { listarHistorialErs, type ErsHistoryItem } from "@/api/ers-history";
import { obtenerErs, type ErsDetail } from "@/api/ers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { isRequesterSummary, toErsHistoryDisplayState } from "@/lib/ers-history";
import { cn } from "@/lib/utils";

const colorByAction: Record<ErsHistoryItem["actionType"], string> = {
  create:
    "border-emerald-200/80 bg-emerald-50/80 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200",
  update:
    "border-sky-200/80 bg-sky-50/80 text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200",
  delete:
    "border-rose-200/80 bg-rose-50/80 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200",
};

const labelByAction: Record<ErsHistoryItem["actionType"], string> = {
  create: "Creación",
  update: "Actualización",
  delete: "Reorganización",
};

/** Vista de historial del proyecto ERS. */
export default function ErsHistoryPage() {
  const { isTechnician } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const projectIdNumber = Number(projectId);

  const [project, setProject] = useState<ErsDetail | null>(null);
  const [items, setItems] = useState<ErsHistoryItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!Number.isFinite(projectIdNumber) || projectIdNumber <= 0) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    Promise.all([obtenerErs(projectIdNumber), listarHistorialErs(projectIdNumber, { limit: 100 })])
      .then(([detail, history]) => {
        if (cancelled) return;
        setProject(detail);
        setItems(history.items);
        setExpandedIds(new Set());
      })
      .catch((fetchError) => {
        if (cancelled) return;
        const message =
          fetchError instanceof ApiError
            ? fetchError.message
            : "No se pudo cargar el historial del proyecto ERS.";
        setError(message);
        toast.error(message, "ERS");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectIdNumber, reloadToken, toast]);

  const toggleExpanded = (itemId: number) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  if (!isTechnician) {
    return <Navigate to="/ers" replace />;
  }

  if (!Number.isFinite(projectIdNumber) || projectIdNumber <= 0) {
    return <Navigate to="/ers" replace />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground">IRS / ERS</p>
          <h1 className="text-lg font-semibold">
            Historial ERS {project ? `#${project.projectId} - ${project.projectName}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Seguimiento informativo de cambios del proyecto y su gestión.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/ers/${projectIdNumber}/editar`)}
          >
            Volver a edición
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={loading}
            onClick={() => setReloadToken((value) => value + 1)}
            aria-label="Recargar historial"
            title="Recargar historial"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden="true" />
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      {loading ? (
        <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground shadow-soft">
          Cargando historial ERS...
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Sin eventos registrados"
          description="Aún no hay movimientos para mostrar en el historial de este proyecto."
        />
      ) : (
        <ol className="space-y-3">
          {items.map((item, index) => {
            const itemColor = colorByAction[item.actionType];
            const showConnector = index < items.length - 1;
            const isExpanded = expandedIds.has(item.id);
            const ChevronIcon = isExpanded ? ChevronUp : ChevronDown;

            return (
              <li key={item.id} className="relative pl-10">
                {showConnector ? (
                  <span
                    className="absolute left-[15px] top-16 h-[calc(100%-2.5rem)] w-px bg-border"
                    aria-hidden="true"
                  />
                ) : null}
                <span
                  className={cn(
                    "absolute left-0 top-1 inline-flex h-8 w-8 items-center justify-center rounded-full border",
                    itemColor,
                  )}
                  aria-hidden="true"
                >
                  <Clock3 className="h-4 w-4" />
                </span>
                <button
                  type="button"
                  className="absolute left-1 top-11 inline-flex h-6 w-6 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => toggleExpanded(item.id)}
                  aria-expanded={isExpanded}
                  aria-controls={`ers-history-state-${item.id}`}
                  aria-label={isExpanded ? "Ocultar antes y después" : "Mostrar antes y después"}
                  title={isExpanded ? "Ocultar antes y después" : "Mostrar antes y después"}
                >
                  <ChevronIcon className="h-4 w-4" aria-hidden="true" />
                </button>
                <article className="rounded-xl border bg-card p-4 shadow-soft">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        item.actionType === "create"
                          ? "success"
                          : item.actionType === "update"
                            ? "info"
                            : "danger"
                      }
                    >
                      {labelByAction[item.actionType]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(item.happenedAt)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-foreground">{item.summary}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <UserCircle2 className="h-4 w-4" aria-hidden="true" />
                    <span>{item.actorDisplayName}</span>
                  </div>

                  {isExpanded ? (
                    <HistoryStateComparison
                      id={`ers-history-state-${item.id}`}
                      beforeState={item.beforeState}
                      afterState={item.afterState}
                    />
                  ) : null}
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function HistoryStateComparison({
  id,
  beforeState,
  afterState,
}: {
  id: string;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
}) {
  const nowValue = Date.now();
  const displayBeforeState = toErsHistoryDisplayState(beforeState, nowValue);
  const displayAfterState = toErsHistoryDisplayState(afterState, nowValue);
  const changedFieldPaths = getChangedFieldPaths(displayBeforeState, displayAfterState);
  const fieldKeys = Array.from(
    new Set([...Object.keys(displayBeforeState ?? {}), ...Object.keys(displayAfterState ?? {})]),
  ).filter((key) => !isIgnoredHistoryField(key));

  return (
    <div id={id} className="mt-4 border-t pt-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-md border bg-muted/25 px-3 py-2">
          <h2 className="text-xs font-semibold uppercase text-muted-foreground">Antes</h2>
        </div>
        <div className="rounded-md border bg-muted/25 px-3 py-2">
          <h2 className="text-xs font-semibold uppercase text-muted-foreground">Después</h2>
        </div>
      </div>

      <div className="mt-2 max-h-80 overflow-auto rounded-md border bg-background p-3 font-mono text-sm leading-relaxed text-foreground">
        {fieldKeys.length > 0 ? (
          <dl>
            {fieldKeys.map((key) => {
              const isChanged = isHistoryFieldChanged(key, changedFieldPaths);

              return (
                <div
                  key={key}
                  className="grid items-stretch gap-3 border-b border-border/70 py-3 first:pt-0 last:border-b-0 last:pb-0 md:grid-cols-2"
                >
                  <HistoryStateComparisonCell
                    fieldKey={key}
                    value={displayBeforeState?.[key]}
                    hasValue={Boolean(displayBeforeState && Object.prototype.hasOwnProperty.call(displayBeforeState, key))}
                    isChanged={isChanged}
                    changedFieldPaths={changedFieldPaths}
                  />
                  <HistoryStateComparisonCell
                    fieldKey={key}
                    value={displayAfterState?.[key]}
                    hasValue={Boolean(displayAfterState && Object.prototype.hasOwnProperty.call(displayAfterState, key))}
                    isChanged={isChanged}
                    changedFieldPaths={changedFieldPaths}
                  />
                </div>
              );
            })}
          </dl>
        ) : (
          <p className="text-muted-foreground">Sin datos para comparar</p>
        )}
      </div>
    </div>
  );
}

function HistoryStateComparisonCell({
  fieldKey,
  value,
  hasValue,
  isChanged,
  changedFieldPaths,
}: {
  fieldKey: string;
  value: unknown;
  hasValue: boolean;
  isChanged: boolean;
  changedFieldPaths: Set<string>;
}) {
  if (!hasValue) {
    return <div className="min-h-10" aria-hidden="true" />;
  }

  return (
    <div className="min-w-0">
      <div
        className={cn(
          "rounded-md p-2",
          isChanged &&
            "bg-amber-100/80 ring-1 ring-inset ring-amber-300/80 dark:bg-amber-950/40 dark:ring-amber-700/70",
        )}
      >
        <dt
          className={cn(
            "font-semibold text-muted-foreground",
            isChanged && "text-amber-900 dark:text-amber-200",
          )}
        >
          {formatFieldLabel(fieldKey)}
        </dt>
        <dd className="mt-1 min-w-0 break-words">
          <HistoryStateValue
            value={value}
            changedFieldPaths={changedFieldPaths}
            fieldPath={fieldKey}
          />
        </dd>
      </div>
    </div>
  );
}

function isHistoryFieldChanged(fieldPath: string, changedFieldPaths: Set<string>): boolean {
  if (changedFieldPaths.has(fieldPath)) return true;
  return Array.from(changedFieldPaths).some((path) => path.startsWith(`${fieldPath}.`));
}

function HistoryStateFields({
  state,
  changedFieldPaths,
  parentPath = "",
}: {
  state: Record<string, unknown>;
  changedFieldPaths: Set<string>;
  parentPath?: string;
}) {
  const fields = Object.entries(state).filter(([key]) => !isIgnoredHistoryField(key));

  if (fields.length === 0) {
    return <p className="text-muted-foreground">Sin datos</p>;
  }

  return (
    <dl className="divide-y divide-border/70">
      {fields.map(([key, value]) => {
        const fieldPath = parentPath ? `${parentPath}.${key}` : key;
        const isChanged = changedFieldPaths.has(fieldPath);

        return (
          <div
            key={key}
            className={cn(
              "grid gap-1 py-2 first:pt-0 last:pb-0 sm:grid-cols-[minmax(9rem,0.4fr)_1fr] sm:gap-3",
              isChanged &&
                "-mx-2 rounded-md bg-amber-100/80 px-2 ring-1 ring-inset ring-amber-300/80 dark:bg-amber-950/40 dark:ring-amber-700/70",
            )}
          >
            <dt
              className={cn(
                "font-semibold text-muted-foreground",
                isChanged && "text-amber-900 dark:text-amber-200",
              )}
            >
              {formatFieldLabel(key)}
            </dt>
            <dd className="min-w-0 break-words">
              <HistoryStateValue
                value={value}
                changedFieldPaths={changedFieldPaths}
                fieldPath={fieldPath}
              />
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function HistoryStateValue({
  value,
  changedFieldPaths,
  fieldPath,
}: {
  value: unknown;
  changedFieldPaths: Set<string>;
  fieldPath: string;
}) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">—</span>;
  }

  if (typeof value === "boolean") {
    return <>{value ? "Sí" : "No"}</>;
  }

  if (fieldPath === "requesterSummary" && isRequesterSummary(value)) {
    return <RequesterHistoryValue name={value.name} sectors={value.sectors} />;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground">Sin elementos</span>;

    return (
      <ol className="space-y-2">
        {value.map((item, index) => (
          <li key={index} className="flex min-w-0 gap-2">
            <span className="shrink-0 text-muted-foreground">{index + 1}.</span>
            <div className="min-w-0 flex-1">
              <HistoryStateValue
                value={item}
                changedFieldPaths={changedFieldPaths}
                fieldPath={fieldPath}
              />
            </div>
          </li>
        ))}
      </ol>
    );
  }

  if (typeof value === "object") {
    return (
      <HistoryStateFields
        state={value as Record<string, unknown>}
        changedFieldPaths={changedFieldPaths}
        parentPath={fieldPath}
      />
    );
  }

  return <>{String(value)}</>;
}

function RequesterHistoryValue({
  name,
  sectors,
}: {
  name: string | number | null;
  sectors: string[] | null;
}) {
  return (
    <div className="space-y-1">
      <div>{name === null || name === "" ? "—" : String(name)}</div>
      {sectors === null ? (
        <div className="text-xs text-muted-foreground">—</div>
      ) : sectors.length === 0 ? (
        <div className="text-xs text-muted-foreground">Sin sector</div>
      ) : (
        sectors.map((sector) => (
          <div key={sector} className="text-xs text-muted-foreground">
            {sector}
          </div>
        ))
      )}
    </div>
  );
}

function getChangedFieldPaths(
  beforeState: Record<string, unknown> | null,
  afterState: Record<string, unknown> | null,
): Set<string> {
  const changedPaths = new Set<string>();
  if (!beforeState || !afterState) return changedPaths;

  collectChangedFieldPaths(beforeState, afterState, "", changedPaths);
  return changedPaths;
}

function collectChangedFieldPaths(
  beforeValue: Record<string, unknown>,
  afterValue: Record<string, unknown>,
  parentPath: string,
  changedPaths: Set<string>,
) {
  const keys = new Set(
    [...Object.keys(beforeValue), ...Object.keys(afterValue)].filter(
      (key) => !isIgnoredHistoryField(key),
    ),
  );

  keys.forEach((key) => {
    const fieldPath = parentPath ? `${parentPath}.${key}` : key;
    const hasBeforeValue = Object.prototype.hasOwnProperty.call(beforeValue, key);
    const hasAfterValue = Object.prototype.hasOwnProperty.call(afterValue, key);

    if (!hasBeforeValue || !hasAfterValue) {
      changedPaths.add(fieldPath);
      return;
    }

    const beforeFieldValue = beforeValue[key];
    const afterFieldValue = afterValue[key];

    if (isHistoryStateRecord(beforeFieldValue) && isHistoryStateRecord(afterFieldValue)) {
      collectChangedFieldPaths(beforeFieldValue, afterFieldValue, fieldPath, changedPaths);
      return;
    }

    if (!areHistoryValuesEqual(beforeFieldValue, afterFieldValue)) {
      changedPaths.add(fieldPath);
    }
  });
}

function isHistoryStateRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIgnoredHistoryField(key: string): boolean {
  return key.toLowerCase() === "id";
}

function areHistoryValuesEqual(beforeValue: unknown, afterValue: unknown): boolean {
  if (Object.is(beforeValue, afterValue)) return true;

  if (Array.isArray(beforeValue) && Array.isArray(afterValue)) {
    return (
      beforeValue.length === afterValue.length &&
      beforeValue.every((item, index) => areHistoryValuesEqual(item, afterValue[index]))
    );
  }

  if (isHistoryStateRecord(beforeValue) && isHistoryStateRecord(afterValue)) {
    const beforeKeys = Object.keys(beforeValue).filter((key) => !isIgnoredHistoryField(key));
    const afterKeys = Object.keys(afterValue).filter((key) => !isIgnoredHistoryField(key));
    return (
      beforeKeys.length === afterKeys.length &&
      beforeKeys.every(
        (key) =>
          Object.prototype.hasOwnProperty.call(afterValue, key) &&
          areHistoryValuesEqual(beforeValue[key], afterValue[key]),
      )
    );
  }

  return false;
}

function formatFieldLabel(value: string): string {
  const labels: Record<string, string> = {
    projectId: "ID Proyecto",
    projectName: "Nombre proyecto",
    priority: "Prioridad TI",
    requesterSummary: "Solicitante",
    locationName: "Sede",
    projectTypeName: "Sistema relacionado",
    projectStateName: "Estado",
    progress: "Avance",
    approved: "Aprobado",
    createdAt: "Creado el",
    ticketCreatedAt: "Ticket abierto el",
    vigente: "Vigente",
    objective: "Objetivo",
    description: "Descripción",
    impact: "Impacto",
    requestType: "Tipo de requerimiento",
    approverName: "Aprobador",
    team: "Equipo",
    tasks: "Tareas",
    ticketId: "ID Ticket",
    updatedAt: "Actualizado el",
  };
  if (labels[value]) return labels[value];

  const label = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();

  return label ? label.charAt(0).toUpperCase() + label.slice(1) : value;
}

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Fecha no disponible";
  return parsed.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
