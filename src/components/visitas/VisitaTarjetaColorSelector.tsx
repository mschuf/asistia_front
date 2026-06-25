/**
 * @file VisitaTarjetaColorSelector.tsx
 * @description Selector visual de color de tarjeta para el formulario de visitas.
 */
import { Building2, Check, Factory, type LucideIcon } from "lucide-react";
import {
  VISITA_TARJETA_COLOR_ACCESOS,
  VISITA_TARJETA_COLOR_LABELS,
  type VisitaTarjetaColor,
} from "@/lib/visita-tarjeta-color";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface VisitaTarjetaColorSelectorProps {
  value: VisitaTarjetaColor | "";
  onChange: (color: VisitaTarjetaColor) => void;
  disabled?: boolean;
  labelId?: string;
}

interface ColorOption {
  id: VisitaTarjetaColor;
  zoneIcons: LucideIcon[];
  coloredCardClassName: string;
  coloredRingClassName: string;
  coloredIconClassName: string;
  idleHoverClassName: string;
}

const NEUTRAL_CARD_CLASSNAME =
  "border-border/80 bg-card text-foreground shadow-sm opacity-60 saturate-0";
const NEUTRAL_ICON_CLASSNAME = "bg-muted text-muted-foreground ring-border/70";

const COLOR_OPTIONS: ColorOption[] = [
  {
    id: "rojo",
    zoneIcons: [Building2],
    coloredCardClassName:
      "border-red-200/90 bg-gradient-to-br from-red-50 via-red-50/70 to-white text-red-900 dark:border-red-800/70 dark:from-red-950/60 dark:via-red-900/35 dark:to-red-950/45 dark:text-red-100",
    coloredRingClassName: "ring-red-400/70 dark:ring-red-500/60",
    coloredIconClassName: "bg-red-500/15 text-red-700 ring-red-300/60 dark:bg-red-900/40 dark:text-red-200 dark:ring-red-700/45",
    idleHoverClassName:
      "hover:border-red-200/80 hover:bg-red-50/35 dark:hover:border-red-800/60 dark:hover:bg-red-950/25",
  },
  {
    id: "amarillo",
    zoneIcons: [Factory],
    coloredCardClassName:
      "border-amber-200/90 bg-gradient-to-br from-amber-50 via-amber-50/70 to-white text-amber-900 dark:border-amber-800/70 dark:from-amber-950/60 dark:via-amber-900/35 dark:to-amber-950/45 dark:text-amber-100",
    coloredRingClassName: "ring-amber-400/70 dark:ring-amber-500/60",
    coloredIconClassName:
      "bg-amber-400/15 text-amber-800 ring-amber-300/60 dark:bg-amber-900/40 dark:text-amber-200 dark:ring-amber-700/45",
    idleHoverClassName:
      "hover:border-amber-200/80 hover:bg-amber-50/35 dark:hover:border-amber-800/60 dark:hover:bg-amber-950/25",
  },
  {
    id: "verde",
    zoneIcons: [Building2, Factory],
    coloredCardClassName:
      "border-emerald-200/90 bg-gradient-to-br from-emerald-50 via-emerald-50/70 to-white text-emerald-900 dark:border-emerald-800/70 dark:from-emerald-950/60 dark:via-emerald-900/35 dark:to-emerald-950/45 dark:text-emerald-100",
    coloredRingClassName: "ring-emerald-400/70 dark:ring-emerald-500/60",
    coloredIconClassName:
      "bg-emerald-500/15 text-emerald-700 ring-emerald-300/60 dark:bg-emerald-900/40 dark:text-emerald-200 dark:ring-emerald-700/45",
    idleHoverClassName:
      "hover:border-emerald-200/80 hover:bg-emerald-50/35 dark:hover:border-emerald-800/60 dark:hover:bg-emerald-950/25",
  },
];

/** Selector de color de tarjeta con accesos asociados por área. */
export function VisitaTarjetaColorSelector({
  value,
  onChange,
  disabled,
  labelId,
}: VisitaTarjetaColorSelectorProps) {
  const hasSelection = value !== "";

  return (
    <div className="space-y-1.5">
      <Label id={labelId} tabIndex={-1}>
        Color de tarjeta
      </Label>
      <div className="grid gap-2 sm:grid-cols-3">
        {COLOR_OPTIONS.map((option) => {
          const selected = value === option.id;
          const showColor = !hasSelection || selected;

          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${VISITA_TARJETA_COLOR_LABELS[option.id]}: ${VISITA_TARJETA_COLOR_ACCESOS[option.id]}`}
              disabled={disabled}
              onClick={() => onChange(option.id)}
              className={cn(
                "group relative flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "disabled:cursor-not-allowed disabled:opacity-50",
                showColor
                  ? cn(
                      selected &&
                        cn(
                          "ring-2 ring-offset-2 ring-offset-background shadow-sm",
                          option.coloredRingClassName,
                        ),
                      option.coloredCardClassName,
                      !hasSelection && option.idleHoverClassName,
                    )
                  : NEUTRAL_CARD_CLASSNAME,
              )}
            >
              <span
                className={cn(
                  "flex h-14 w-14 shrink-0 items-center justify-center gap-1 rounded-lg ring-1 transition-all duration-200",
                  showColor ? option.coloredIconClassName : NEUTRAL_ICON_CLASSNAME,
                )}
                aria-hidden
              >
                {option.zoneIcons.map((Icon, index) => (
                  <Icon key={`${option.id}-${index}`} className="h-6 w-6" />
                ))}
              </span>

              <span className="min-w-0 flex-1 space-y-0.5 pr-6">
                <span className="block text-sm font-semibold leading-none">
                  {VISITA_TARJETA_COLOR_LABELS[option.id]}
                </span>
                <span
                  className={cn(
                    "block text-xs leading-snug",
                    selected ? "text-current/75" : "text-muted-foreground",
                  )}
                >
                  {VISITA_TARJETA_COLOR_ACCESOS[option.id]}
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
