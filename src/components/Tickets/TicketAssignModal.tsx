/**

 * @file TicketAssignModal.tsx

 * @description Modal para reasignar técnico, solicitante y/o sede de un ticket.

 */

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

import { Dialog } from "@/components/ui/dialog";

import { Field } from "@/components/ui/field";

import { Input } from "@/components/ui/input";

import { SearchableSelect } from "@/components/ui/searchable-select";

import type { SearchableSelectOption } from "@/components/ui/searchable-select";

import { ServerSearchableSelect } from "@/components/ui/server-searchable-select";

import {

  buildLocationOptions,

  buildRequesterDisplayLabel,

  buildTechnicianSelectOptions,

  findLocationById,

  locationDisplayName,

} from "@/lib/tickets";

import { getUserById, searchTechnicians, searchUsers } from "@/services/ticketsService";

import type { AsistiaLocation, AsistiaTicket } from "@/types/asistia";



const TECHNICIAN_EMPTY_OPTION = { value: "", label: "Seleccione un TI" };

const REQUESTER_EMPTY_OPTION = { value: "", label: "Seleccione solicitante" };

const LOCATION_EMPTY_OPTION = { value: "", label: "Seleccione una sede" };



interface TicketAssignModalProps {

  ticket: AsistiaTicket | null;

  locations: AsistiaLocation[];

  open: boolean;

  onOpenChange: (open: boolean) => void;

  onConfirm: (input: {

    technicianId?: number;

    requesterId?: number;

    locationId?: number;

  }) => void;

  submitting?: boolean;

}



/**

 * Diálogo de reasignación de técnico, solicitante y sede con validación de cambios.

 * @param props - Ticket, sedes, visibilidad y callback onConfirm.

 * @returns Modal de asignación o null.

 */

