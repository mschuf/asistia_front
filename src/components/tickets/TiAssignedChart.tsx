/**
 * @file TiAssignedChart.tsx
 * @description Lista de barras horizontales de tickets abiertos por técnico asignado.
 */
import type { OpenByAssigneeMetric } from "@/types/asistia";

interface TiAssignedChartProps {
  data: OpenByAssigneeMetric[];
  onSelectAssignee?: (technicianId: number) => void;
}

const ASSIGNEE_BAR_COLORS = [
  "#2563eb",
  "#16a34a",
  "#ea580c",
  "#7c3aed",
  "#0891b2",
  "#dc2626",
  "#ca8a04",
  "#059669",
  "#db2777",
  "#4f46e5",
  "#9333ea",
  "#0d9488",
  "#be123c",
  "#65a30d",
  "#475569",
];

/** @param index - Posición en la lista ordenada. @returns Color o patrón de fondo para la barra. */
function getAssigneeBarBackground(index: number): string {
  if (index < ASSIGNEE_BAR_COLORS.length) return ASSIGNEE_BAR_COLORS[index];

  const offset = index - ASSIGNEE_BAR_COLORS.length;
  const firstColor = ASSIGNEE_BAR_COLORS[offset % ASSIGNEE_BAR_COLORS.length];
  const secondColor = ASSIGNEE_BAR_COLORS[
    Math.floor(offset / ASSIGNEE_BAR_COLORS.length + offset + 5) % ASSIGNEE_BAR_COLORS.length
  ];

  return `repeating-linear-gradient(-45deg, ${firstColor}, ${firstColor} 5px, ${secondColor} 5px, ${secondColor} 10px)`;
}

/**
 * Lista ordenada de técnicos con barras proporcionales al máximo abierto.
 * @param props - Métricas por técnico asignado.
 * @returns Lista con barras o mensaje vacío.
 */
export function TiAssignedChart({ data, onSelectAssignee }: TiAssignedChartProps) {
  const sorted = [...data]
    .filter((row) => row.open > 0)
    .sort((a, b) => b.open - a.open || a.name.localeCompare(b.name, "es"));
  const maxOpen = sorted.length > 0 ? Math.max(...sorted.map((row) => row.open)) : 0;

  if (sorted.length === 0) {
    return <p className="mt-2 text-sm text-muted-foreground">No hay servicios abiertos asignados.</p>;
  }

  return (
    <ul className="scrollbar-brand mt-4 max-h-96 space-y-3 overflow-y-auto pr-2" role="list">
      {sorted.map((row, index) => {
        const widthPct = maxOpen > 0 ? Math.round((row.open / maxOpen) * 100) : 0;
        return (
          <li key={row.technicianId}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              {onSelectAssignee ? (
                <button
                  type="button"
                  className="truncate font-medium underline-offset-2 hover:underline"
                  title={row.name}
                  onClick={() => onSelectAssignee(row.technicianId)}
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
                style={{ background: getAssigneeBarBackground(index), width: `${widthPct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
