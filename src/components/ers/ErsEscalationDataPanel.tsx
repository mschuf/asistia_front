/**
 * @file ErsEscalationDataPanel.tsx
 * @description Sección editable de datos cargados al escalar ERS.
 */
import { useMemo } from "react";
import { Eye } from "lucide-react";
import type { ErsProjectType } from "@/api/ers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import type { ErsEditState } from "@/types/pages/ers-page.types";

interface ErsEscalationDataPanelProps {
  requesterName: string | null;
  locationName: string | null;
  ticketId: number | null;
  projectTypeName?: string | null;
  onTicketPreview?: () => void;
  form: ErsEditState;
  onChange: (next: ErsEditState) => void;
  projectTypes: ErsProjectType[];
  projectTypesDisabled: boolean;
}

/** Panel de datos del escalador con campos editables de requerimiento. */
export function ErsEscalationDataPanel({
  requesterName,
  locationName,
  ticketId,
  projectTypeName,
  onTicketPreview,
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
      projectTypeName &&
      !options.some((option) => option.value === form.projectTypeId)
    ) {
      options.push({ value: form.projectTypeId, label: projectTypeName });
    }
    return options;
  }, [form.projectTypeId, projectTypeName, projectTypes]);

  return (
    <div className="space-y-4 rounded-md border bg-card p-4 shadow-soft">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Solicitante</span>
          <Input value={requesterName ?? "—"} readOnly />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Sede</span>
          <Input value={locationName ?? "—"} readOnly />
        </label>
        <div className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Ticket origen</span>
          <div className="relative">
            {onTicketPreview ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute left-1 top-1 z-10 h-8 w-8"
                aria-label="Ver detalle del ticket origen"
                title="Ver detalle del ticket origen"
                onClick={onTicketPreview}
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
              </Button>
            ) : null}
            <Input
              className={onTicketPreview ? "pl-10" : undefined}
              value={ticketId ? `#${ticketId}` : "—"}
              readOnly
            />
          </div>
        </div>
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
          className="min-h-[3.75rem]"
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
          className="min-h-[3.75rem]"
          placeholder="¿Como medirías operativamente luego de implementar?"
          value={form.impact}
          onChange={(event) => onChange({ ...form, impact: event.target.value })}
        />
      </label>

    </div>
  );
}
