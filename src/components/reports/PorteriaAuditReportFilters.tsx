/**
 * @file PorteriaAuditReportFilters.tsx
 * @description Filtros del reporte superadmin de auditoría de portería.
 */
import { useCallback, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import type { VisitaEstado } from "@/api/visitas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { cn } from "@/lib/utils";
import type {
  PorteriaAuditAction,
  PorteriaAuditFilterState,
} from "@/types/pages/porteria-audit-report.types";

interface PorteriaAuditReportFiltersProps {
  filters: PorteriaAuditFilterState;
  onChange: (filters: PorteriaAuditFilterState) => void;
  onApply: (filters?: PorteriaAuditFilterState) => void;
}

const ACTION_OPTIONS: Array<{ value: PorteriaAuditAction; label: string }> = [
  { value: "visita.created", label: "Registro de visita" },
  { value: "visita.updated", label: "Edición de visita" },
  { value: "visita.closed", label: "Cierre de visita" },
  { value: "visita.deleted", label: "Eliminación de visita" },
];

const ESTADO_OPTIONS: Array<{ value: VisitaEstado; label: string }> = [
  { value: "programada", label: "Programada" },
  { value: "activa", label: "Activa" },
  { value: "sin_salida", label: "Sin salida" },
  { value: "finalizada", label: "Finalizada" },
  { value: "cancelada", label: "Cancelada" },
];

/** Filtros de búsqueda general y avanzados para la tabla de auditoría. */
export function PorteriaAuditReportFilters({
  filters,
  onChange,
  onApply,
}: PorteriaAuditReportFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const update = useCallback(
    (key: keyof PorteriaAuditFilterState, value: string) => {
      onChange({ ...filters, [key]: value });
    },
    [filters, onChange],
  );

  return (
    <div className="overflow-visible rounded-md border bg-card p-3">
      <div className="relative pb-0.5">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.q}
          onChange={(event) => update("q", event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            onApply();
          }}
          placeholder="Buscar por visita, acción, actor, visitante, documento..."
          className="pl-9 pr-10"
        />
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          aria-label={expanded ? "Ocultar filtros avanzados" : "Mostrar filtros avanzados"}
          className="absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronDown
            className={cn("h-4 w-4 transition-transform duration-200", expanded && "rotate-180")}
            aria-hidden="true"
          />
        </button>
      </div>

      {expanded ? (
        <div className="mt-3 grid grid-cols-1 items-end gap-2 overflow-visible pb-1 sm:grid-cols-2 xl:grid-cols-5">
          <label className="flex min-w-0 flex-col gap-1 pb-0.5 text-sm">
            <span className="text-muted-foreground">Desde</span>
            <Input
              type="date"
              value={filters.occurredFrom}
              onChange={(event) => update("occurredFrom", event.target.value)}
              className="date-input-mobile-picker-end w-full px-2"
            />
          </label>

          <label className="flex min-w-0 flex-col gap-1 pb-0.5 text-sm">
            <span className="text-muted-foreground">Hasta</span>
            <Input
              type="date"
              value={filters.occurredTo}
              onChange={(event) => update("occurredTo", event.target.value)}
              className="date-input-mobile-picker-end w-full px-2"
            />
          </label>

          <div className="flex min-w-0 flex-col gap-1 pb-0.5 text-sm">
            <span className="text-muted-foreground">Acción</span>
            <SearchableSelect
              value={filters.action}
              onChange={(value) => update("action", value)}
              options={ACTION_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
                searchText: `${option.label} ${option.value}`.toLowerCase(),
              }))}
              placeholder="Todas las acciones"
              searchPlaceholder="Buscar acción..."
              emptyOption={{ value: "", label: "Todas las acciones" }}
            />
          </div>

          <label className="flex min-w-0 flex-col gap-1 pb-0.5 text-sm">
            <span className="text-muted-foreground">Actor (ID)</span>
            <Input
              value={filters.actorUserId}
              onChange={(event) => update("actorUserId", event.target.value)}
              placeholder="Ej: 145"
            />
          </label>

          <label className="flex min-w-0 flex-col gap-1 pb-0.5 text-sm">
            <span className="text-muted-foreground">Visita (ID)</span>
            <Input
              value={filters.visitaId}
              onChange={(event) => update("visitaId", event.target.value)}
              placeholder="Ej: 88"
            />
          </label>

          <label className="flex min-w-0 flex-col gap-1 pb-0.5 text-sm">
            <span className="text-muted-foreground">Visitante</span>
            <Input
              value={filters.visitante}
              onChange={(event) => update("visitante", event.target.value)}
            />
          </label>

          <label className="flex min-w-0 flex-col gap-1 pb-0.5 text-sm">
            <span className="text-muted-foreground">Documento</span>
            <Input
              value={filters.documento}
              onChange={(event) => update("documento", event.target.value)}
            />
          </label>

          <div className="flex min-w-0 flex-col gap-1 pb-0.5 text-sm">
            <span className="text-muted-foreground">Estado previo</span>
            <SearchableSelect
              value={filters.estadoBefore}
              onChange={(value) => update("estadoBefore", value)}
              options={ESTADO_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
                searchText: option.label.toLowerCase(),
              }))}
              placeholder="Todos"
              searchPlaceholder="Buscar estado..."
              emptyOption={{ value: "", label: "Todos" }}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-1 pb-0.5 text-sm">
            <span className="text-muted-foreground">Estado nuevo</span>
            <SearchableSelect
              value={filters.estadoAfter}
              onChange={(value) => update("estadoAfter", value)}
              options={ESTADO_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
                searchText: option.label.toLowerCase(),
              }))}
              placeholder="Todos"
              searchPlaceholder="Buscar estado..."
              emptyOption={{ value: "", label: "Todos" }}
            />
          </div>

          <div className="flex w-fit flex-col items-center justify-end gap-1 justify-self-center pb-0.5">
            <span className="pointer-events-none invisible text-sm leading-none" aria-hidden="true">
              &nbsp;
            </span>
            <Button type="button" size="sm" className="w-fit shrink-0 gap-1 px-2" onClick={() => onApply(filters)}>
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
              Buscar
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
