/**
 * @file VisitasFilters.tsx
 * @description Barra de búsqueda y filtros avanzados del CRUD de visitas.
 */
import { useCallback, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { VisitasFilterState } from "@/types/pages/visitas-page.types";

interface VisitasFiltersProps {
  filters: VisitasFilterState;
  onChange: (filters: VisitasFilterState) => void;
  onApply: (filters?: VisitasFilterState) => void;
}

const ADVANCED_FIELDS: Array<{ key: keyof Omit<VisitasFilterState, "search" | "estado">; label: string }> = [
  { key: "visitante", label: "Visitante" },
  { key: "documento", label: "Documento" },
  { key: "empresa", label: "Empresa" },
  { key: "motivo", label: "Motivo" },
  { key: "responsable", label: "Responsable" },
];

/** Filtros de visitas con búsqueda rápida y panel avanzado. */
export function VisitasFilters({ filters, onChange, onApply }: VisitasFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const update = useCallback(
    (key: keyof VisitasFilterState, value: string) => {
      onChange({ ...filters, [key]: value });
    },
    [filters, onChange],
  );

  return (
    <div className="overflow-visible rounded-md border bg-card p-3">
      <div className="relative pb-0.5">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(event) => update("search", event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            onApply();
          }}
          placeholder="Buscar visita por visitante, documento, empresa, motivo..."
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
        <div className="mt-3 grid grid-cols-[repeat(5,minmax(0,1fr))_minmax(0,1fr)_auto] items-end gap-2 overflow-visible pb-1">
          {ADVANCED_FIELDS.map(({ key, label }) => (
            <label key={key} className="flex min-w-0 flex-col gap-1 pb-0.5 text-sm">
              <span className="text-muted-foreground">{label}</span>
              <Input
                value={filters[key]}
                onChange={(event) => update(key, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  onApply();
                }}
              />
            </label>
          ))}
          <label className="flex min-w-0 flex-col gap-1 pb-0.5 text-sm">
            <span className="text-muted-foreground">Estado</span>
            <Select value={filters.estado} onChange={(event) => update("estado", event.target.value)}>
              <option value="">Todos</option>
              <option value="programada">Programada</option>
              <option value="activa">Activa</option>
              <option value="finalizada">Finalizada</option>
              <option value="cancelada">Cancelada</option>
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
