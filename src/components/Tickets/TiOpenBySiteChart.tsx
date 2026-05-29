import type { OpenByLocationMetric } from "@/types/asistia";

const CHART_TOP_N = 12;

interface TiOpenBySiteChartProps {
  data: OpenByLocationMetric[];
}

export function TiOpenBySiteChart({ data }: TiOpenBySiteChartProps) {
  const sorted = [...data].sort((a, b) => b.open - a.open).slice(0, CHART_TOP_N);
  const maxOpen = sorted.length > 0 ? Math.max(...sorted.map((row) => row.open)) : 0;

  if (sorted.length === 0) {
    return (
      <div className="rounded-md border bg-card p-4">
        <p className="text-sm font-medium">Abiertos por sede</p>
        <p className="mt-2 text-sm text-muted-foreground">No hay tickets abiertos con sede asignada.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card p-4">
      <p className="text-sm font-medium">Abiertos por sede</p>
      <p className="mt-1 text-xs text-muted-foreground">

      </p>
      <ul className="mt-4 space-y-3" role="list">
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
