/**
 * @file TicketsCloseFilters.tsx
 * @description Filtros de cierre masivo: rango de fechas y estados a incluir (super admin).
 */
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TicketsCloseFilterState } from "@/types/pages/tickets-close.types";

interface TicketsCloseFiltersProps {
  filters: TicketsCloseFilterState;
  onChange: (filters: TicketsCloseFilterState) => void;
  onApply: () => void;
  loading?: boolean;
}

/**
 * Panel de filtros de cierre masivo: rango de fechas y checkboxes de estado.
 * @param props - Estado de filtros y callbacks change/apply.
 * @returns Panel de filtros con botón "Consultar" explícito.
 */
export function TicketsCloseFilters({
  filters,
  onChange,
  onApply,
  loading = false,
}: TicketsCloseFiltersProps) {
  const update = <K extends keyof TicketsCloseFilterState>(
    key: K,
    value: TicketsCloseFilterState[K],
  ) => {
    onChange({ ...filters, [key]: value });
  };

  const canApply = filters.includeOpen || filters.includeSolved;

  return (
    <div className="rounded-md border bg-card p-3">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">Desde</span>
          <Input
            type="datetime-local"
            value={filters.dateFrom}
            onChange={(event) => update("dateFrom", event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">Hasta</span>
          <Input
            type="datetime-local"
            value={filters.dateTo}
            onChange={(event) => update("dateTo", event.target.value)}
          />
        </label>
        <div className="flex flex-col gap-1.5 text-sm">
          <span className="invisible">Estado</span>
          <div className="flex h-10 items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.includeOpen}
                onChange={(event) => update("includeOpen", event.target.checked)}
              />
              Abiertos
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.includeSolved}
                onChange={(event) => update("includeSolved", event.target.checked)}
              />
              Resueltos
            </label>
          </div>
        </div>
        <div className="flex items-end xl:col-span-2">
          <Button type="button" className="w-full" disabled={!canApply || loading} onClick={onApply}>
            <Search className="mr-2 h-4 w-4" aria-hidden="true" />
            Consultar
          </Button>
        </div>
      </div>
      {!canApply ? (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          Seleccioná al menos un estado (Abiertos o Resueltos) para consultar.
        </p>
      ) : null}
    </div>
  );
}
