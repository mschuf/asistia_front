/**
 * @file TiTicketsChartCard.tsx
 * @description Tarjeta con gráfico de tickets abiertos, alternando entre vista por sede y por asignado TI.
 */
import { useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TiOpenBySiteChart } from "@/components/tickets/TiOpenBySiteChart";
import { TiAssignedChart } from "@/components/tickets/TiAssignedChart";
import type { OpenByAssigneeMetric, OpenByLocationMetric } from "@/types/asistia";

type TiChartMode = "site" | "assignee";

interface TiTicketsChartCardProps {
  openByLocation: OpenByLocationMetric[];
  openByAssignee: OpenByAssigneeMetric[];
  description?: string;
  onSelectLocation?: (locationId: number) => void;
  onSelectAssignee?: (technicianId: number) => void;
}

/**
 * Tarjeta con toggle entre "servicios abiertos por sede" y "Asignados TI".
 * @param props - Datos de ambas vistas, descripción opcional y callbacks de navegación al hacer clic en un nombre.
 * @returns Tarjeta con título, botón de alternancia y gráfico activo.
 */
export function TiTicketsChartCard({
  openByLocation,
  openByAssignee,
  description = "Servicios abiertos totales por sede",
  onSelectLocation,
  onSelectAssignee,
}: TiTicketsChartCardProps) {
  const [chartMode, setChartMode] = useState<TiChartMode>("site");
  const chartTitle = chartMode === "site" ? "Indicadores" : "Asignados TI";
  const chartDescription = chartMode === "site" ? description : "Servicios abiertos por técnico asignado";
  const nextChartLabel = chartMode === "site" ? "Ver Asignados TI" : "Ver por sede";

  return (
    <div className="rounded-md border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{chartTitle}</p>
          <p className="mt-1 text-xs text-muted-foreground">{chartDescription}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={nextChartLabel}
          title={nextChartLabel}
          onClick={() => setChartMode((value) => (value === "site" ? "assignee" : "site"))}
        >
          <ArrowRightLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      {chartMode === "site" ? (
        <TiOpenBySiteChart data={openByLocation} onSelectLocation={onSelectLocation} />
      ) : (
        <TiAssignedChart data={openByAssignee} onSelectAssignee={onSelectAssignee} />
      )}
    </div>
  );
}
