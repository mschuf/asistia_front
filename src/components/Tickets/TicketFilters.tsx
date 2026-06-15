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
  buildLocationFilterOptions,
  buildRequesterDisplayLabel,
  buildTechnicianFilterOptions,
  findLocationById,
  locationDisplayName,
} from "@/lib/tickets";
import { getUserById, searchUsers } from "@/services/ticketsService";
import type { AsistiaLocation, AsistiaUser } from "@/types/asistia";
import type { AuthUser } from "@/types/auth";
import type { TicketFilterState } from "@/types/pages/tickets-page.types";

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
  const isTechnician = user?.role === "technician";

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
  const technicianOptions = useMemo(
    () => buildTechnicianFilterOptions(technicians, user, locations),
    [technicians, user, locations]
  );

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
    <div className="rounded-md border bg-card p-3">
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
          placeholder="Buscar ticket por ID, descripción, título. Para más opciones, usa los filtros avanzados."
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
        <div className="mt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Desde</span>
              <Input
                type="date"
                value={filters.createdFrom}
                onChange={(event) => update("createdFrom", event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-muted-foreground">Hasta</span>
              <Input
                type="date"
                value={filters.createdTo}
                onChange={(event) => update("createdTo", event.target.value)}
              />
            </label>
          </div>

          <div
            className={cn(
              "grid gap-3 sm:grid-cols-2",
              isTechnician
                ? "lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
                : "lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]",
            )}
          >
          <Select value={filters.status} onChange={(event) => update("status", event.target.value)}>
            <option value="">Abiertos</option>
            {Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>

          <Select value={filters.type} onChange={(event) => update("type", event.target.value)}>
            <option value="">Todos los tipos</option>
            {Object.entries(TICKET_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>

          <SearchableSelect
            id="ticket-filter-assigned"
            value={filters.assignedToId}
            onChange={(value) => updateActorFilter("assignedToId", value)}
            options={technicianOptions}
            placeholder={techniciansLoading ? "Cargando técnicos..." : "Asignado a"}
            searchPlaceholder="Buscar técnico..."
            emptyOption={{ value: "", label: "Todos los técnicos" }}
            disabled={techniciansLoading}
          />

          {isTechnician ? (
            <ServerSearchableSelect
              id="ticket-filter-requester"
              value={filters.requesterId}
              onChange={(value) => updateActorFilter("requesterId", value)}
              onLoadOptions={loadRequesterOptions}
              resolveSelectedOption={resolveRequesterOption}
              placeholder="Solicitante"
              searchPlaceholder="Buscar usuario..."
              emptyOption={REQUESTER_EMPTY_OPTION}
            />
          ) : null}

          <SearchableSelect
            id="ticket-filter-location"
            value={filters.locationId}
            onChange={(value) => update("locationId", value)}
            options={locationOptions}
            placeholder={locationsLoading ? "Cargando sedes..." : "Sede"}
            searchPlaceholder="Buscar sede..."
            emptyOption={{ value: "", label: "Todas las sedes" }}
            disabled={locationsLoading}
          />

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
      ) : null}
    </div>
  );
}
