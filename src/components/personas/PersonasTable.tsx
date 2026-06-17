/**
 * @file PersonasTable.tsx
 * @description Tabla de personas con orden por columnas.
 */
import { ArrowDown, ArrowUp, ArrowUpDown, Image, Pencil, Power, Trash2 } from "lucide-react";
import type { Persona, PersonaSortColumn, PersonaSortOrder } from "@/api/personas";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

interface PersonasTableProps {
  rows: Persona[];
  sortColumn?: PersonaSortColumn | null;
  sortOrder?: PersonaSortOrder | null;
  onSortColumnChange?: (column: PersonaSortColumn) => void;
  onEdit: (persona: Persona) => void;
  onViewPhoto: (persona: Persona) => void;
  onActivate: (persona: Persona) => void;
  onDeactivate: (persona: Persona) => void;
  onDelete: (persona: Persona) => void;
}

const SORTABLE_COLUMNS: Array<{ id: PersonaSortColumn; label: string }> = [
  { id: "id", label: "ID" },
  { id: "nombre", label: "Nombre" },
  { id: "documento", label: "Documento" },
  { id: "empresa", label: "Empresa" },
];

const actionIconButtonClass =
  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40";

function SortableHeader({
  column,
  label,
  sortColumn,
  sortOrder,
  onSortColumnChange,
}: {
  column: PersonaSortColumn;
  label: string;
  sortColumn?: PersonaSortColumn | null;
  sortOrder?: PersonaSortOrder | null;
  onSortColumnChange?: (column: PersonaSortColumn) => void;
}) {
  const isActive = sortColumn === column;
  const ariaSort = isActive ? (sortOrder === "asc" ? "ascending" : "descending") : "none";

  if (!onSortColumnChange) {
    return <th className="px-4 py-3 font-semibold">{label}</th>;
  }

  return (
    <th className="px-4 py-3 font-semibold" aria-sort={ariaSort}>
      <button
        type="button"
        onClick={() => onSortColumnChange(column)}
        className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
      >
        <span>{label}</span>
        {isActive ? (
          sortOrder === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" aria-hidden="true" />
        )}
      </button>
    </th>
  );
}

/** Tabla ordenable de personas con acciones CRUD. */
export function PersonasTable({
  rows,
  sortColumn,
  sortOrder,
  onSortColumnChange,
  onEdit,
  onViewPhoto,
  onActivate,
  onDeactivate,
  onDelete,
}: PersonasTableProps) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="Sin personas"
        description="No hay personas registradas o no coinciden con los filtros aplicados."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-md border bg-card shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse text-left text-sm">
          <thead className="bg-muted text-xs uppercase tracking-normal text-muted-foreground">
            <tr>
              {SORTABLE_COLUMNS.map(({ id, label }) => (
                <SortableHeader
                  key={id}
                  column={id}
                  label={label}
                  sortColumn={sortColumn}
                  sortOrder={sortOrder}
                  onSortColumnChange={onSortColumnChange}
                />
              ))}
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((persona) => (
              <tr key={persona.id} className="hover:bg-muted/40">
                <td className="px-4 py-3 tabular-nums">{persona.id}</td>
                <td className="px-4 py-3 font-medium">{persona.nombre}</td>
                <td className="px-4 py-3">{persona.documento}</td>
                <td className="px-4 py-3">{persona.empresa ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge variant={persona.activo ? "success" : "danger"}>
                    {persona.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-nowrap items-center gap-1.5">
                    {persona.hasFoto ? (
                      <button
                        type="button"
                        aria-label="Ver foto"
                        title="Ver foto"
                        onClick={() => onViewPhoto(persona)}
                        className={cn(actionIconButtonClass, "border-border hover:bg-muted")}
                      >
                        <Image className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      aria-label="Editar"
                      title="Editar"
                      onClick={() => onEdit(persona)}
                      className={cn(actionIconButtonClass, "border-border hover:bg-muted")}
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    {persona.activo ? (
                      <button
                        type="button"
                        aria-label="Desactivar"
                        title="Desactivar"
                        onClick={() => onDeactivate(persona)}
                        className={cn(actionIconButtonClass, "border-amber-300 text-amber-700 hover:bg-amber-50")}
                      >
                        <Power className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        aria-label="Activar"
                        title="Activar"
                        onClick={() => onActivate(persona)}
                        className={cn(actionIconButtonClass, "border-emerald-300 text-emerald-700 hover:bg-emerald-50")}
                      >
                        <Power className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label="Eliminar"
                      title="Eliminar"
                      onClick={() => onDelete(persona)}
                      className={cn(actionIconButtonClass, "border-red-300 text-red-700 hover:bg-red-50")}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
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
