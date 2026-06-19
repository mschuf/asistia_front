/**
 * @file PorteriaReportTable.tsx
 * @description Tabla del reporte superadmin de visitas de portería.
 */
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateParts } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PorteriaReportLog } from "@/types/pages/porteria-report.types";
import type {
  PorteriaReportSortColumn,
  PorteriaReportSortOrder,
} from "@/types/pages/porteria-report.types";

const SORTABLE_COLUMNS: Array<{ label: string; id: PorteriaReportSortColumn }> = [
  { label: "Entrada", id: "entradaAt" },
  { label: "Salida", id: "salidaAt" },
  { label: "Visitante", id: "visitante" },
  { label: "Documento", id: "documento" },
  { label: "Empresa", id: "empresa" },
  { label: "Motivo", id: "motivo" },
  { label: "Responsable", id: "responsable" },
  { label: "Estado", id: "estado" },
];

const DISPLAY_COLUMNS: Array<{ label: string; key: keyof PorteriaReportLog }> = [
  { label: "Zonas", key: "zonas" },
  { label: "Tarjeta", key: "tarjeta" },
];

const ESTADO_LABELS: Record<PorteriaReportLog["estado"], string> = {
  programada: "Programada",
  activa: "Activa",
  sin_salida: "Sin salida",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
};

interface PorteriaReportTableProps {
  items: PorteriaReportLog[];
  sortColumn?: PorteriaReportSortColumn | null;
  sortOrder?: PorteriaReportSortOrder | null;
  onSortColumnChange?: (column: PorteriaReportSortColumn) => void;
}

/** @param props - Fecha ISO. @returns Celda con fecha y hora en dos líneas. */
function DateTimeCell({ value }: { value: string | null }) {
  if (!value) return <span>—</span>;
  const { date, time } = formatDateParts(value);
  return (
    <div className="leading-tight">
      <span className="whitespace-nowrap">{date}</span>
      {time ? <span className="mt-1.5 block whitespace-nowrap">{time}</span> : null}
    </div>
  );
}

/** @param props - Columna, sort activo y callback. @returns Celda de cabecera ordenable. */
function SortableHeader({
  column,
  label,
  sortColumn,
  sortOrder,
  onSortColumnChange,
}: {
  column: PorteriaReportSortColumn;
  label: string;
  sortColumn?: PorteriaReportSortColumn | null;
  sortOrder?: PorteriaReportSortOrder | null;
  onSortColumnChange?: (column: PorteriaReportSortColumn) => void;
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
 * Tabla de solo lectura del reporte de visitas de portería.
 * @param props - Lista de visitas y callbacks de ordenación.
 * @returns Tabla o EmptyState si no hay resultados.
 */
export function PorteriaReportTable({
  items,
  sortColumn = null,
  sortOrder = null,
  onSortColumnChange,
}: PorteriaReportTableProps) {
  if (!items.length) {
    return (
      <EmptyState
        title="Sin registros"
        description="No hay visitas de portería para los filtros actuales."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-md border bg-card shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] border-separate border-spacing-0 text-left text-sm">
          <thead className="bg-muted text-xs uppercase tracking-normal text-muted-foreground">
            <tr>
              {SORTABLE_COLUMNS.map((column) => (
                <SortableHeader
                  key={column.id}
                  column={column.id}
                  label={column.label}
                  sortColumn={sortColumn}
                  sortOrder={sortOrder}
                  onSortColumnChange={onSortColumnChange}
                />
              ))}
              {DISPLAY_COLUMNS.map((column) => (
                <th key={column.key} className="px-4 py-3 font-semibold">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&>tr:not(:last-child)>td]:border-b [&>tr:not(:last-child)>td]:border-muted-foreground/25">
            {items.map((item, index) => (
              <tr
                key={`${item.entradaAt ?? "sin-entrada"}-${item.visitante}-${index}`}
                className="hover:bg-muted/50"
              >
                <td className="px-4 py-3 text-muted-foreground">
                  <DateTimeCell value={item.entradaAt} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <DateTimeCell value={item.salidaAt} />
                </td>
                <td className="px-4 py-3 font-medium">{item.visitante}</td>
                <td className="whitespace-nowrap px-4 py-3">{item.documento}</td>
                <td className="px-4 py-3">{item.empresa ?? "—"}</td>
                <td className="min-w-48 px-4 py-3">{item.motivo}</td>
                <td className="px-4 py-3">{item.responsable}</td>
                <td className="whitespace-nowrap px-4 py-3">{ESTADO_LABELS[item.estado]}</td>
                <td className="min-w-36 px-4 py-3">{item.zonas}</td>
                <td className="whitespace-nowrap px-4 py-3">{item.tarjeta ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
