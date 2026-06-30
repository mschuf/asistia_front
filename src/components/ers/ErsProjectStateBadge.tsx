/**
 * @file ErsProjectStateBadge.tsx
 * @description Badge de estado de proyecto/tarea ERS con variantes adaptadas al tema.
 */
import type { ErsProjectState } from "@/api/ers";
import { Badge } from "@/components/ui/badge";
import { ersProjectStateBadgeVariant, resolveErsProjectState } from "@/lib/ers-project-state";

interface ErsProjectStateBadgeProps {
  stateId?: string | number | null;
  states: ErsProjectState[];
  label?: string | null;
}

/** Badge compacto para estados de proyecto o tarea. */
export function ErsProjectStateBadge({ stateId, states, label }: ErsProjectStateBadgeProps) {
  const state = resolveErsProjectState(stateId, states);
  const text = label ?? state?.name ?? "Sin estado";
  const variantState =
    state ??
    (label
      ? ({ id: 0, name: label, color: null, isFinished: false } satisfies ErsProjectState)
      : null);

  return <Badge variant={ersProjectStateBadgeVariant(variantState)}>{text}</Badge>;
}
