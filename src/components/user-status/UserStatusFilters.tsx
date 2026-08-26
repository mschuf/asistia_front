import { ChevronDown, Search } from "lucide-react";
import { useCallback, useState } from "react";
import { USER_STATUS_CODES, USER_STATUS_SOURCES, type UserStatusFilters as Filters } from "@/api/userStatus";
import { getUserStatusCompany, listUserStatusCompanies } from "@/api/userStatusCompanies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ServerSearchableSelect } from "@/components/ui/server-searchable-select";
import type { SearchableSelectOption } from "@/components/ui/searchable-select";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const STATUS_LABELS = {
  ACTIVO: "Activo", INACTIVO: "Inactivo", BLOQUEADO: "Bloqueado", EXPIRADO: "Expirado",
  NO_ENCONTRADO: "No encontrado", ERROR: "Error", DESCONOCIDO: "Desconocido",
} as const;

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
  onApply: () => void;
  disabled?: boolean;
}

export function UserStatusFilters({ filters, onChange, onApply, disabled }: Props) {
  const [advanced, setAdvanced] = useState(false);
  const update = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    onChange({ ...filters, [key]: value });
  const loadCompanies = useCallback(
    async (query: string, signal: AbortSignal): Promise<SearchableSelectOption[]> => {
      const result = await listUserStatusCompanies({ page: 1, limit: 50, search: query, signal });
      return result.items.map((company) => ({
        value: company.id,
        label: `${company.name}${company.active ? "" : " (inactiva)"}`,
        searchText: company.name,
      }));
    },
    [],
  );
  const resolveCompany = useCallback(
    async (id: string, signal: AbortSignal): Promise<SearchableSelectOption | null> => {
      const company = await getUserStatusCompany(id, signal);
      return {
        value: company.id,
        label: `${company.name}${company.active ? "" : " (inactiva)"}`,
        searchText: company.name,
      };
    },
    [],
  );

  return (
    <div className="rounded-md border bg-card p-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={filters.search}
            onChange={(event) => update("search", event.target.value)}
            placeholder="Buscar por nombre o cualquier identificador..."
            className="pl-9 pr-10"
            aria-label="Búsqueda general"
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
        <Button type="button" className="gap-2 sm:w-auto" onClick={onApply} disabled={disabled}>
          <Search className="h-4 w-4" aria-hidden="true" />
          Buscar
        </Button>
      </div>

      {advanced ? (
        <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2 xl:grid-cols-4">
          <FilterInput label="Usuario" value={filters.name} onChange={(value) => update("name", value)} />
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Empresa</span>
            <ServerSearchableSelect
              value={filters.companyId}
              onChange={(value) => update("companyId", value)}
              onLoadOptions={loadCompanies}
              resolveSelectedOption={resolveCompany}
              emptyOption={{ value: "", label: "Todas" }}
              placeholder="Todas"
              searchPlaceholder="Buscar empresa..."
              loadingText="Cargando empresas..."
              noResultsText="Sin empresas"
              disabled={disabled}
            />
          </label>
          <FilterInput label="AD" value={filters.ad} onChange={(value) => update("ad", value)} />
          <FilterInput label="SAP" value={filters.sap} onChange={(value) => update("sap", value)} />
          <FilterInput label="Office" value={filters.office} onChange={(value) => update("office", value)} />
          <FilterInput label="GLPI" value={filters.glpi} onChange={(value) => update("glpi", value)} />
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Fuente configurada</span>
            <Select value={filters.source} onChange={(event) => update("source", event.target.value as Filters["source"])}>
              <option value="">Todas</option>
              {USER_STATUS_SOURCES.map((source) => <option key={source} value={source}>{source}</option>)}
            </Select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Estado</span>
            <Select value={filters.status} onChange={(event) => update("status", event.target.value as Filters["status"])}>
              <option value="">Todos</option>
              {USER_STATUS_CODES.map((status) => <option key={status} value={status}>{STATUS_LABELS[status]}</option>)}
            </Select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Monitoreo</span>
            <Select value={filters.active} onChange={(event) => update("active", event.target.value as Filters["active"])}>
              <option value="">Todos</option>
              <option value="true">Activos</option>
              <option value="false">Desactivados</option>
            </Select>
          </label>
          <FilterInput type="datetime-local" label="Actualizado desde" value={filters.updatedFrom} onChange={(value) => update("updatedFrom", value)} />
          <FilterInput type="datetime-local" label="Actualizado hasta" value={filters.updatedTo} onChange={(value) => update("updatedTo", value)} />
        </div>
      ) : null}
    </div>
  );
}

function FilterInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="space-y-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
