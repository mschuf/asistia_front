/**
 * @file VisitaZonasSelector.tsx
 * @description Selector visual de zonas permitidas para el formulario de visitas.
 */
import { Building2, Check, Factory, type LucideIcon } from "lucide-react";
import { VISITA_ZONA_LABELS, type VisitaZona } from "@/api/visitas";
import { Label } from "@/components/ui/label";
import {
  PORTERIA_ADMINISTRACION_COLORS,
  PORTERIA_FABRICA_COLORS,
} from "@/lib/porteria.constants";
import { cn } from "@/lib/utils";

interface VisitaZonasSelectorProps {
  value: VisitaZona[];
  onToggle?: (zona: VisitaZona) => void;
  readOnly?: boolean;
}

interface ZonaOption {
  id: VisitaZona;
  description: string;
  icon: LucideIcon;
  selectedCardClassName: string;
  selectedIconClassName: string;
  idleHoverClassName: string;
  selectedRingClassName: string;
}

const ZONA_OPTIONS: ZonaOption[] = [
  {
    id: "administración",
    description: "Oficinas y áreas administrativas",
    icon: Building2,
    selectedCardClassName: PORTERIA_ADMINISTRACION_COLORS.metricCard,
    selectedIconClassName: PORTERIA_ADMINISTRACION_COLORS.metricIcon,
    idleHoverClassName:
      "hover:border-violet-200/80 hover:bg-violet-50/35 dark:hover:border-violet-800/60 dark:hover:bg-violet-950/25",
    selectedRingClassName: "ring-violet-400/70 dark:ring-violet-500/60",
  },
  {
    id: "fábrica",
    description: "Planta de producción y depósitos",
    icon: Factory,
    selectedCardClassName: PORTERIA_FABRICA_COLORS.metricCard,
    selectedIconClassName: PORTERIA_FABRICA_COLORS.metricIcon,
    idleHoverClassName:
      "hover:border-emerald-200/80 hover:bg-emerald-50/35 dark:hover:border-emerald-800/60 dark:hover:bg-emerald-950/25",
    selectedRingClassName: "ring-emerald-400/70 dark:ring-emerald-500/60",
  },
];

/** Selector de zonas permitidas con tarjetas interactivas por área. */
export function VisitaZonasSelector({ value, onToggle, readOnly = false }: VisitaZonasSelectorProps) {
  return (
    <div className="space-y-1.5">
      <Label>Zonas permitidas</Label>
      {readOnly ? (
        <p className="text-xs text-muted-foreground">Definidas automáticamente según el color de tarjeta.</p>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-2">
        {ZONA_OPTIONS.map((option) => {
          const selected = value.includes(option.id);
          const Icon = option.icon;

          return (
            <button
              key={option.id}
              type="button"
              role="checkbox"
              aria-checked={selected}
              aria-disabled={readOnly || undefined}
              aria-label={`${VISITA_ZONA_LABELS[option.id]}${selected ? ", seleccionada" : ""}`}
              disabled={readOnly}
              onClick={readOnly ? undefined : () => onToggle?.(option.id)}
              className={cn(
                "group relative flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                readOnly && "cursor-default",
                readOnly && !selected && "opacity-50",
                selected
                  ? cn("ring-2 ring-offset-2 ring-offset-background shadow-sm", option.selectedRingClassName, option.selectedCardClassName)
                  : cn(
                      "border-border/80 bg-card text-foreground shadow-sm",
                      !readOnly && option.idleHoverClassName,
                    ),
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                  selected
                    ? option.selectedIconClassName
                    : "bg-muted text-muted-foreground ring-1 ring-border/70 group-hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>

              <span className="min-w-0 flex-1 space-y-0.5 pr-6">
                <span className="block text-sm font-semibold leading-none">{VISITA_ZONA_LABELS[option.id]}</span>
                <span
                  className={cn(
                    "block text-xs leading-snug",
                    selected ? "text-current/75" : "text-muted-foreground",
                  )}
                >
                  {option.description}
                </span>
              </span>

              <span
                className={cn(
                  "absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border transition-all duration-200",
                  selected
                    ? "border-transparent bg-primary text-primary-foreground shadow-sm"
                    : "border-border/80 bg-background/80 text-transparent",
                )}
                aria-hidden
              >
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