export function TicketAssignModal({

  ticket,

  locations,

  open,

  onOpenChange,

  onConfirm,

  submitting = false,

}: TicketAssignModalProps) {

  const [technicianId, setTechnicianId] = useState("");

  const [requesterId, setRequesterId] = useState("");

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



  const defaultRequesterOption = useMemo<SearchableSelectOption | null>(() => {

    if (!ticket?.requester?.id) return null;

    const name = ticket.requester.name ?? "";

    return {

      value: String(ticket.requester.id),

      label: name,

      searchText: name.toLowerCase(),

    };

  }, [ticket?.requester?.id, ticket?.requester?.name]);



  useEffect(() => {

    if (!open || !ticket) {

      setTechnicianId("");

      setRequesterId("");

      setLocationId("");

      setError("");

      return;

    }



    setTechnicianId(ticket.technician?.id ? String(ticket.technician.id) : "");

    setRequesterId(ticket.requester?.id ? String(ticket.requester.id) : "");

    setLocationId(ticket.location?.id ? String(ticket.location.id) : "");

    setError("");

  }, [open, ticket]);



  /** @param query - Texto de búsqueda. @param _signal - Señal de aborto. @returns Opciones de técnico. */

  const loadTechnicianOptions = useCallback(

    async (query: string, _signal: AbortSignal) => {

      const result = await searchTechnicians(query);

      return buildTechnicianSelectOptions(result.items, locations);

    },

    [locations],

  );



  /** @param value - ID del técnico. @param signal - Señal de aborto. @returns Opción resuelta. */

  const resolveTechnicianOption = useCallback(

    async (value: string, signal: AbortSignal) => {

      const technician = await getUserById(Number(value), { signal });

      const location = findLocationById(locations, technician.locationId);

      const locationName = location ? locationDisplayName(location) : "";

      return {

        value: String(technician.id),

        label: buildRequesterDisplayLabel(technician, locations),

        searchText: `${technician.fullName} ${technician.login} ${locationName}`.toLowerCase(),

      };

    },

    [locations],

  );



  /** @param query - Texto de búsqueda. @param signal - Señal de aborto. @returns Opciones de solicitante. */

  const loadRequesterOptions = useCallback(

    async (query: string, signal: AbortSignal) => {

      const result = await searchUsers(query, undefined, { signal });

      return result.items.map((requester): SearchableSelectOption => {

        const location = findLocationById(locations, requester.locationId);

        const locationName = location ? locationDisplayName(location) : "";

        return {

          value: String(requester.id),

          label: buildRequesterDisplayLabel(requester, locations),

          searchText:

            `${requester.fullName} ${requester.login} ${requester.email ?? ""} ${locationName}`.toLowerCase(),

        };

      });

    },

    [locations],

  );



  /** @param value - ID del solicitante. @param signal - Señal de aborto. @returns Opción resuelta. */

  const resolveRequesterOption = useCallback(

    async (value: string, signal: AbortSignal) => {

      const requester = await getUserById(Number(value), { signal });

      const location = findLocationById(locations, requester.locationId);

      const locationName = location ? locationDisplayName(location) : "";

      return {

        value: String(requester.id),

        label: buildRequesterDisplayLabel(requester, locations),

        searchText: `${requester.fullName} ${requester.login} ${locationName}`.toLowerCase(),

      };

    },

    [locations],

  );



  if (!ticket) return null;



  const currentTechnicianId = ticket.technician?.id ? String(ticket.technician.id) : "";

  const currentRequesterId = ticket.requester?.id ? String(ticket.requester.id) : "";

  const currentLocationId = ticket.location?.id ? String(ticket.location.id) : "";

  const currentTechnicianName = ticket.technician?.name?.trim() || "Sin asignar";

  const currentRequesterName = ticket.requester?.name?.trim() || "Sin solicitante";

  const currentLocationName = ticket.location?.name?.trim() || "Sin sede";



  /** Valida cambios y delega en onConfirm. @returns void */

  const handleConfirm = () => {

    const technicianChanged = technicianId !== currentTechnicianId;

    const requesterChanged = requesterId !== currentRequesterId;

    const locationChanged = locationId !== currentLocationId;



    if (!technicianChanged && !requesterChanged && !locationChanged) {

      setError("Indique al menos un cambio de técnico, solicitante o sede.");

      return;

    }



    if (technicianChanged && !technicianId) {

      setError("Seleccione un técnico.");

      return;

    }



    if (requesterChanged && !requesterId) {

      setError("Seleccione un solicitante.");

      return;

    }



    if (locationChanged && !locationId) {

      setError("Seleccione una sede.");

      return;

    }



    setError("");

    onConfirm({

      technicianId: technicianChanged ? Number(technicianId) : undefined,

      requesterId: requesterChanged ? Number(requesterId) : undefined,

      locationId: locationChanged ? Number(locationId) : undefined,

    });

  };



  return (

    <Dialog

      open={open}

      onOpenChange={onOpenChange}

      title={`Asignar ticket #${ticket.id}`}

      description="Puede reasignar el técnico, cambiar el solicitante y/o la sede del ticket."

      allowOverflow

      className="w-full max-w-2xl"

      contentClassName="min-h-[min(20rem,50vh)] sm:px-6 sm:py-6"

    >

      <div className="grid gap-6 sm:grid-cols-2">

        <Field id="ticket-assign-current-requester" label="Solicitante actual">

          <Input

            id="ticket-assign-current-requester"

            value={currentRequesterName}

            readOnly

            disabled

          />

        </Field>



        <Field id="ticket-assign-requester" label="Nuevo solicitante">

          <ServerSearchableSelect

            id="ticket-assign-requester"

            value={requesterId}

            onChange={(value) => {

              setRequesterId(value);

              if (error) setError("");

            }}

            onLoadOptions={loadRequesterOptions}

            resolveSelectedOption={resolveRequesterOption}

            defaultSelectedOption={defaultRequesterOption}

            placeholder="Seleccione solicitante"

            searchPlaceholder="Buscar usuario..."

            emptyOption={REQUESTER_EMPTY_OPTION}

            disabled={submitting}

          />

        </Field>



        <Field id="ticket-assign-current-technician" label="Técnico actual">

          <Input

            id="ticket-assign-current-technician"

            value={currentTechnicianName}

            readOnly

            disabled

          />

        </Field>



        <Field id="ticket-assign-technician" label="Nuevo técnico (TI)">

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



        <Field id="ticket-assign-current-location" label="Sede actual">

          <Input

            id="ticket-assign-current-location"

            value={currentLocationName}

            readOnly

            disabled

          />

        </Field>



        <Field id="ticket-assign-location" label="Nueva sede">

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

          <p className="text-sm text-destructive sm:col-span-2" role="alert">

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

