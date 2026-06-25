/**
 * @file VisitasFilters.tsx
 * @description Barra de búsqueda y filtros avanzados del CRUD de visitas.
 */
import { useCallback, useState } from "react";
import { ChevronDown, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ServerSearchableSelect } from "@/components/ui/server-searchable-select";
import {
  loadMotivoVisitaSelectOptions,
  resolveMotivoVisitaSelectOption,
} from "@/lib/porteria-motivos-visita";
import {
  loadVisitPersonCandidateOptions,
  resolveCandidateOption,
} from "@/lib/porteria-personas";
import {
  loadProveedorSelectOptions,
  resolveProveedorSelectOption,
} from "@/lib/porteria-proveedores";
import {
  loadResponsableCandidateOptions,
  resolveResponsableCandidateOption,
} from "@/lib/visitas-responsables";
import { cn } from "@/lib/utils";
import type { VisitasFilterState } from "@/types/pages/visitas-page.types";

interface VisitasFiltersProps {
  filters: VisitasFilterState;
  onChange: (filters: VisitasFilterState) => void;
  onApply: (filters?: VisitasFilterState) => void | Promise<void>;
  onCreateVisit?: () => void;
}

const TEXT_FIELDS: Array<{ key: "documento" | "responsable"; label: string }> = [
  { key: "documento", label: "Documento" },
];

const VISITANTE_EMPTY_OPTION = { value: "", label: "Todos los visitantes" };
const EMPRESA_EMPTY_OPTION = { value: "", label: "Todas las empresas" };
const MOTIVO_EMPTY_OPTION = { value: "", label: "Todos los motivos" };
const RESPONSABLE_EMPTY_OPTION = { value: "", label: "Todos los responsables" };

/** Filtros de visitas con búsqueda rápida y panel avanzado. */
export function VisitasFilters({ filters, onChange, onApply, onCreateVisit }: VisitasFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const update = useCallback(
    (key: keyof VisitasFilterState, value: string) => {
      onChange({ ...filters, [key]: value });
    },
    [filters, onChange],
  );

  const handleApply = useCallback(
    (nextFilters?: VisitasFilterState) => {
      void onApply(nextFilters);
    },
    [onApply],
  );

  return (
    <div className="overflow-visible rounded-md border bg-card p-3">
      <div className="flex items-center gap-2 pb-0.5">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(event) => update("search", event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              handleApply();
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
        {onCreateVisit ? (
          <Button type="button" onClick={onCreateVisit}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nueva visita
          </Button>
        ) : null}
      </div>

      {expanded ? (
        <div className="mt-3 grid grid-cols-1 items-end gap-2 overflow-visible pb-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[repeat(5,minmax(0,1fr))_minmax(0,1fr)_auto]">
          <label className="relative z-10 flex min-w-0 flex-col gap-1 pb-0.5 text-sm">
            <span className="text-muted-foreground">Visitante</span>
            <ServerSearchableSelect
              value={filters.visitante}
              onChange={(value) => update("visitante", value)}
              onLoadOptions={loadVisitPersonCandidateOptions}
              resolveSelectedOption={(value, signal) =>
                resolveCandidateOption(value, signal, { allowLegacyText: true })
              }
              placeholder="Todos los visitantes"
              searchPlaceholder="Buscar por nombre…"
              noResultsText="Sin resultados"
              loadingText="Buscando…"
              emptyOption={VISITANTE_EMPTY_OPTION}
            />
          </label>

          {TEXT_FIELDS.map(({ key, label }) => (
            <label key={key} className="flex min-w-0 flex-col gap-1 pb-0.5 text-sm">
              <span className="text-muted-foreground">{label}</span>
              <Input
                value={filters[key]}
                onChange={(event) => update(key, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  handleApply();
                }}
              />
            </label>
          ))}

          <label className="relative z-10 flex min-w-0 flex-col gap-1 pb-0.5 text-sm">
            <span className="text-muted-foreground">Empresa</span>
            <ServerSearchableSelect
              value={filters.empresa}
              onChange={(value) => update("empresa", value)}
              onLoadOptions={loadProveedorSelectOptions}
              resolveSelectedOption={(value, signal) =>
                resolveProveedorSelectOption(value, signal, { allowLegacyText: true })
              }
              placeholder="Todas las empresas"
              searchPlaceholder="Buscar empresa…"
              noResultsText="Sin resultados"
              loadingText="Buscando…"
              emptyOption={EMPRESA_EMPTY_OPTION}
            />
          </label>

          <label className="relative z-10 flex min-w-0 flex-col gap-1 pb-0.5 text-sm">
            <span className="text-muted-foreground">Motivo</span>
            <ServerSearchableSelect
              value={filters.motivo}
              onChange={(value) => update("motivo", value)}
              onLoadOptions={loadMotivoVisitaSelectOptions}
              resolveSelectedOption={(value, signal) =>
                resolveMotivoVisitaSelectOption(value, signal, { allowLegacyText: true })
              }
              placeholder="Todos los motivos"
              searchPlaceholder="Buscar motivo…"
              noResultsText="Sin resultados"
              loadingText="Buscando…"
              emptyOption={MOTIVO_EMPTY_OPTION}
            />
          </label>

          <label className="relative z-10 flex min-w-0 flex-col gap-1 pb-0.5 text-sm">
            <span className="text-muted-foreground">Responsable</span>
            <ServerSearchableSelect
              value={filters.responsable}
              onChange={(value) => update("responsable", value)}
              onLoadOptions={loadResponsableCandidateOptions}
              resolveSelectedOption={(value, signal) =>
                resolveResponsableCandidateOption(value, signal, { allowLegacyText: true })
              }
              placeholder="Todos los responsables"
              searchPlaceholder="Buscar por nombre…"
              noResultsText="Sin resultados"
              loadingText="Buscando…"
              emptyOption={RESPONSABLE_EMPTY_OPTION}
            />
          </label>

          <label className="flex min-w-0 flex-col gap-1 pb-0.5 text-sm">
            <span className="text-muted-foreground">Estado</span>
            <Select value={filters.estado} onChange={(event) => update("estado", event.target.value)}>
              <option value="">Todos</option>
              <option value="programada">Programada</option>
              <option value="activa">Activa</option>
              <option value="sin_salida">Sin salida</option>
              <option value="finalizada">Finalizada</option>
              <option value="cancelada">Cancelada</option>
            </Select>
          </label>

          <Button type="button" className="mb-0.5 shrink-0 justify-self-start" onClick={() => handleApply()}>
            Aplicar filtros
          </Button>
        </div>
      ) : null}
    </div>
  );
}
