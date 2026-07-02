/**
 * @file TicketFilters.tsx
 * @description Barra de búsqueda y filtros avanzados del historial de tickets.
 */
import { useCallback, useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { SearchableSelectOption } from "@/components/ui/searchable-select";
import { ServerSearchableSelect } from "@/components/ui/server-searchable-select";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TICKET_STATUS_LABELS, TICKET_TYPE_LABELS } from "@/lib/constants";
import {
  ASISTIA_UNASSIGNED_TECHNICIAN_ID,
  buildLocationFilterOptions,
  buildRequesterDisplayLabel,
  buildTechnicianFilterOptions,
  findLocationById,
  locationDisplayName,
  TICKET_STATUS_FILTER_ALL,
  TICKETS_HISTORIAL_FILTERS_SCROLL_CLASS,
  TICKETS_HISTORIAL_FILTERS_WIDE_CLASS,
} from "@/lib/tickets";
import { getUserById, searchUsers } from "@/services/ticketsService";
import type { AsistiaLocation, AsistiaUser } from "@/types/asistia";
import type { AuthUser } from "@/types/auth";
import type { TicketFilterState } from "@/types/pages/tickets-page.types";

const ADVANCED_FILTER_GRID_TECHNICIAN =
  "min-[1120px]:grid-cols-[minmax(8.75rem,1.05fr)_minmax(8.75rem,1.05fr)_minmax(7rem,0.85fr)_minmax(7rem,0.9fr)_minmax(9rem,1.1fr)_minmax(9rem,1.1fr)_minmax(9rem,1.1fr)_auto]";

const ADVANCED_FILTER_GRID_USER =
  "min-[1120px]:grid-cols-[minmax(8.75rem,1.05fr)_minmax(8.75rem,1.05fr)_minmax(7rem,0.85fr)_minmax(7rem,0.9fr)_minmax(9rem,1.15fr)_auto]";

const REQUESTER_EMPTY_OPTION = { value: "", label: "Todos los solicitantes" };

interface TicketFiltersProps {
  filters: TicketFilterState;
  onChange: (filters: TicketFilterState) => void;
  onApply: (filters?: TicketFilterState) => void;
  locations: AsistiaLocation[];
  technicians: AsistiaUser[];
  user: AuthUser | null;
  locationsLoading?: boolean;
  techniciansLoading?: boolean;
}

/**
 * Filtros de historial con búsqueda rápida y panel expandible.
 * @param props - Estado de filtros, catálogos y callbacks apply/change.
 * @returns Panel de filtros colapsable.
 */
