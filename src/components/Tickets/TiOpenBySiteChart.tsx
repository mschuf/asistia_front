/**
 * @file TiOpenBySiteChart.tsx
 * @description Lista de barras horizontales de tickets abiertos por sede.
 */
import { getSiteMetricBarStyle } from "@/lib/site-metric-bar-colors";
import type { OpenByLocationMetric } from "@/types/asistia";

interface TiOpenBySiteChartProps {
  data: OpenByLocationMetric[];
  onSelectLocation?: (locationId: number) => void;
}

/**
 * Lista ordenada de sedes con barras proporcionales al máximo abierto.
 * @param props - Métricas por sede y callback opcional al hacer clic en un nombre.
 * @returns Lista con barras o mensaje vacío.
 */
export function TiOpenBySiteChart({ data, onSelectLocation }: TiOpenBySiteChartProps) {
  const sorted = [...data]
    .filter((row) => row.open > 0)
    .sort((a, b) => b.open - a.open || a.name.localeCompare(b.name, "es"));
  const maxOpen = sorted.length > 0 ? Math.max(...sorted.map((row) => row.open)) : 0;

  if (sorted.length === 0) {
    return <p className="mt-2 text-sm text-muted-foreground">No hay servicios abiertos por sede.</p>;
  }

  return (
    <ul className="scrollbar-brand mt-4 max-h-96 space-y-3 overflow-y-auto pr-2" role="list">
      {sorted.map((row) => {
        const widthPct = maxOpen > 0 ? Math.round((row.open / maxOpen) * 100) : 0;
        return (
          <li key={row.locationId}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              {onSelectLocation ? (
                <button
                  type="button"
                  className="truncate font-medium underline-offset-2 hover:underline"
                  title={row.name}
                  onClick={() => onSelectLocation(row.locationId)}
                >
                  {row.name}
                </button>
              ) : (
                <span className="truncate font-medium" title={row.name}>
                  {row.name}
                </span>
              )}
              <span className="shrink-0 tabular-nums text-muted-foreground">{row.open}</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-muted"
              role="presentation"
              aria-hidden="true"
            >
              <div
                className="h-full min-w-[2px] rounded-full transition-[width]"
                style={{ ...getSiteMetricBarStyle(row.name), width: `${widthPct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
