import { useCallback, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TICKET_STATUS_LABELS, TICKET_TYPE_LABELS } from "@/lib/constants";
import type { TicketFilterState } from "@/types/pages/tickets-page.types";

interface TicketFiltersProps {
  filters: TicketFilterState;
  onChange: (filters: TicketFilterState) => void;
}

export function TicketFilters({ filters, onChange }: TicketFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const update = useCallback(
    (key: keyof TicketFilterState, value: string) => {
      onChange({ ...filters, [key]: value });
    },
    [filters, onChange]
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
            <option value="">Todos los estados</option>
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
        </div>
      ) : null}
    </div>
  );
}