export function TicketFilters({
  filters,
  onChange,
  onApply,
  locations,
  technicians,
  user,
  locationsLoading = false,
  techniciansLoading = false,
}: TicketFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const isTechnician = user?.role === "technician" || user?.isSuperAdmin === true;

  /**
   * Actualiza un campo del filtro preservando el resto del estado.
   * @param key - Clave del filtro.
   * @param value - Nuevo valor.
   * @returns void
   */
  const update = useCallback(
    (key: keyof TicketFilterState, value: string) => {
      const { statusesPreset: _, ...rest } = filters;
      onChange({ ...rest, [key]: value });
    },
    [filters, onChange]
  );

  /** Actualiza filtros de actor (técnico/solicitante) y desactiva involvingMe. */
  const updateActorFilter = useCallback(
    (key: "assignedToId" | "requesterId", value: string) => {
      const { statusesPreset: _, ...rest } = filters;
      onChange({ ...rest, [key]: value, involvingMe: false });
    },
    [filters, onChange],
  );

  const locationOptions = useMemo(() => buildLocationFilterOptions(locations), [locations]);
  const visibleTechnicians = useMemo(() => {
    if (isTechnician || user?.locationId == null) return technicians;
    return technicians.filter((technician) => technician.locationId === user.locationId);
  }, [technicians, isTechnician, user]);
  const technicianOptions = useMemo(() => {
    const options = buildTechnicianFilterOptions(visibleTechnicians, user, locations);
    const unassignedId = String(ASISTIA_UNASSIGNED_TECHNICIAN_ID);
    if (
      filters.assignedToId !== unassignedId ||
      options.some((option) => option.value === unassignedId)
    ) {
      return options;
    }
    return [
      { value: unassignedId, label: "Sin asignar", searchText: "sin asignar asistia" },
      ...options,
    ];
  }, [filters.assignedToId, visibleTechnicians, user, locations]);

  /** @param query - Texto de búsqueda. @param signal - Señal de aborto. @returns Opciones de solicitante. */
  const loadRequesterOptions = useCallback(
    async (query: string, signal: AbortSignal) => {
      const result = await searchUsers(query, undefined, { signal });
      return result.items.map((requester): SearchableSelectOption => {
        const location = findLocationById(locations, requester.locationId);
        const locationName = location ? locationDisplayName(location) : "";
        return {
          value: String(requester.id),
          label: buildRequesterDisplayLabel(requester, locations),
          searchText:
            `${requester.fullName} ${requester.login} ${requester.email ?? ""} ${locationName}`.toLowerCase(),
        };
      });
    },
    [locations],
  );

  /** @param value - ID del solicitante. @param signal - Señal de aborto. @returns Opción resuelta. */
  const resolveRequesterOption = useCallback(
    async (value: string, signal: AbortSignal) => {
      const requester = await getUserById(Number(value), { signal });
      const location = findLocationById(locations, requester.locationId);
      const locationName = location ? locationDisplayName(location) : "";
      return {
        value: String(requester.id),
        label: buildRequesterDisplayLabel(requester, locations),
        searchText: `${requester.fullName} ${requester.login} ${locationName}`.toLowerCase(),
      };
    },
    [locations],
  );

  return (
    <div className="w-full min-w-0 overflow-visible rounded-md border bg-card p-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(event) => update("search", event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            onApply();
          }}
          placeholder="Buscar servicio por ID, descripción, título. Para más opciones, usa los filtros avanzados."
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

      <div
        aria-hidden={!expanded}
        {...(!expanded ? { inert: true } : {})}
        className={cn(
          !expanded && "pointer-events-none max-h-0 overflow-hidden opacity-0",
          expanded && cn("mt-3", TICKETS_HISTORIAL_FILTERS_SCROLL_CLASS),
        )}
      >
        <div
          className={cn(
            "grid grid-cols-1 items-end gap-2 sm:grid-cols-2",
            isTechnician ? ADVANCED_FILTER_GRID_TECHNICIAN : ADVANCED_FILTER_GRID_USER,
            TICKETS_HISTORIAL_FILTERS_WIDE_CLASS,
          )}
        >
          <label className="flex min-w-0 flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Desde</span>
            <Input
              type="date"
              value={filters.createdFrom}
              onChange={(event) => update("createdFrom", event.target.value)}
            />
          </label>
          <label className="flex min-w-0 flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Hasta</span>
            <Input
              type="date"
              value={filters.createdTo}
              onChange={(event) => update("createdTo", event.target.value)}
            />
          </label>
          <label className="flex min-w-0 flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Estado</span>
            <Select
              value={filters.status}
              onChange={(event) => update("status", event.target.value)}
            >
              <option value="">Abiertos</option>
              <option value={TICKET_STATUS_FILTER_ALL}>Todos</option>
              {Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex min-w-0 flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Tipo</span>
            <Select
              value={filters.type}
              onChange={(event) => update("type", event.target.value)}
            >
              <option value="">Todos los tipos</option>
              {Object.entries(TICKET_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </label>

          <label className="relative z-10 flex min-w-0 flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Técnico</span>
            <SearchableSelect
              id="ticket-filter-assigned"
              value={filters.assignedToId}
              onChange={(value) => updateActorFilter("assignedToId", value)}
              options={technicianOptions}
              placeholder={techniciansLoading ? "Cargando técnicos..." : "Todos los técnicos"}
              searchPlaceholder="Buscar técnico..."
              emptyOption={{ value: "", label: "Todos los técnicos" }}
              disabled={techniciansLoading}
            />
          </label>

          {isTechnician ? (
            <label className="relative z-10 flex min-w-0 flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Solicitante</span>
              <ServerSearchableSelect
                id="ticket-filter-requester"
                value={filters.requesterId}
                onChange={(value) => updateActorFilter("requesterId", value)}
                onLoadOptions={loadRequesterOptions}
                resolveSelectedOption={resolveRequesterOption}
                placeholder="Todos los solicitantes"
                searchPlaceholder="Buscar usuario..."
                emptyOption={REQUESTER_EMPTY_OPTION}
              />
            </label>
          ) : null}

          {isTechnician ? (
            <label className="relative z-10 flex min-w-0 flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Sede</span>
              <SearchableSelect
                id="ticket-filter-location"
                value={filters.locationId}
                onChange={(value) => update("locationId", value)}
                options={locationOptions}
                placeholder={locationsLoading ? "Cargando sedes..." : "Todas las sedes"}
                searchPlaceholder="Buscar sede..."
                emptyOption={{ value: "", label: "Todas las sedes" }}
                disabled={locationsLoading}
              />
            </label>
          ) : null}

          <Button
            type="button"
            size="sm"
            className="w-fit shrink-0 gap-1 px-2"
            onClick={() => onApply(filters)}
          >
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
            Buscar
          </Button>
        </div>
      </div>
    </div>
  );
}
