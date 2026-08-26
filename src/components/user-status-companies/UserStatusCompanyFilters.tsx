import { ChevronDown, Search } from "lucide-react";
import { useState } from "react";
import type { UserStatusCompanyFilters as Filters } from "@/api/userStatusCompanies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onApply: () => void;
  disabled?: boolean;
}

/** Filtro general y búsqueda avanzada aplicados únicamente al pulsar Buscar. */
export function UserStatusCompanyFilters({ filters, onChange, onApply, disabled }: Props) {
  const [advanced, setAdvanced] = useState(false);
  const update = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="rounded-md border bg-card p-4 shadow-soft">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          value={filters.search}
          onChange={(event) => update("search", event.target.value)}
          placeholder="Buscar en todos los campos..."
          className="pl-9 pr-10"
          aria-label="Búsqueda general de empresas"
        />
        <button
          type="button"
          onClick={() => setAdvanced((current) => !current)}
          className="absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-expanded={advanced}
          aria-label={advanced ? "Ocultar búsqueda avanzada" : "Mostrar búsqueda avanzada"}
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", advanced && "rotate-180")} aria-hidden="true" />
        </button>
      </div>

      {advanced ? (
        <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Nombre</span>
            <Input value={filters.name} onChange={(event) => update("name", event.target.value)} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Estado</span>
            <Select value={filters.active} onChange={(event) => update("active", event.target.value as Filters["active"])}>
              <option value="">Todos</option>
              <option value="true">Activas</option>
              <option value="false">Inactivas</option>
            </Select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Usuarios asociados</span>
            <Input type="number" min={0} value={filters.userCount} onChange={(event) => update("userCount", event.target.value)} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Actualizada desde</span>
            <Input type="datetime-local" value={filters.updatedFrom} onChange={(event) => update("updatedFrom", event.target.value)} />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Actualizada hasta</span>
            <Input type="datetime-local" value={filters.updatedTo} onChange={(event) => update("updatedTo", event.target.value)} />
          </label>
        </div>
      ) : null}

      <div className="mt-4 flex justify-end">
        <Button type="button" size="sm" className="gap-2" onClick={onApply} disabled={disabled}>
          <Search className="h-4 w-4" aria-hidden="true" />
          Buscar
        </Button>
      </div>
    </div>
  );
}
