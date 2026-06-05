import type { OpenByLocationMetric } from "@/types/asistia";

interface TiOpenBySiteChartProps {
  data: OpenByLocationMetric[];
}

export function TiOpenBySiteChart({ data }: TiOpenBySiteChartProps) {
  const sorted = [...data].sort((a, b) => b.open - a.open || a.name.localeCompare(b.name, "es"));
  const maxOpen = sorted.length > 0 ? Math.max(...sorted.map((row) => row.open)) : 0;

  if (sorted.length === 0) {
    return (
      <div className="rounded-md border bg-card p-4">
        <p className="text-sm font-medium">Indicadores</p>
        <p className="mt-2 text-sm text-muted-foreground">No hay sedes registradas.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card p-4">
      <p className="text-sm font-medium">Indicadores</p>
      <p className="mt-1 text-xs text-muted-foreground">Tickets abiertos totales por sede</p>
      <ul className="mt-4 max-h-96 space-y-3 overflow-y-auto pr-1" role="list">
        {sorted.map((row) => {
          const widthPct = maxOpen > 0 ? Math.round((row.open / maxOpen) * 100) : 0;
          return (
            <li key={row.locationId}>
              <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                <span className="truncate font-medium" title={row.name}>
                  {row.name}
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">{row.open}</span>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full bg-muted"
                role="presentation"
                aria-hidden="true"
              >
                <div
                  className="h-full rounded-full bg-sky-500 transition-[width] dark:bg-sky-600"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
