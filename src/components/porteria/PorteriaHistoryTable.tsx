/**

 * @file PorteriaHistoryTable.tsx

 * @description Tabla de historial de visitas con orden por columnas.

 */

import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";

import { cn } from "@/lib/utils";

import type {

  PorteriaHistoryRecord,

  PorteriaHistorySortColumn,

  PorteriaHistorySortOrder,

} from "@/types/pages/porteria-page.types";



interface PorteriaHistoryTableProps {

  rows: PorteriaHistoryRecord[];

  selectedId: number | null;

  sortColumn?: PorteriaHistorySortColumn | null;

  sortOrder?: PorteriaHistorySortOrder | null;

  onSortColumnChange?: (column: PorteriaHistorySortColumn) => void;

  onRowClick: (record: PorteriaHistoryRecord) => void;

}



const SORTABLE_COLUMNS: Array<{ id: PorteriaHistorySortColumn; label: string }> = [

  { id: "id", label: "Visita" },

  { id: "visitante", label: "Visitante" },

  { id: "documento", label: "Documento" },

  { id: "empresa", label: "Empresa" },

  { id: "motivo", label: "Motivo" },

  { id: "responsable", label: "Responsable" },

];



/** @param props - Columna, sort activo y callback. @returns Celda de cabecera ordenable. */

function SortableHeader({

  column,

  label,

  sortColumn,

  sortOrder,

  onSortColumnChange,

}: {

  column: PorteriaHistorySortColumn;

  label: string;

  sortColumn?: PorteriaHistorySortColumn | null;

  sortOrder?: PorteriaHistorySortOrder | null;

  onSortColumnChange?: (column: PorteriaHistorySortColumn) => void;

}) {

  const isActive = sortColumn === column;

  const ariaSort = isActive

    ? sortOrder === "asc"

      ? "ascending"

      : "descending"

    : "none";



  if (!onSortColumnChange) {

    return <th className="px-4 py-3 font-semibold">{label}</th>;

  }



  return (

    <th className="px-4 py-3 font-semibold" aria-sort={ariaSort}>

      <button

        type="button"

        className={cn(

          "inline-flex items-center gap-1 rounded-sm text-left transition-colors",

          "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",

          isActive ? "text-foreground" : "text-muted-foreground",

        )}

        onClick={() => onSortColumnChange(column)}

      >

        <span>{label}</span>

        {isActive && sortOrder === "asc" ? (

          <ArrowUp className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />

        ) : isActive && sortOrder === "desc" ? (

          <ArrowDown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />

        ) : (

          <ArrowUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden="true" />

        )}

      </button>

    </th>

  );

}



/**

 * Muestra una tabla de historial con columnas ordenables.

 * @param props - Filas, seleccion, orden y callback de click.

 * @returns Tabla responsive.

 */

export function PorteriaHistoryTable({

  rows,

  selectedId,

  sortColumn,

  sortOrder,

  onSortColumnChange,

  onRowClick,

}: PorteriaHistoryTableProps) {

  if (rows.length === 0) {

    return <EmptyState title="Sin historial" description="No hay registros para mostrar." />;

  }



  return (

    <div className="overflow-hidden rounded-xl border bg-card shadow-soft">

      <div className="border-b bg-muted/40 px-4 py-3 sm:px-5">

        <h2 className="text-sm font-semibold">Historial de visitas</h2>

      </div>

      <div className="overflow-x-auto">

        <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-sm">

          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">

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

              <th className="w-10 px-2 py-3" aria-hidden="true" />

            </tr>

          </thead>

          <tbody className="[&>tr:not(:last-child)>td]:border-b [&>tr:not(:last-child)>td]:border-muted-foreground/20">

            {rows.map((row) => {

              const isActive = row.id === selectedId;

              return (

                <tr

                  key={row.id}

                  className={cn(

                    "group cursor-pointer transition-colors hover:bg-muted/50",

                    isActive && "bg-primary/5 hover:bg-primary/10",

                  )}

                  onClick={() => onRowClick(row)}

                >

                  {SORTABLE_COLUMNS.map(({ id }, index) => (

                    <td

                      key={id}

                      className={cn(

                        "px-4 py-3.5 sm:px-5",

                        id === "id" && "whitespace-nowrap tabular-nums text-muted-foreground",

                        index === 1 && "font-medium",

                      )}

                    >

                      {id === "id" ? `#${row.id}` : row[id]}

                    </td>

                  ))}

                  <td className="px-2 py-3.5 text-muted-foreground">

                    <ChevronRight

                      className={cn(

                        "h-4 w-4 transition-transform group-hover:translate-x-0.5",

                        isActive && "text-primary",

                      )}

                      aria-hidden="true"

                    />

                  </td>

                </tr>

              );

            })}

          </tbody>

        </table>

      </div>

    </div>

  );

}


