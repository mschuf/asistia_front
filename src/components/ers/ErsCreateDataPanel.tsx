/**
 * @file ErsCreateDataPanel.tsx
 * @description Datos iniciales para crear un ERS sin ticket previo.
 */
import { useCallback, useMemo } from "react";
import type { ErsLocation, ErsTechnician } from "@/api/ers";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { SearchableSelectOption } from "@/components/ui/searchable-select";
import { ServerSearchableSelect } from "@/components/ui/server-searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { getUserById, searchUsers } from "@/services/ticketsService";
import type { ErsEditState } from "@/types/pages/ers-page.types";

interface ErsCreateDataPanelProps {
  requesterId: string;
  requester: ErsTechnician | null;
  locationId: string;
  locations: ErsLocation[];
  form: ErsEditState;
  onRequesterChange: (requester: ErsTechnician | null) => void;
  onLocationChange: (locationId: string) => void;
  onChange: (next: ErsEditState) => void;
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
  form,
  onRequesterChange,
  onLocationChange,
  onChange,
}: ErsCreateDataPanelProps) {
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
          <span className="text-muted-foreground">Solicitante</span>
          <ServerSearchableSelect
            value={requesterId}
            onChange={(value) => void changeRequester(value)}
            onLoadOptions={loadRequesterOptions}
            resolveSelectedOption={resolveRequesterOption}
            defaultSelectedOption={requester ? toOption(requester, locations) : null}
            placeholder="Seleccionar solicitante"
            searchPlaceholder="Buscar solicitante..."
            noResultsText="No se encontraron solicitantes"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Sede</span>
          <SearchableSelect
            value={locationId}
            onChange={onLocationChange}
            options={locationOptions}
            placeholder="Seleccionar sede"
            searchPlaceholder="Buscar sede..."
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Ticket origen</span>
          <Input value="Se creará al guardar" readOnly />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">Nombre del proyecto</span>
        <Input
          maxLength={200}
          value={form.projectName}
          onChange={(event) => onChange({ ...form, projectName: event.target.value })}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-muted-foreground">Objetivo</span>
        <Textarea
          className="min-h-[4.8rem]"
          placeholder="¿Qué problema quieres solucionar?"
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
