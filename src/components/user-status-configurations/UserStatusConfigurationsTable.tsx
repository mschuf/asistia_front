import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Power } from "lucide-react";
import type {
  Configuration,
  ConfigurationSortColumn,
  SortOrder,
} from "@/api/userStatusConfigurations";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

const actionClass = "inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

interface Props {
  rows: Configuration[];
  sort: { column: ConfigurationSortColumn; order: SortOrder } | null;
  onSort: (column: ConfigurationSortColumn) => void;
  onEdit: (configuration: Configuration) => void;
  onStatusChange: (configuration: Configuration) => void;
}

export function UserStatusConfigurationsTable({ rows, sort, onSort, onEdit, onStatusChange }: Props) {
  if (rows.length === 0) {
    return <EmptyState title="Sin configuraciones" description="No hay configuraciones que coincidan con los filtros aplicados." />;
  }

  return (
    <div className="overflow-hidden rounded-md border bg-card shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <SortableHeader column="description" label="Descripción" sort={sort} onSort={onSort} />
              <SortableHeader column="value" label="Valor" sort={sort} onSort={onSort} />
              <SortableHeader column="active" label="Estado" sort={sort} onSort={onSort} />
              <SortableHeader column="updatedAt" label="Última actualización" sort={sort} onSort={onSort} />
              <th className="px-4 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((configuration) => (
              <tr key={configuration.id} className="hover:bg-muted/40">
                <td className="px-4 py-3 font-medium">{configuration.description}</td>
                <td className="px-4 py-3 font-mono text-xs">{configuration.value}</td>
                <td className="px-4 py-3">
                  <Badge variant={configuration.active ? "success" : "default"}>
                    {configuration.active ? "Activa" : "Inactiva"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(configuration.updatedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className={cn(actionClass, "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300")}
                      onClick={() => onEdit(configuration)}
                      title="Editar"
                      aria-label={`Editar ${configuration.description}`}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={cn(
                        actionClass,
                        configuration.active
                          ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
                          : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300",
                      )}
                      onClick={() => onStatusChange(configuration)}
                      title={configuration.active ? "Desactivar" : "Activar"}
                      aria-label={`${configuration.active ? "Desactivar" : "Activar"} ${configuration.description}`}
                    >
                      <Power className="h-4 w-4" aria-hidden="true" />
                    </button>
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

function SortableHeader({
  column,
  label,
  sort,
  onSort,
}: {
  column: ConfigurationSortColumn;
  label: string;
  sort: Props["sort"];
  onSort: Props["onSort"];
}) {
  const active = sort?.column === column;
  return (
    <th className="px-4 py-3 font-semibold" aria-sort={active ? (sort.order === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" onClick={() => onSort(column)} className="inline-flex items-center gap-1.5 hover:text-foreground">
        {label}
        {active
          ? sort.order === "asc"
            ? <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
            : <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
          : <ArrowUpDown className="h-3.5 w-3.5 opacity-50" aria-hidden="true" />}
      </button>
    </th>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-PY", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}
