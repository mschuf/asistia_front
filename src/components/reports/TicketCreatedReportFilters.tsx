/**
 * @file TicketCreatedReportFilters.tsx
 * @description Filtros del reporte superadmin de tickets creados por correo.
 */
import { useCallback, useMemo } from "react";
import { Search } from "lucide-react";
import type { Empresa } from "@/api/empresas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { AsistiaCategory, AsistiaLocation } from "@/types/asistia";
import type { TicketCreatedReportFilterState } from "@/types/pages/ticket-created-report.types";

interface TicketCreatedReportFiltersProps {
  filters: TicketCreatedReportFilterState;
  onChange: (filters: TicketCreatedReportFilterState) => void;
  onApply: (filters?: TicketCreatedReportFilterState) => void;
  categories: AsistiaCategory[];
  empresas: Empresa[];
  locations: AsistiaLocation[];
  catalogsLoading?: boolean;
}

/** @param categories - Catálogo GLPI. @returns Opciones con valor de texto para category_name. */
function buildCategoryNameFilterOptions(categories: AsistiaCategory[]) {
  const seen = new Set<string>();
  const options: Array<{ value: string; label: string; searchText: string }> = [];

  for (const category of categories) {
    const value = (category.fullPath || category.name).trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    options.push({
      value,
      label: value,
      searchText: `${category.name} ${category.fullPath}`.toLowerCase(),
    });
  }

  return options.sort((left, right) => left.label.localeCompare(right.label, "es"));
}

/** @param empresas - Catálogo de empresas Postgres. @returns Opciones por ID. */
function buildCompanyFilterOptions(empresas: Empresa[]) {
  return empresas
    .map((empresa) => ({
      value: String(empresa.id),
      label: empresa.name,
      searchText: empresa.name.toLowerCase(),
    }))
    .sort((left, right) => left.label.localeCompare(right.label, "es"));
}

/** @param locations - Catálogo de sedes GLPI. @returns Opciones por ID. */
function buildLocationFilterOptions(locations: AsistiaLocation[]) {
  return locations
    .map((location) => {
      const label = (location.fullPath || location.name).trim();
      return {
        value: String(location.id),
        label,
        searchText: `${location.name} ${location.fullPath}`.toLowerCase(),
      };
    })
    .sort((left, right) => left.label.localeCompare(right.label, "es"));
}

/**
 * Filtros de fechas, categoría, empresa y sede del reporte ticket.created.
 * @param props - Estado de filtros, catálogos y callbacks apply/change.
 * @returns Panel de filtros del reporte.
 */
export function TicketCreatedReportFilters({
  filters,
  onChange,
  onApply,
  categories,
  empresas,
  locations,
  catalogsLoading = false,
}: TicketCreatedReportFiltersProps) {
  const update = useCallback(
    (key: keyof TicketCreatedReportFilterState, value: string) => {
      onChange({ ...filters, [key]: value });
    },
    [filters, onChange],
  );

  const categoryOptions = useMemo(
    () => buildCategoryNameFilterOptions(categories),
    [categories],
  );
  const companyOptions = useMemo(() => buildCompanyFilterOptions(empresas), [empresas]);
  const locationOptions = useMemo(
    () => buildLocationFilterOptions(locations),
    [locations],
  );

  return (
    <div className="rounded-md border bg-card p-3">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">Desde</span>
          <Input
            type="datetime-local"
            value={filters.createdFrom}
            onChange={(event) => update("createdFrom", event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">Hasta</span>
          <Input
            type="datetime-local"
            value={filters.createdTo}
            onChange={(event) => update("createdTo", event.target.value)}
          />
        </label>
        <div className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">Categoría</span>
          <SearchableSelect
            value={filters.categoryName}
            onChange={(value) => update("categoryName", value)}
            options={categoryOptions}
            placeholder={catalogsLoading ? "Cargando categorías..." : "Todas las categorías"}
            searchPlaceholder="Buscar categoría..."
            emptyOption={{ value: "", label: "Todas las categorías" }}
            disabled={catalogsLoading}
          />
        </div>
        <div className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">Empresa</span>
          <SearchableSelect
            value={filters.companyId}
            onChange={(value) => update("companyId", value)}
            options={companyOptions}
            placeholder={catalogsLoading ? "Cargando empresas..." : "Todas las empresas"}
            searchPlaceholder="Buscar empresa..."
            emptyOption={{ value: "", label: "Todas las empresas" }}
            disabled={catalogsLoading}
          />
        </div>
        <div className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">Sede</span>
          <SearchableSelect
            value={filters.locationId}
            onChange={(value) => update("locationId", value)}
            options={locationOptions}
            placeholder={catalogsLoading ? "Cargando sedes..." : "Todas las sedes"}
            searchPlaceholder="Buscar sede..."
            emptyOption={{ value: "", label: "Todas las sedes" }}
            disabled={catalogsLoading}
          />
        </div>
        <div className="flex items-end">
          <Button type="button" className="w-full" onClick={() => onApply()}>
            <Search className="mr-2 h-4 w-4" aria-hidden="true" />
            Buscar
          </Button>
        </div>
      </div>
    </div>
  );
}
