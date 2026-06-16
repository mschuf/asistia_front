/**
 * @file PorteriaTabs.tsx
 * @description Selector de tabs para Indicadores, Visita e Historial.
 */
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PorteriaTab } from "@/types/pages/porteria-page.types";

interface PorteriaTabsProps {
  value: PorteriaTab | null;
  onChange: (nextTab: PorteriaTab) => void;
}

const PORTERIA_TABS: Array<{ value: PorteriaTab; label: string }> = [
  { value: "indicadores", label: "Indicadores" },
  { value: "visita", label: "Visitas" },
  { value: "historial", label: "Historial" },
];

/**
 * Renderiza el control segmentado de tabs del modulo.
 * @param props - Tab activa y callback de cambio.
 * @returns Botonera de tabs.
 */
export function PorteriaTabs({ value, onChange }: PorteriaTabsProps) {
  return (
    <div className="flex w-full shrink-0 rounded-md border bg-card p-1 sm:w-auto">
      {PORTERIA_TABS.map((tab) => (
        <Button
          key={tab.value}
          type="button"
          size="sm"
          variant={value === tab.value ? "default" : "ghost"}
          className={cn("min-w-0 flex-1 sm:flex-initial")}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );
}
