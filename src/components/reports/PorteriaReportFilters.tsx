/**
 * @file PorteriaReportFilters.tsx
 * @description Filtros del reporte superadmin de visitas de portería.
 */
import { useCallback } from "react";
import { Search } from "lucide-react";
import type { VisitaEstado } from "@/api/visitas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { PorteriaReportFilterState } from "@/types/pages/porteria-report.types";

interface PorteriaReportFiltersProps {
  filters: PorteriaReportFilterState;
  onChange: (filters: PorteriaReportFilterState) => void;
  onApply: (filters?: PorteriaReportFilterState) => void;
}

const ESTADO_OPTIONS: Array<{ value: VisitaEstado; label: string }> = [
  { value: "programada", label: "Programada" },
  { value: "activa", label: "Activa" },
  { value: "sin_salida", label: "Sin salida" },
  { value: "finalizada", label: "Finalizada" },
  { value: "cancelada", label: "Cancelada" },
];

/**
 * Filtros de fechas, estado, empresa y visitante del reporte de portería.
 * @param props - Estado de filtros y callbacks apply/change.
 * @returns Panel de filtros del reporte.
 */
export function PorteriaReportFilters({
  filters,
  onChange,
  onApply,
}: PorteriaReportFiltersProps) {
  const update = useCallback(
    (key: keyof PorteriaReportFilterState, value: string) => {
      onChange({ ...filters, [key]: value });
    },
    [filters, onChange],
  );

  return (
    <div className="rounded-md border bg-card p-3">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">Desde</span>
          <Input
            type="datetime-local"
            value={filters.entradaFrom}
            onChange={(event) => update("entradaFrom", event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">Hasta</span>
          <Input
            type="datetime-local"
            value={filters.entradaTo}
            onChange={(event) => update("entradaTo", event.target.value)}
          />
        </label>
        <div className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">Estado</span>
          <SearchableSelect
            value={filters.estado}
            onChange={(value) => update("estado", value)}
            options={ESTADO_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
              searchText: option.label.toLowerCase(),
            }))}
            placeholder="Todos los estados"
            searchPlaceholder="Buscar estado..."
            emptyOption={{ value: "", label: "Todos los estados" }}
          />
        </div>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">Empresa</span>
          <Input
            value={filters.empresa}
            onChange={(event) => update("empresa", event.target.value)}
            placeholder="Todas las empresas"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">Visitante</span>
          <Input
            value={filters.visitante}
            onChange={(event) => update("visitante", event.target.value)}
            placeholder="Todos los visitantes"
          />
        </label>
        <div className="flex items-end">
          <Button type="button" className="w-full" onClick={() => onApply()}>
            <Search className="mr-2 h-4 w-4" aria-hidden="true" />
            Buscar
          </Button>
        </div>
      </div>
    </div>
  );
}
