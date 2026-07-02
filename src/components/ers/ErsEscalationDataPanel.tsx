/**
 * @file ErsEscalationDataPanel.tsx
 * @description Sección editable de datos cargados al escalar ERS.
 */
import type { ErsDetail } from "@/api/ers";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ErsEditState } from "@/types/pages/ers-page.types";

interface ErsEscalationDataPanelProps {
  detail: ErsDetail;
  form: ErsEditState;
  onChange: (next: ErsEditState) => void;
}

/** Panel de datos del escalador con campos editables de requerimiento. */
export function ErsEscalationDataPanel({ detail, form, onChange }: ErsEscalationDataPanelProps) {
  return (
    <div className="space-y-4 rounded-md border bg-card p-4 shadow-soft">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Solicitante</span>
          <Input value={detail.requesterName ?? "—"} readOnly />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Sede</span>
          <Input value={detail.locationName ?? "—"} readOnly />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Ticket origen</span>
          <Input value={detail.ticketId ? `#${detail.ticketId}` : "—"} readOnly />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">Nombre del proyecto</span>
        <Input
          value={form.projectName}
          onChange={(event) => onChange({ ...form, projectName: event.target.value })}
          placeholder="Nombre del proyecto"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">Objetivo</span>
        <Textarea
          className="min-h-24"
          value={form.objective}
          onChange={(event) => onChange({ ...form, objective: event.target.value })}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">Descripción</span>
        <Textarea
          className="min-h-24"
          value={form.description}
          onChange={(event) => onChange({ ...form, description: event.target.value })}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">Medición de impacto</span>
        <Textarea
          className="min-h-24"
          value={form.impact}
          onChange={(event) => onChange({ ...form, impact: event.target.value })}
        />
      </label>

      <div className="space-y-2 rounded-md border p-3">
        <p className="text-sm font-medium">Equipo actual (referencia)</p>
        {detail.team.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin miembros asignados.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-1 text-sm text-muted-foreground sm:grid-cols-2">
            {detail.team.map((member) => (
              <li key={member.userId} className="truncate">
                {member.fullName}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
