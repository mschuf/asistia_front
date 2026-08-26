import { ArrowDown, ArrowUp, ArrowUpDown, CheckCircle2, CircleHelp, ClockAlert, History, LockKeyhole, Pencil, Power, TriangleAlert, XCircle } from "lucide-react";
import type { ComponentType } from "react";
import type { MonitoredUser, UserSourceStatus, UserStatusCode, UserStatusSortColumn, UserStatusSortOrder, UserStatusSource } from "@/api/userStatus";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

const SOURCES: UserStatusSource[] = ["AD", "SAP", "OFFICE", "GLPI"];
const STATUS: Record<UserStatusCode, { label: string; variant: BadgeProps["variant"]; icon: ComponentType<{ className?: string }> }> = {
  ACTIVO: { label: "Activo", variant: "success", icon: CheckCircle2 },
  INACTIVO: { label: "Inactivo", variant: "danger", icon: XCircle },
  BLOQUEADO: { label: "Bloqueado", variant: "warning", icon: LockKeyhole },
  EXPIRADO: { label: "Expirado", variant: "warning", icon: ClockAlert },
  NO_ENCONTRADO: { label: "No encontrado", variant: "default", icon: CircleHelp },
  ERROR: { label: "Error", variant: "danger", icon: TriangleAlert },
  DESCONOCIDO: { label: "Desconocido", variant: "info", icon: CircleHelp },
};
const actionClass = "inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface Props {
  rows: MonitoredUser[];
  sort: { column: UserStatusSortColumn; order: UserStatusSortOrder } | null;
  onSort: (column: UserStatusSortColumn) => void;
  onEdit: (user: MonitoredUser) => void;
  onHistory: (user: MonitoredUser) => void;
  onDeactivate: (user: MonitoredUser) => void;
  onActivate: (user: MonitoredUser) => void;
}

export function UserStatusTable({ rows, sort, onSort, onEdit, onHistory, onDeactivate, onActivate }: Props) {
  if (rows.length === 0) return <EmptyState title="Sin usuarios monitoreados" description="No hay resultados para los filtros aplicados." />;
  return (
    <div className="overflow-hidden rounded-md border bg-card shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1280px] border-collapse text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <SortableHeader column="name" label="Usuario" sort={sort} onSort={onSort} />
              <SortableHeader column="company" label="Empresa" sort={sort} onSort={onSort} />
              {SOURCES.map((source) => <SortableHeader key={source} column={source} label={source === "OFFICE" ? "Office" : source} sort={sort} onSort={onSort} />)}
              <SortableHeader column="updatedAt" label="Última actualización" sort={sort} onSort={onSort} />
              <th className="px-4 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((user) => (
              <tr key={user.id} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  <p className="font-medium">{user.name}</p>
                  {!user.active ? <Badge variant="default" className="mt-1">Monitoreo desactivado</Badge> : null}
                </td>
                <td className="px-4 py-3">
                  {user.company ? (
                    <div>
                      <p className="font-medium">{user.company.name}</p>
                      {!user.company.active ? <Badge variant="default" className="mt-1">Empresa inactiva</Badge> : null}
                    </div>
                  ) : <span className="text-muted-foreground">Sin empresa</span>}
                </td>
                {SOURCES.map((source) => <SourceCell key={source} value={user.sources[source]} />)}
                <td className="px-4 py-3 text-muted-foreground">
                  {user.lastCheckedAt ? formatDate(user.lastCheckedAt) : "Sin consultar"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button type="button" className={cn(actionClass, "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300")} onClick={() => onEdit(user)} title="Editar" aria-label={`Editar ${user.name}`}>
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button type="button" className={cn(actionClass, "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-300")} onClick={() => onHistory(user)} title="Ver historial" aria-label={`Historial de ${user.name}`}>
                      <History className="h-4 w-4" aria-hidden="true" />
                    </button>
                    {user.active ? (
                      <button type="button" className={cn(actionClass, "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300")} onClick={() => onDeactivate(user)} title="Desactivar monitoreo" aria-label={`Desactivar monitoreo de ${user.name}`}>
                        <Power className="h-4 w-4" aria-hidden="true" />
                      </button>
                    ) : (
                      <button type="button" className={cn(actionClass, "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300")} onClick={() => onActivate(user)} title="Activar monitoreo" aria-label={`Activar monitoreo de ${user.name}`}>
                        <Power className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SourceCell({ value }: { value?: UserSourceStatus }) {
  if (!value) return <td className="px-4 py-3"><span className="text-muted-foreground" title="Fuente no configurada">—</span></td>;
  const config = STATUS[value.status];
  const Icon = config.icon;
  const tooltip = [value.detail, value.checkedAt ? `Consultado: ${formatDate(value.checkedAt)}` : "Sin consultar"].filter(Boolean).join("\n");
  return (
    <td className="px-4 py-3" title={tooltip}>
      <Badge variant={config.variant} className="gap-1.5 whitespace-nowrap">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {config.label}
      </Badge>
      <p className="mt-1 max-w-44 truncate text-xs text-muted-foreground" title={value.identifier}>{value.identifier}</p>
    </td>
  );
}

function SortableHeader({ column, label, sort, onSort }: { column: UserStatusSortColumn; label: string; sort: Props["sort"]; onSort: Props["onSort"] }) {
  const active = sort?.column === column;
  return (
    <th className="px-4 py-3 font-semibold" aria-sort={active ? (sort.order === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" onClick={() => onSort(column)} className="inline-flex items-center gap-1.5 hover:text-foreground">
        {label}
        {active ? (sort.order === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />) : <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />}
      </button>
    </th>
  );
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-PY", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
