import { Eraser, SendHorizontal } from "lucide-react";
import { FormEvent, useCallback, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Loading } from "@/components/ui/loading";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { SearchableSelectOption } from "@/components/ui/searchable-select";
import { ServerSearchableSelect } from "@/components/ui/server-searchable-select";
import { RichDescriptionEditor } from "@/components/tickets/RichDescriptionEditor";
import { buildCategoryOptions, buildLocationOptions } from "@/lib/tickets";
import { stripHtml } from "@/lib/utils";
import { getUserById, searchTechnicians, searchUsers } from "@/services/ticketsService";
import type { AsistiaCategory, AsistiaLocation, AsistiaTicketType } from "@/types/asistia";
import type { AuthUser } from "@/types/auth";

interface TicketFormProps {
  categories: AsistiaCategory[];
  locations: AsistiaLocation[];
  isTechnician: boolean;
  user: AuthUser;
  onSubmit: (input: {
    type: AsistiaTicketType;
    subject: string;
    description: string;
    categoryId: number;
    locationId?: number;
    assignedTechnicianId?: number;
    requesterId?: number;
  }) => Promise<void>;
}

type FormErrors = Partial<Record<"category" | "description" | "technician", string>>;

const DESCRIPTION_MIN_LENGTH = 12;
const TECHNICIAN_EMPTY_OPTION = { value: "", label: "Seleccione un TI" };
const REQUESTER_EMPTY_OPTION = { value: "", label: "Seleccione solicitante" };

function defaultRequesterId(user: AuthUser, isTechnician: boolean): string {
  if (isTechnician) return "";
  return user.id ? String(user.id) : "";
}

function defaultTechnicianId(user: AuthUser, isTechnician: boolean): string {
  if (isTechnician && user.id) return String(user.id);
  return "";
}

