import { useCallback, useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TICKET_STATUS_LABELS, TICKET_TYPE_LABELS } from "@/lib/constants";
import { buildLocationOptions, buildTechnicianFilterOptions } from "@/lib/tickets";
import type { AsistiaLocation, AsistiaUser } from "@/types/asistia";
import type { AuthUser } from "@/types/auth";
import type { TicketFilterState } from "@/types/pages/tickets-page.types";

interface TicketFiltersProps {
  filters: TicketFilterState;
  onChange: (filters: TicketFilterState) => void;
  locations: AsistiaLocation[];
  technicians: AsistiaUser[];
  user: AuthUser | null;
  locationsLoading?: boolean;
  techniciansLoading?: boolean;
}

export function TicketFilters({
  filters,
  onChange,
  locations,
  technicians,
  user,
  locationsLoading = false,
  techniciansLoading = false,
}: TicketFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const update = useCallback(
    (key: keyof TicketFilterState, value: string) => {
      onChange({ ...filters, [key]: value });
    },
    [filters, onChange]
  );

  const locationOptions = useMemo(() => buildLocationOptions(locations), [locations]);
  const technicianOptions = useMemo(
    () => buildTechnicianFilterOptions(technicians, user),
    [technicians, user]
  );

  return (
    <div className="rounded-md border bg-card p-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(event) => update("search", event.target.value)}
          placeholder="Buscar en tickets"
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
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select value={filters.status} onChange={(event) => update("status", event.target.value)}>
            <option value="">En curso (asignada y planificada)</option>
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
            onChange={(value) => update("assignedToId", value)}
            options={technicianOptions}
            placeholder={techniciansLoading ? "Cargando técnicos..." : "Asignado a"}
            searchPlaceholder="Buscar técnico..."
            emptyOption={{ value: "", label: "Todos los técnicos" }}
            disabled={techniciansLoading}
          />

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
        </div>
      ) : null}
    </div>
  );
}
