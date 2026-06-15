/**
 * @file PorteriaTabs.tsx
 * @description Selector de tabs para Seguimiento e Historial.
 */
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PorteriaTab } from "@/types/pages/porteria-page.types";

interface PorteriaTabsProps {
  value: PorteriaTab;
  onChange: (nextTab: PorteriaTab) => void;
}

const PORTERIA_TABS: Array<{ value: PorteriaTab; label: string }> = [
  { value: "seguimiento", label: "Seguimiento" },
  { value: "historial", label: "Historial" },
];

/**
 * Renderiza el control segmentado de tabs del modulo.
 * @param props - Tab activa y callback de cambio.
 * @returns Botonera de tabs.
 */
export function PorteriaTabs({ value, onChange }: PorteriaTabsProps) {
  return (
    <div className="flex shrink-0 rounded-md border bg-card p-1">
      {PORTERIA_TABS.map((tab) => (
        <Button
          key={tab.value}
          type="button"
          size="sm"
          variant={value === tab.value ? "default" : "ghost"}
          className={cn("gap-2")}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );
}
