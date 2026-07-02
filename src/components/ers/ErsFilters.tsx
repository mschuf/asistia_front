/**
 * @file ErsFilters.tsx
 * @description Filtro general + búsqueda avanzada para listado de ERS.
 */
import { useCallback, useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { listarSolicitantesErs, listarTecnicosPorSede } from "@/api/ers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ServerSearchableSelect } from "@/components/ui/server-searchable-select";
import { SearchableSelect, type SearchableSelectOption } from "@/components/ui/searchable-select";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { buildLocationFilterOptions, buildRequesterDisplayLabel } from "@/lib/tickets";
import type { ErsLocation, ErsProjectState } from "@/api/ers";
import type { ErsFilterState } from "@/types/pages/ers-page.types";

interface ErsFiltersProps {
  filters: ErsFilterState;
  onChange: (next: ErsFilterState) => void;
  onApply: (next?: ErsFilterState) => void;
  states: ErsProjectState[];
  isTechnician: boolean;
  locations: ErsLocation[];
  locationsLoading?: boolean;
}

/** Panel de filtros del listado ERS. */
export function ErsFilters({
  filters,
  onChange,
  onApply,
  states,
  isTechnician,
  locations,
  locationsLoading = false,
}: ErsFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const locationOptions = useMemo(() => buildLocationFilterOptions(locations), [locations]);

  const update = useCallback(
    (key: keyof ErsFilterState, value: string) => {
      onChange({ ...filters, [key]: value } as ErsFilterState);
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

        return response.items.map((technician) => {
          const label = buildRequesterDisplayLabel(
            { fullName: technician.fullName, login: "", locationId: technician.locationId },
            locations,
          );
          return {
            value: technician.fullName,
            label,
            searchText: label.toLowerCase(),
          };
        });
      } catch {
        return [];
      }
    },
    [locations],
  );

  const resolveApproverOption = useCallback(
    async (value: string, signal: AbortSignal): Promise<SearchableSelectOption | null> => {
      const label = value.trim();
      if (!label) return null;
      try {
        const response = await listarTecnicosPorSede(
          { search: label, limit: 50 },
          { signal },
        );
        const technician = response.items.find((item) => item.fullName === label);
        const displayLabel = technician
          ? buildRequesterDisplayLabel(
              { fullName: technician.fullName, login: "", locationId: technician.locationId },
              locations,
            )
          : label;
        return { value: label, label: displayLabel, searchText: displayLabel.toLowerCase() };
      } catch {
        return { value: label, label, searchText: label.toLowerCase() };
      }
    },
    [locations],
  );

  const loadRequesterOptions = useCallback(
    async (query: string, signal: AbortSignal): Promise<SearchableSelectOption[]> => {
      try {
        const response = await listarSolicitantesErs(
          { search: query.trim() || undefined, limit: 50 },
          { signal },
        );
        return response.items.map((requester) => {
          const label = buildRequesterDisplayLabel(
            { fullName: requester.fullName, login: "", locationId: requester.locationId },
            locations,
          );
          return {
            value: String(requester.id),
            label,
            searchText: label.toLowerCase(),
          };
        });
      } catch {
        return [];
      }
    },
    [locations],
  );

  const resolveRequesterOption = useCallback(
    async (value: string, signal: AbortSignal): Promise<SearchableSelectOption | null> => {
      const response = await listarSolicitantesErs({ search: value, limit: 50 }, { signal });
      const requester = response.items.find((item) => String(item.id) === value);
      const label = requester
        ? buildRequesterDisplayLabel(
            { fullName: requester.fullName, login: "", locationId: requester.locationId },
            locations,
          )
        : "";
      return requester
        ? {
            value,
            label,
            searchText: label.toLowerCase(),
          }
        : null;
    },
    [locations],
  );

  const loadAssignedMemberOptions = useCallback(
    async (query: string, signal: AbortSignal): Promise<SearchableSelectOption[]> => {
      try {
        const response = await listarTecnicosPorSede(
          { search: query.trim() || undefined, limit: 50 },
          { signal },
        );
        return response.items.map((member) => {
          const label = buildRequesterDisplayLabel(
            { fullName: member.fullName, login: "", locationId: member.locationId },
            locations,
          );
          return { value: String(member.id), label, searchText: label.toLowerCase() };
        });
      } catch {
        return [];
      }
    },
    [locations],
  );

  const resolveAssignedMemberOption = useCallback(
    async (value: string, signal: AbortSignal): Promise<SearchableSelectOption | null> => {
      const response = await listarTecnicosPorSede({ search: value, limit: 50 }, { signal });
      const member = response.items.find((item) => String(item.id) === value);
      if (!member) return null;
      const label = buildRequesterDisplayLabel(
        { fullName: member.fullName, login: "", locationId: member.locationId },
        locations,
      );
      return { value, label, searchText: label.toLowerCase() };
    },
    [locations],
  );

  return (
    <div className="overflow-visible rounded-md border bg-card p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1 pb-0.5">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.search}
            onChange={(event) => update("search", event.target.value)}
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
        <div className="flex justify-end pb-0.5">
          <Button type="button" className="w-full sm:w-28" onClick={() => onApply()}>
            Buscar
          </Button>
        </div>
      </div>

      {expanded ? (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(12rem,1.6fr)_repeat(4,minmax(7rem,1fr))]">
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
                <ServerSearchableSelect
                  id="ers-filter-requester"
                  value={filters.requesterId}
                  onChange={(value) => update("requesterId", value)}
                  onLoadOptions={loadRequesterOptions}
                  resolveSelectedOption={resolveRequesterOption}
                  placeholder="Todos los solicitantes"
                  searchPlaceholder="Buscar solicitante..."
                  emptyOption={{ value: "", label: "Todos los solicitantes" }}
                  noResultsText="Sin solicitantes para mostrar"
                  loadingText="Buscando solicitantes..."
                />
              </label>
              <label className="flex min-w-0 flex-col gap-1 pb-0.5 text-sm">
                <span className="text-muted-foreground">Sede</span>
                <SearchableSelect
                  id="ers-filter-location"
                  value={filters.locationId}
                  onChange={(value) => update("locationId", value)}
                  options={locationOptions}
                  placeholder={locationsLoading ? "Cargando sedes..." : "Todas las sedes"}
                  searchPlaceholder="Buscar sede..."
                  emptyOption={{ value: "", label: "Todas las sedes" }}
                  disabled={locationsLoading}
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
              searchPlaceholder="Buscar TI..."
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
          <div className="grid grid-cols-1 gap-2 sm:col-span-2 sm:grid-cols-2 lg:col-span-5 lg:flex lg:items-end">
          <label className="flex min-w-0 flex-col gap-1 pb-0.5 text-sm lg:w-56 lg:shrink-0">
            <span className="text-muted-foreground">Ciclo de vida</span>
            <Select
              value={filters.lifecycle}
              onChange={(event) => update("lifecycle", event.target.value)}
            >
              <option value="">Todos</option>
              <option value="active">Activos</option>
              <option value="finished">Finalizados</option>
            </Select>
          </label>
          <label className="flex min-w-0 flex-col gap-1 pb-0.5 text-sm lg:w-[9rem] lg:shrink-0">
            <span className="text-muted-foreground">Desde</span>
            <Input
              type="date"
              value={filters.createdFrom}
              max={filters.createdTo || undefined}
              onChange={(event) => update("createdFrom", event.target.value)}
            />
          </label>
          <label className="flex min-w-0 flex-col gap-1 pb-0.5 text-sm lg:w-[9rem] lg:shrink-0">
            <span className="text-muted-foreground">Hasta</span>
            <Input
              type="date"
              value={filters.createdTo}
              min={filters.createdFrom || undefined}
              onChange={(event) => update("createdTo", event.target.value)}
            />
          </label>
          {isTechnician ? (
            <label className="flex min-w-0 flex-col gap-1 pb-0.5 text-sm lg:w-56 lg:shrink-0">
              <span className="text-muted-foreground">Integrante asignado</span>
              <ServerSearchableSelect
                id="ers-filter-assigned-member"
                value={filters.assignedMemberId}
                onChange={(value) => update("assignedMemberId", value)}
                onLoadOptions={loadAssignedMemberOptions}
                resolveSelectedOption={resolveAssignedMemberOption}
                placeholder="Todos los integrantes"
                searchPlaceholder="Buscar integrante..."
                emptyOption={{ value: "", label: "Todos los integrantes" }}
                noResultsText="Sin integrantes para mostrar"
                loadingText="Buscando integrantes..."
              />
            </label>
          ) : null}
          </div>
        </div>
      ) : null}

    </div>
  );
}
