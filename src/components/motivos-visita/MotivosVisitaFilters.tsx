/**
 * @file MotivosVisitaFilters.tsx
 * @description Barra de búsqueda y filtros avanzados del CRUD de motivos de visita.
 */
import { useCallback, useState, type ReactNode } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { MotivosVisitaFilterState } from "@/types/pages/motivos-visita-page.types";

interface MotivosVisitaFiltersProps {
  filters: MotivosVisitaFilterState;
  onChange: (filters: MotivosVisitaFilterState) => void;
  onApply: (filters?: MotivosVisitaFilterState) => void;
  actions?: ReactNode;
}

/** Filtros de motivos de visita con búsqueda rápida y panel avanzado. */
export function MotivosVisitaFilters({ filters, onChange, onApply, actions }: MotivosVisitaFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const update = useCallback(
    (key: keyof MotivosVisitaFilterState, value: string) => {
      onChange({ ...filters, [key]: value });
    },
    [filters, onChange],
  );

  return (
    <div className="overflow-visible rounded-md border bg-card p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1 pb-0.5">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(event) => update("search", event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              onApply();
            }}
            placeholder="Buscar por ID o nombre..."
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
        {actions ? <div className="shrink-0 pb-0.5">{actions}</div> : null}
      </div>

      {expanded ? (
        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-end gap-2 overflow-visible pb-1">
          <label className="flex min-w-0 flex-col gap-1 pb-0.5 text-sm">
            <span className="text-muted-foreground">Nombre</span>
            <Input
              value={filters.nombre}
              onChange={(event) => update("nombre", event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                onApply();
              }}
            />
          </label>
          <label className="flex min-w-0 flex-col gap-1 pb-0.5 text-sm">
            <span className="text-muted-foreground">Estado</span>
            <Select value={filters.activo} onChange={(event) => update("activo", event.target.value)}>
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </Select>
          </label>
          <Button type="button" className="mb-0.5 shrink-0" onClick={() => onApply()}>
            Aplicar filtros
          </Button>
        </div>
      ) : null}
    </div>
  );
}
