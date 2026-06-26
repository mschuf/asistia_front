/**
 * @file ErsFilters.tsx
 * @description Filtro general + búsqueda avanzada para listado de ERS.
 */
import { useCallback, useState, type KeyboardEvent } from "react";
import { ChevronDown, Search } from "lucide-react";
import { listarTecnicosPorSede } from "@/api/ers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ServerSearchableSelect } from "@/components/ui/server-searchable-select";
import type { SearchableSelectOption } from "@/components/ui/searchable-select";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ErsProjectState } from "@/api/ers";
import type { ErsFilterState } from "@/types/pages/ers-page.types";

interface ErsFiltersProps {
  filters: ErsFilterState;
  onChange: (next: ErsFilterState) => void;
  onApply: (next?: ErsFilterState) => void;
  states: ErsProjectState[];
  isTechnician: boolean;
}

/** Panel de filtros del listado ERS. */
export function ErsFilters({ filters, onChange, onApply, states, isTechnician }: ErsFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const update = useCallback(
    (key: keyof ErsFilterState, value: string) => {
      onChange({ ...filters, [key]: value });
    },
    [filters, onChange],
  );

  const loadApproverOptions = useCallback(
    async (query: string, signal: AbortSignal): Promise<SearchableSelectOption[]> => {
      try {
        const response = await listarTecnicosPorSede(
          {
            search: query.trim() || undefined,
            limit: 50,
          },
          { signal },
        );

        return response.items.map((technician) => ({
          value: technician.fullName,
          label: technician.fullName,
          searchText: technician.fullName.toLowerCase(),
        }));
      } catch {
        return [];
      }
    },
    [],
  );

  const resolveApproverOption = useCallback(
    async (value: string, _signal: AbortSignal): Promise<SearchableSelectOption | null> => {
      const label = value.trim();
      if (!label) return null;
      return {
        value: label,
        label,
        searchText: label.toLowerCase(),
      };
    },
    [],
  );

  const handleGeneralSearchEnter = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      onApply({ ...filters, search: event.currentTarget.value });
    },
    [filters, onApply],
  );

  return (
    <div className="overflow-visible rounded-md border bg-card p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1 pb-0.5">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(event) => update("search", event.target.value)}
            onKeyDown={handleGeneralSearchEnter}
            placeholder="Buscar por ID, nombre, caso, estado, avance, aprobado por o creado..."
            className="pl-9 pr-10"
          />
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            aria-expanded={expanded}
            aria-label={expanded ? "Ocultar búsqueda avanzada" : "Mostrar búsqueda avanzada"}
            className="absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronDown
              className={cn("h-4 w-4 transition-transform duration-200", expanded && "rotate-180")}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <label className="flex min-w-0 flex-col gap-1 pb-0.5 text-sm">
            <span className="text-muted-foreground">Nombre proyecto</span>
            <Input
              value={filters.projectName}
              onChange={(event) => update("projectName", event.target.value)}
            />
          </label>
          {isTechnician ? (
            <>
              <label className="flex min-w-0 flex-col gap-1 pb-0.5 text-sm">
                <span className="text-muted-foreground">Solicitante</span>
                <Input
                  value={filters.requesterName}
                  onChange={(event) => update("requesterName", event.target.value)}
                />
              </label>
              <label className="flex min-w-0 flex-col gap-1 pb-0.5 text-sm">
                <span className="text-muted-foreground">Sede</span>
                <Input
                  value={filters.locationName}
                  onChange={(event) => update("locationName", event.target.value)}
                />
              </label>
            </>
          ) : null}
          <label className="flex min-w-0 flex-col gap-1 pb-0.5 text-sm">
            <span className="text-muted-foreground">Aprobado por</span>
            <ServerSearchableSelect
              value={filters.approverName}
              onChange={(value) => update("approverName", value)}
              onLoadOptions={loadApproverOptions}
              resolveSelectedOption={resolveApproverOption}
              placeholder="Todos"
              searchPlaceholder="Buscar TI de GLPI..."
              emptyOption={{ value: "", label: "Todos", searchText: "todos" }}
              noResultsText="Sin TI para mostrar"
              loadingText="Buscando TI..."
            />
          </label>
          <label className="flex min-w-0 flex-col gap-1 pb-0.5 text-sm">
            <span className="text-muted-foreground">Estado</span>
            <Select
              value={filters.projectStateId}
              onChange={(event) => update("projectStateId", event.target.value)}
            >
              <option value="">Todos</option>
              {states.map((state) => (
                <option key={state.id} value={String(state.id)}>
                  {state.name}
                </option>
              ))}
            </Select>
          </label>
          <div className="flex items-end">
            <Button type="button" className="w-full" onClick={() => onApply()}>
              Buscar
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

