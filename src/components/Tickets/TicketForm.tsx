import { CheckCircle2, Eraser, SendHorizontal } from "lucide-react";
import { FormEvent, useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/ui/loading";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { ServerSearchableSelect } from "@/components/ui/server-searchable-select";
import type { SearchableSelectOption } from "@/components/ui/searchable-select";
import { Badge } from "@/components/ui/badge";
import { RichDescriptionEditor } from "@/components/tickets/RichDescriptionEditor";
import { buildCategoryOptions, buildLocationOptions } from "@/lib/tickets";
import { stripHtml } from "@/lib/utils";
import { searchTechnicians } from "@/services/ticketsService";
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
  }) => Promise<string>;
}

type FormErrors = Partial<Record<"subject" | "category" | "description" | "technician", string>>;

const DESCRIPTION_MIN_LENGTH = 12;
const TECHNICIAN_EMPTY_OPTION = { value: "", label: "Seleccione un TI" };

export function TicketForm({ categories, locations, isTechnician, user, onSubmit }: TicketFormProps) {
  const [ticketType, setTicketType] = useState<AsistiaTicketType>("request");
  const [subject, setSubject] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [locationId, setLocationId] = useState(user.locationId ? String(user.locationId) : "");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  const categoryOptions = useMemo(() => buildCategoryOptions(categories), [categories]);
  const locationOptions = useMemo(() => buildLocationOptions(locations), [locations]);
  const requiresManualLocation = !user.locationId && locations.length > 0;

  const loadTechnicianOptions = useCallback(async (query: string, _signal: AbortSignal) => {
    const result = await searchTechnicians(query);
    return result.items.map(
      (technician): SearchableSelectOption => ({
        value: String(technician.id),
        label: technician.fullName || technician.login,
        searchText: `${technician.fullName} ${technician.login} ${technician.email ?? ""}`.toLowerCase()
      })
    );
  }, []);

  const resolveTechnicianOption = useCallback(async (value: string, _signal: AbortSignal) => {
    const result = await searchTechnicians();
    const technician = result.items.find((item) => String(item.id) === value);
    if (!technician) return null;
    return {
      value: String(technician.id),
      label: technician.fullName || technician.login,
      searchText: `${technician.fullName} ${technician.login}`.toLowerCase()
    };
  }, []);

  const errors = useMemo<FormErrors>(() => {
    const nextErrors: FormErrors = {};

    if (!subject.trim()) {
      nextErrors.subject = "Ingrese un título para el ticket.";
    }

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
  }, [categoryId, description, isTechnician, subject, technicianId]);

  const canSubmit = Object.keys(errors).length === 0 && !submitting;

  const resetForm = (clearFeedback = true) => {
    setTicketType("request");
    setSubject("");
    setCategoryId("");
    setDescription("");
    setTechnicianId("");
    setLocationId(user.locationId ? String(user.locationId) : "");
    if (clearFeedback) {
      setSubmitMessage("");
      setSubmitError("");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setSubmitError("");
    setSubmitMessage("");

    try {
      const message = await onSubmit({
        type: ticketType,
        subject: subject.trim(),
        description,
        categoryId: Number(categoryId),
        locationId: locationId ? Number(locationId) : undefined,
        assignedTechnicianId: technicianId ? Number(technicianId) : undefined
      });
      setSubmitMessage(message);
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
          <div className="grid grid-cols-2 gap-2">
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
          </div>
        </Field>

        <Field id="ticket-subject" label="Título" error={errors.subject}>
          <Input
            id="ticket-subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Resumen del requerimiento"
            aria-describedby={errors.subject ? "ticket-subject-error" : undefined}
          />
        </Field>

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
              placeholder="Seleccione un TI"
              searchPlaceholder="Buscar técnico..."
              emptyOption={TECHNICIAN_EMPTY_OPTION}
              aria-describedby={errors.technician ? "ticket-technician-error" : undefined}
            />
          </Field>
        ) : null}

        {requiresManualLocation ? (
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
      {submitMessage ? (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          <span>{submitMessage}</span>
        </div>
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