export function TicketForm({ categories, locations, isTechnician, user, onSubmit }: TicketFormProps) {
  const [ticketType, setTicketType] = useState<AsistiaTicketType>("request");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [technicianId, setTechnicianId] = useState(() => defaultTechnicianId(user, isTechnician));
  const [requesterId, setRequesterId] = useState(() => defaultRequesterId(user, isTechnician));
  const [locationId, setLocationId] = useState(user.locationId ? String(user.locationId) : "");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const categoryOptions = useMemo(() => buildCategoryOptions(categories), [categories]);
  const locationOptions = useMemo(() => buildLocationOptions(locations), [locations]);
  const showLocationField = locations.length > 0 && (isTechnician || !user.locationId);
  const defaultTechnicianOption = useMemo<SearchableSelectOption | null>(() => {
    if (!isTechnician || !user.id) return null;
    const label = user.name || user.login;
    return {
      value: String(user.id),
      label,
      searchText: `${user.name} ${user.login} ${user.email ?? ""}`.toLowerCase(),
    };
  }, [isTechnician, user.id, user.name, user.login, user.email]);

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

  const loadRequesterOptions = useCallback(async (query: string, signal: AbortSignal) => {
    const result = await searchUsers(query, undefined, { signal });
    return result.items.map(
      (requester): SearchableSelectOption => ({
        value: String(requester.id),
        label: requester.fullName || requester.login,
        searchText: `${requester.fullName} ${requester.login} ${requester.email ?? ""}`.toLowerCase(),
      }),
    );
  }, []);

  const resolveRequesterOption = useCallback(async (value: string, signal: AbortSignal) => {
    const requester = await getUserById(Number(value), { signal });
    return {
      value: String(requester.id),
      label: requester.fullName || requester.login,
      searchText: `${requester.fullName} ${requester.login}`.toLowerCase(),
    };
  }, []);

  const errors = useMemo<FormErrors>(() => {
    const nextErrors: FormErrors = {};
    if (!categoryId) {
      nextErrors.category = "Seleccione una categoría.";
    }
    if (stripHtml(description).length < DESCRIPTION_MIN_LENGTH) {
      nextErrors.description = `La descripción debe tener al menos ${DESCRIPTION_MIN_LENGTH} caracteres.`;
    }
    if (isTechnician && !technicianId) {
      nextErrors.technician = "Seleccione el técnico asignado.";
    }
    return nextErrors;
  }, [categoryId, description, isTechnician, technicianId]);

  const canSubmit = Object.keys(errors).length === 0 && !submitting;

  const resetForm = (clearFeedback = true) => {
    setTicketType("request");
    setCategoryId("");
    setDescription("");
    setTechnicianId(defaultTechnicianId(user, isTechnician));
    setRequesterId(defaultRequesterId(user, isTechnician));
    setLocationId(user.locationId ? String(user.locationId) : "");
    if (clearFeedback) {
      setSubmitError("");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const selectedCategory = categories.find((category) => String(category.id) === categoryId);
      const subject = selectedCategory?.fullPath || selectedCategory?.name || "";

      await onSubmit({
        type: ticketType,
        subject,
        description,
        categoryId: Number(categoryId),
        locationId: locationId ? Number(locationId) : undefined,
        assignedTechnicianId: technicianId ? Number(technicianId) : undefined,
        requesterId: requesterId ? Number(requesterId) : undefined,
      });
      resetForm(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo crear el ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-5 rounded-md border bg-card p-4 shadow-soft" onSubmit={handleSubmit}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Crear ticket</h2>
        <Badge variant={ticketType === "incident" ? "danger" : "success"}>
          {ticketType === "incident" ? "Incidente" : "Solicitud"}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {!isTechnician ? (
          <div className="rounded-md border bg-muted/40 p-3">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{user.email ?? user.login}</p>
          </div>
        ) : null}

        <Field id="ticket-type" label="Tipo">
          <div className="grid grid-cols-3 gap-2">
            {(["request", "incident"] as AsistiaTicketType[]).map((type) => (
              <Button
                key={type}
                type="button"
                variant={ticketType === type ? "default" : "outline"}
                onClick={() => setTicketType(type)}
                className="w-full"
              >
                {type === "incident" ? "Incidente" : "Solicitud"}
              </Button>
            ))}
            <Button type="button" variant="outline" disabled className="w-full">
              Requerimiento
            </Button>
          </div>
        </Field>

        {isTechnician ? (
          <Field id="ticket-requester" label="Solicitante">
            <ServerSearchableSelect
              id="ticket-requester"
              value={requesterId}
              onChange={setRequesterId}
              onLoadOptions={loadRequesterOptions}
              resolveSelectedOption={resolveRequesterOption}
              placeholder="Seleccione solicitante"
              searchPlaceholder="Buscar usuario..."
              emptyOption={REQUESTER_EMPTY_OPTION}
            />
          </Field>
        ) : null}

        <Field id="ticket-category" label="Categoría" error={errors.category}>
          <SearchableSelect
            id="ticket-category"
            value={categoryId}
            onChange={setCategoryId}
            options={categoryOptions}
            placeholder="Seleccione una categoría"
            searchPlaceholder="Buscar categoría..."
            emptyOption={{ value: "", label: "Seleccione una categoría" }}
            aria-describedby={errors.category ? "ticket-category-error" : undefined}
          />
        </Field>

        {isTechnician ? (
          <Field id="ticket-technician" label="Técnico" error={errors.technician}>
            <ServerSearchableSelect
              id="ticket-technician"
              value={technicianId}
              onChange={setTechnicianId}
              onLoadOptions={loadTechnicianOptions}
              resolveSelectedOption={resolveTechnicianOption}
              defaultSelectedOption={defaultTechnicianOption}
              placeholder="Seleccione un TI"
              searchPlaceholder="Buscar técnico..."
              emptyOption={TECHNICIAN_EMPTY_OPTION}
              aria-describedby={errors.technician ? "ticket-technician-error" : undefined}
            />
          </Field>
        ) : null}

        {showLocationField ? (
          <Field id="ticket-location" label="Ubicación">
            <SearchableSelect
              id="ticket-location"
              value={locationId}
              onChange={setLocationId}
              options={locationOptions}
              placeholder="Seleccione una ubicación"
              searchPlaceholder="Buscar ubicación..."
              emptyOption={{ value: "", label: "Seleccione una ubicación" }}
            />
          </Field>
        ) : null}
      </div>

      <Field id="ticket-description" label="Descripción" error={errors.description}>
        <RichDescriptionEditor
          id="ticket-description"
          value={description}
          onChange={setDescription}
          describedBy={errors.description ? "ticket-description-error" : undefined}
          disabled={submitting}
        />
      </Field>

      {submitError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {submitError}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={() => resetForm()} disabled={submitting}>
          <Eraser className="h-4 w-4" aria-hidden="true" />
          Limpiar
        </Button>

        <Button type="submit" disabled={!canSubmit}>
          {submitting ? (
            <Loading label="Creando" className="text-primary-foreground" />
          ) : (
            <>
              <SendHorizontal className="h-4 w-4" aria-hidden="true" />
              Crear ticket
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
