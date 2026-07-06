/**
 * @file ErsEscalationDataPanel.tsx
 * @description Sección editable de datos cargados al escalar ERS.
 */
import { useMemo } from "react";
import type { ErsDetail, ErsProjectType } from "@/api/ers";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import type { ErsEditState } from "@/types/pages/ers-page.types";

interface ErsEscalationDataPanelProps {
  detail: ErsDetail;
  form: ErsEditState;
  onChange: (next: ErsEditState) => void;
  projectTypes: ErsProjectType[];
  projectTypesDisabled: boolean;
}

/** Panel de datos del escalador con campos editables de requerimiento. */
export function ErsEscalationDataPanel({
  detail,
  form,
  onChange,
  projectTypes,
  projectTypesDisabled,
}: ErsEscalationDataPanelProps) {
  const projectTypeOptions = useMemo(() => {
    const options = projectTypes.map((projectType) => ({
      value: String(projectType.id),
      label: projectType.name,
    }));
    if (
      form.projectTypeId &&
      detail.projectTypeName &&
      !options.some((option) => option.value === form.projectTypeId)
    ) {
      options.push({ value: form.projectTypeId, label: detail.projectTypeName });
    }
    return options;
  }, [detail.projectTypeName, form.projectTypeId, projectTypes]);

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

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Nombre del proyecto</span>
          <Input
            value={form.projectName}
            onChange={(event) => onChange({ ...form, projectName: event.target.value })}
            placeholder="Nombre del proyecto"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Sistema Relacionado</span>
          <SearchableSelect
            value={form.projectTypeId}
            onChange={(projectTypeId) => onChange({ ...form, projectTypeId })}
            options={projectTypeOptions}
            emptyOption={{ value: "", label: "Sin sistema relacionado" }}
            placeholder="Sin sistema relacionado"
            searchPlaceholder="Buscar sistema..."
            noResultsText="No se encontraron sistemas"
            disabled={projectTypesDisabled}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">Objetivo</span>
        <Textarea
          className="min-h-[4.8rem]"
          placeholder="¿Que problema quieres solucionar?"
          value={form.objective}
          onChange={(event) => onChange({ ...form, objective: event.target.value })}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">Descripción Funcional</span>
        <Textarea
          className="min-h-[4.8rem]"
          placeholder="¿Cómo lo solucionarás?"
          value={form.description}
          onChange={(event) => onChange({ ...form, description: event.target.value })}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">Medición de impacto</span>
        <Textarea
          className="min-h-[4.8rem]"
          placeholder="¿Como medirías operativamente luego de implementar?"
          value={form.impact}
          onChange={(event) => onChange({ ...form, impact: event.target.value })}
        />
      </label>

    </div>
  );
}
