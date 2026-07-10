/**
 * @file ErsCreateDataPanel.tsx
 * @description Datos iniciales para crear un ERS sin ticket previo.
 */
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { ErsLocation, ErsProjectType, ErsTechnician } from "@/api/ers";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { SearchableSelectHandle, SearchableSelectOption } from "@/components/ui/searchable-select";
import { ServerSearchableSelect } from "@/components/ui/server-searchable-select";
import type { ServerSearchableSelectHandle } from "@/components/ui/server-searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { getUserById, searchUsers } from "@/services/ticketsService";
import { cn } from "@/lib/utils";
import type { ErsEditState, ErsFieldErrors, ErsFocusSignal } from "@/types/pages/ers-page.types";

interface ErsCreateDataPanelProps {
  requesterId: string;
  requester: ErsTechnician | null;
  locationId: string;
  locations: ErsLocation[];
  projectTypes: ErsProjectType[];
  projectTypesDisabled: boolean;
  form: ErsEditState;
  onRequesterChange: (requester: ErsTechnician | null) => void;
  onLocationChange: (locationId: string) => void;
  onChange: (next: ErsEditState) => void;
  errors?: ErsFieldErrors;
  focusSignal?: ErsFocusSignal | null;
}

function toOption(user: ErsTechnician, locations: ErsLocation[]): SearchableSelectOption {
  const location = locations.find((item) => item.id === user.locationId);
  const locationName = location ? location.fullPath || location.name : "";
  return {
    value: String(user.id),
    label: locationName ? `${user.fullName} (${locationName})` : user.fullName,
    searchText: `${user.id} ${user.fullName} ${locationName}`,
  };
}

/** Panel de solicitante, sede y datos funcionales del nuevo proyecto. */
export function ErsCreateDataPanel({
  requesterId,
  requester,
  locationId,
  locations,
  projectTypes,
  projectTypesDisabled,
  form,
  onRequesterChange,
  onLocationChange,
  onChange,
  errors,
  focusSignal,
}: ErsCreateDataPanelProps) {
  const requesterRef = useRef<ServerSearchableSelectHandle>(null);
  const locationRef = useRef<SearchableSelectHandle>(null);
  const projectNameRef = useRef<HTMLInputElement>(null);
  const objectiveRef = useRef<HTMLTextAreaElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!focusSignal) return;
    switch (focusSignal.field) {
      case "requester":
        requesterRef.current?.focusAndOpen();
        break;
      case "location":
        locationRef.current?.focusAndOpen();
        break;
      case "projectName":
        projectNameRef.current?.focus();
        break;
      case "objective":
        objectiveRef.current?.focus();
        break;
      case "description":
        descriptionRef.current?.focus();
        break;
      default:
        break;
    }
  }, [focusSignal]);

  const requesterInvalid = Boolean(errors?.requester) && !requesterId;
  const locationInvalid = Boolean(errors?.location) && !locationId;
  const projectNameInvalid = Boolean(errors?.projectName) && form.projectName.trim().length < 3;
  const objectiveInvalid = Boolean(errors?.objective) && !form.objective.trim();
  const descriptionInvalid = Boolean(errors?.description) && !form.description.trim();

  const loadRequesterOptions = useCallback(
    async (query: string, signal: AbortSignal) => {
      const response = await searchUsers(
        query.trim() || undefined,
        50,
        { signal, showBackdrop: false },
      );
      return response.items.map((item) => toOption(item, locations));
    },
    [locations],
  );

  const resolveRequesterOption = useCallback(
    async (value: string, signal: AbortSignal) => {
      const requester = await getUserById(Number(value), { signal, showBackdrop: false });
      return toOption(requester, locations);
    },
    [locations],
  );

  const locationOptions = useMemo(
    () =>
      locations.map((location) => ({
        value: String(location.id),
        label: location.fullPath || location.name,
        searchText: `${location.name} ${location.fullPath}`,
      })),
    [locations],
  );

  const changeRequester = async (value: string) => {
    if (!value) {
      onRequesterChange(null);
      return;
    }
    try {
      const nextRequester = await getUserById(Number(value), { showBackdrop: false });
      onRequesterChange({
        id: nextRequester.id,
        fullName: nextRequester.fullName,
        locationId: nextRequester.locationId,
      });
    } catch {
      onRequesterChange(null);
    }
  };

  return (
    <div className="space-y-4 rounded-md border bg-card p-4 shadow-soft">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">
            Solicitante <span className="text-destructive">*</span>
          </span>
          <ServerSearchableSelect
            ref={requesterRef}
            value={requesterId}
            onChange={(value) => void changeRequester(value)}
            onLoadOptions={loadRequesterOptions}
            resolveSelectedOption={resolveRequesterOption}
            defaultSelectedOption={requester ? toOption(requester, locations) : null}
            placeholder="Seleccionar solicitante"
            searchPlaceholder="Buscar solicitante..."
            noResultsText="No se encontraron solicitantes"
            invalid={requesterInvalid}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">
            Sede <span className="text-destructive">*</span>
          </span>
          <SearchableSelect
            ref={locationRef}
            value={locationId}
            onChange={onLocationChange}
            options={locationOptions}
            placeholder="Seleccionar sede"
            searchPlaceholder="Buscar sede..."
            invalid={locationInvalid}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Ticket origen</span>
          <Input value="Se creará al guardar" readOnly />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">
            Nombre del proyecto <span className="text-destructive">*</span>
          </span>
          <Input
            ref={projectNameRef}
            maxLength={200}
            className={cn(projectNameInvalid && "border-destructive focus-visible:ring-destructive")}
            value={form.projectName}
            onChange={(event) => onChange({ ...form, projectName: event.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Sistema Relacionado</span>
          <SearchableSelect
            value={form.projectTypeId}
            onChange={(projectTypeId) => onChange({ ...form, projectTypeId })}
            options={projectTypes.map((projectType) => ({
              value: String(projectType.id),
              label: projectType.name,
            }))}
            emptyOption={{ value: "", label: "Sin sistema relacionado" }}
            placeholder="Sin sistema relacionado"
            searchPlaceholder="Buscar sistema..."
            noResultsText="No se encontraron sistemas"
            disabled={projectTypesDisabled}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">
          Objetivo <span className="text-destructive">*</span>
        </span>
        <Textarea
          ref={objectiveRef}
          className={cn("min-h-[3.75rem]", objectiveInvalid && "border-destructive focus-visible:ring-destructive")}
          placeholder="¿Qué problema quieres solucionar?"
          value={form.objective}
          onChange={(event) => onChange({ ...form, objective: event.target.value })}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">
          Descripción Funcional <span className="text-destructive">*</span>
        </span>
        <Textarea
          ref={descriptionRef}
          className={cn("min-h-[4.8rem]", descriptionInvalid && "border-destructive focus-visible:ring-destructive")}
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
