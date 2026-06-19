/**
 * @file PorteriaHistoryFilters.tsx
 * @description Barra de busqueda y filtros avanzados del historial de porteria.
 */
import { useCallback, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ServerSearchableSelect } from "@/components/ui/server-searchable-select";
import { cn } from "@/lib/utils";
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
import type { PorteriaHistoryFilterState } from "@/types/pages/porteria-page.types";

interface PorteriaHistoryFiltersProps {
  filters: PorteriaHistoryFilterState;
  onChange: (filters: PorteriaHistoryFilterState) => void;
  onApply: (filters?: PorteriaHistoryFilterState) => Promise<void>;
}

const VISITANTE_EMPTY_OPTION = { value: "", label: "Todos los visitantes" };
const EMPRESA_EMPTY_OPTION = { value: "", label: "Todas las empresas" };
const MOTIVO_EMPTY_OPTION = { value: "", label: "Todos los motivos" };
const RESPONSABLE_EMPTY_OPTION = { value: "", label: "Todos los responsables" };

/**
 * Filtros de historial con busqueda rapida y panel avanzado desplegable.
 * @param props - Estado de filtros y callbacks apply/change.
 * @returns Panel de filtros colapsable.
 */
export function PorteriaHistoryFilters({
  filters,
  onChange,
  onApply,
}: PorteriaHistoryFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const update = useCallback(
    (key: keyof PorteriaHistoryFilterState, value: string) => {
      onChange({ ...filters, [key]: value });
    },
    [filters, onChange],
  );

  const handleApply = useCallback(
    (nextFilters?: PorteriaHistoryFilterState) => {
      void onApply(nextFilters);
    },
    [onApply],
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
            handleApply();
          }}
          placeholder="Buscar visita por visitante, documento, empresa... Para mas opciones, usa los filtros avanzados."
          className="pl-9 pr-10"
        />
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          aria-label={expanded ? "Ocultar filtros avanzados" : "Mostrar filtros avanzados"}
          title={expanded ? "Ocultar filtros" : "Mostrar filtros"}
          className="absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronDown
            className={cn("h-4 w-4 transition-transform duration-200", expanded && "rotate-180")}
            aria-hidden="true"
          />
        </button>
      </div>

      {expanded ? (
        <div className="mt-3 grid grid-cols-1 items-end gap-2 overflow-visible pb-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[auto_repeat(4,minmax(0,1fr))_minmax(0,1.2fr)_auto]">
          <div className="col-span-full grid w-full grid-cols-2 gap-2 sm:col-span-2 sm:flex sm:w-auto sm:shrink-0 sm:flex-wrap xl:col-span-1">
            <label className="flex min-w-0 flex-col gap-1 pb-0.5 text-sm sm:w-[8.75rem] sm:shrink-0">
              <span className="text-muted-foreground">Desde</span>
              <Input
                type="date"
                value={filters.entradaFrom}
                onChange={(event) => update("entradaFrom", event.target.value)}
                className="date-input-mobile-picker-end w-full px-2"
              />
            </label>
            <label className="flex min-w-0 flex-col gap-1 pb-0.5 text-sm sm:w-[8.75rem] sm:shrink-0">
              <span className="text-muted-foreground">Hasta</span>
              <Input
                type="date"
                value={filters.entradaTo}
                onChange={(event) => update("entradaTo", event.target.value)}
                className="date-input-mobile-picker-end w-full px-2"
              />
            </label>
          </div>

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

          <label className="flex min-w-0 flex-col gap-1 pb-0.5 text-sm">
            <span className="text-muted-foreground">Documento</span>
            <Input
              value={filters.documento}
              onChange={(event) => update("documento", event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                handleApply();
              }}
            />
          </label>

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
              searchPlaceholder="Buscar usuario GLPI…"
              noResultsText="Sin resultados"
              loadingText="Buscando…"
              emptyOption={RESPONSABLE_EMPTY_OPTION}
            />
          </label>

          <div className="flex w-fit flex-col items-center justify-end gap-1 justify-self-center pb-0.5">
            <span className="pointer-events-none invisible text-sm leading-none" aria-hidden="true">
              &nbsp;
            </span>
            <Button
              type="button"
              size="sm"
              className="w-fit shrink-0 gap-1 px-2"
              onClick={() => handleApply(filters)}
            >
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
              Buscar
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
