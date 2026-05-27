import type { TicketFilterState } from "../../types/pages/tickets-page.types";
import type { AsistiaTicketStatus } from "../../types/asistia";

interface TicketFiltersProps {
  filters: TicketFilterState;
  onChange: (filters: TicketFilterState) => void;
}

const STATUS_OPTIONS: Array<{ value: AsistiaTicketStatus | ""; label: string }> = [
  { value: "", label: "Todos los estados" },
  { value: "new", label: "Nuevo" },
  { value: "assigned", label: "Asignado" },
  { value: "planned", label: "Planificado" },
  { value: "waiting", label: "En espera" },
  { value: "solved", label: "Resuelto" },
  { value: "closed", label: "Cerrado" }
];

export default function TicketFilters({ filters, onChange }: TicketFiltersProps) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <input
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        placeholder="Buscar por título, #, solicitante..."
        value={filters.search}
        onChange={(event) => onChange({ ...filters, search: event.target.value })}
      />
      <select
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        value={filters.status}
        onChange={(event) =>
          onChange({ ...filters, status: event.target.value as TicketFilterState["status"] })
        }
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value || "all"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        value={filters.type}
        onChange={(event) =>
          onChange({ ...filters, type: event.target.value as TicketFilterState["type"] })
        }
      >
        <option value="">Todos los tipos</option>
        <option value="incident">Incidente</option>
        <option value="request">Solicitud</option>
      </select>
    </div>
  );
}
