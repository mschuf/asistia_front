import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { SearchableSelectOption } from "@/components/ui/searchable-select";
import { ServerSearchableSelect } from "@/components/ui/server-searchable-select";
import { buildLocationOptions } from "@/lib/tickets";
import { getUserById, searchTechnicians } from "@/services/ticketsService";
import type { AsistiaLocation, AsistiaTicket } from "@/types/asistia";

const TECHNICIAN_EMPTY_OPTION = { value: "", label: "Seleccione un TI" };
const LOCATION_EMPTY_OPTION = { value: "", label: "Seleccione una sede" };

interface TicketAssignModalProps {
  ticket: AsistiaTicket | null;
  locations: AsistiaLocation[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (input: { technicianId?: number; locationId?: number }) => void;
  submitting?: boolean;
}

export function TicketAssignModal({
  ticket,
  locations,
  open,
  onOpenChange,
  onConfirm,
  submitting = false,
}: TicketAssignModalProps) {
  const [technicianId, setTechnicianId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [error, setError] = useState("");

  const locationOptions = useMemo(() => buildLocationOptions(locations), [locations]);

  const defaultTechnicianOption = useMemo<SearchableSelectOption | null>(() => {
    if (!ticket?.technician?.id) return null;
    const name = ticket.technician.name ?? "";
    return {
      value: String(ticket.technician.id),
      label: name,
      searchText: name.toLowerCase(),
    };
  }, [ticket?.technician?.id, ticket?.technician?.name]);

  useEffect(() => {
    if (!open || !ticket) {
      setTechnicianId("");
      setLocationId("");
      setError("");
      return;
    }

    setTechnicianId(ticket.technician?.id ? String(ticket.technician.id) : "");
    setLocationId(ticket.location?.id ? String(ticket.location.id) : "");
    setError("");
  }, [open, ticket]);

  const loadTechnicianOptions = useCallback(async (query: string, _signal: AbortSignal) => {
    const result = await searchTechnicians(query);
    return result.items.map(
      (technician): SearchableSelectOption => ({
        value: String(technician.id),
        label: technician.fullName || technician.login,
        searchText: `${technician.fullName} ${technician.login} ${technician.email ?? ""}`.toLowerCase(),
      }),
    );
  }, []);

  const resolveTechnicianOption = useCallback(async (value: string, signal: AbortSignal) => {
    const technician = await getUserById(Number(value), { signal });
    return {
      value: String(technician.id),
      label: technician.fullName || technician.login,
      searchText: `${technician.fullName} ${technician.login}`.toLowerCase(),
    };
  }, []);

  if (!ticket) return null;

  const currentTechnicianId = ticket.technician?.id ? String(ticket.technician.id) : "";
  const currentLocationId = ticket.location?.id ? String(ticket.location.id) : "";

  const handleConfirm = () => {
    const technicianChanged = technicianId !== currentTechnicianId;
    const locationChanged = locationId !== currentLocationId;

    if (!technicianChanged && !locationChanged) {
      setError("Indique al menos un cambio de técnico o sede.");
      return;
    }

    if (technicianChanged && !technicianId) {
      setError("Seleccione un técnico.");
      return;
    }

    if (locationChanged && !locationId) {
      setError("Seleccione una sede.");
      return;
    }

    setError("");
    onConfirm({
      technicianId: technicianChanged ? Number(technicianId) : undefined,
      locationId: locationChanged ? Number(locationId) : undefined,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Asignar ticket #${ticket.id}`}
      description="Puede reasignar el técnico y/o cambiar la sede del ticket."
      allowOverflow
      className="w-full max-w-lg"
      contentClassName="min-h-[min(20rem,50vh)] sm:px-6 sm:py-6"
    >
      <div className="space-y-6">
        <Field id="ticket-assign-technician" label="Técnico (TI)">
          <ServerSearchableSelect
            id="ticket-assign-technician"
            value={technicianId}
            onChange={(value) => {
              setTechnicianId(value);
              if (error) setError("");
            }}
            onLoadOptions={loadTechnicianOptions}
            resolveSelectedOption={resolveTechnicianOption}
            defaultSelectedOption={defaultTechnicianOption}
            placeholder="Seleccione un TI"
            searchPlaceholder="Buscar técnico..."
            emptyOption={TECHNICIAN_EMPTY_OPTION}
            disabled={submitting}
          />
        </Field>

        <Field id="ticket-assign-location" label="Sede">
          <SearchableSelect
            id="ticket-assign-location"
            value={locationId}
            onChange={(value) => {
              setLocationId(value);
              if (error) setError("");
            }}
            options={locationOptions}
            placeholder={locations.length === 0 ? "Sin sedes disponibles" : "Seleccione una sede"}
            searchPlaceholder="Buscar sede..."
            emptyOption={LOCATION_EMPTY_OPTION}
            disabled={submitting || locations.length === 0}
          />
        </Field>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={submitting}
          onClick={() => onOpenChange(false)}
        >
          Cancelar
        </Button>
        <Button type="button" disabled={submitting} onClick={handleConfirm}>
          {submitting ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </Dialog>
  );
}
