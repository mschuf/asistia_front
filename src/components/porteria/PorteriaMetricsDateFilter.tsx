/**
 * @file PorteriaMetricsDateFilter.tsx
 * @description Selector de período para métricas de Portería (Hoy / 7 días / 30 días / Personalizado).
 */
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  PorteriaMetricsDateFilterState,
  PorteriaMetricsPeriodPreset,
} from "@/types/pages/porteria-page.types";

interface PorteriaMetricsDateFilterProps {
  value: PorteriaMetricsDateFilterState;
  onChange: (value: PorteriaMetricsDateFilterState) => void;
}

const PRESET_OPTIONS: Array<{ id: PorteriaMetricsPeriodPreset; label: string }> = [
  { id: "hoy", label: "Hoy" },
  { id: "7d", label: "7 días" },
  { id: "30d", label: "30 días" },
  { id: "custom", label: "Personalizado" },
];

/**
 * Filtro de período con pills y fechas personalizadas.
 * @param props - Estado del filtro y callback onChange.
 * @returns Controles de período para métricas.
 */
export function PorteriaMetricsDateFilter({ value, onChange }: PorteriaMetricsDateFilterProps) {
  function selectPreset(preset: PorteriaMetricsPeriodPreset) {
    onChange({ ...value, preset });
  }

  return (
    <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
      <div className="flex flex-wrap gap-1">
        {PRESET_OPTIONS.map((option) => {
          const isActive = value.preset === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => selectPreset(option.id)}
              className={cn(
                "rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sky-600 text-white"
                  : "bg-sky-50 text-foreground hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-950/60",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {value.preset === "custom" ? (
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-end">
          <label className="flex min-w-0 flex-col gap-1 text-sm sm:w-[8.75rem] sm:shrink-0">
            <span className="text-muted-foreground">Desde</span>
            <Input
              type="date"
              value={value.desde}
              onChange={(event) => onChange({ ...value, desde: event.target.value })}
              className="date-input-mobile-picker-end w-full min-w-0 px-2"
            />
          </label>
          <label className="flex min-w-0 flex-col gap-1 text-sm sm:w-[8.75rem] sm:shrink-0">
            <span className="text-muted-foreground">Hasta</span>
            <Input
              type="date"
              value={value.hasta}
              onChange={(event) => onChange({ ...value, hasta: event.target.value })}
              className="date-input-mobile-picker-end w-full min-w-0 px-2"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
