/**
 * @file TicketForm.tsx
 * @description Formulario de creación de tickets con catálogos y adjuntos.
 */
import { Eraser, SendHorizontal } from "lucide-react";
import { FormEvent, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Loading } from "@/components/ui/loading";
import { SearchableSelect } from "@/components/ui/searchable-select";
import type { SearchableSelectHandle, SearchableSelectOption } from "@/components/ui/searchable-select";
import { ServerSearchableSelect } from "@/components/ui/server-searchable-select";
import type { ServerSearchableSelectHandle } from "@/components/ui/server-searchable-select";
import { RichDescriptionEditor } from "@/components/tickets/RichDescriptionEditor";
import type { RichDescriptionEditorHandle } from "@/components/tickets/RichDescriptionEditor";
import { TicketAttachmentsField } from "@/components/tickets/TicketAttachmentsField";
import { validateAttachmentSelection } from "@/lib/attachments";
import {
  createDefaultTicketDescription,
  buildCategoryOptions,
  buildLocationOptions,
  buildRequesterDisplayLabel,
  buildTechnicianSelectOptions,
  getTicketDescriptionValidationContent,
  findLocationById,
  locationDisplayName,
  typeLabel,
  updateTicketDescriptionPrefix,
} from "@/lib/tickets";
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
    attachments?: File[];
  }) => Promise<void>;
}

type FormErrors = Partial<Record<"category" | "description" | "technician" | "attachments", string>>;

const DESCRIPTION_MIN_LENGTH = 12;
const TECHNICIAN_EMPTY_OPTION = { value: "", label: "Seleccione un TI" };
const REQUESTER_EMPTY_OPTION = { value: "", label: "Seleccione solicitante" };

/** @param user - Usuario autenticado. @param isTechnician - Si es técnico. @returns ID solicitante por defecto. */
function defaultRequesterId(user: AuthUser, isTechnician: boolean): string {
  if (isTechnician) return "";
  return user.id ? String(user.id) : "";
}

/** @param user - Usuario autenticado. @param isTechnician - Si es técnico. @returns ID técnico por defecto. */
function defaultTechnicianId(user: AuthUser, isTechnician: boolean): string {
  if (isTechnician && user.id) return String(user.id);
  return "";
}

/**
 * Formulario controlado para crear tickets con validación y adjuntos.
 * @param props - Catálogos, rol de usuario y callback onSubmit.
 * @returns Formulario de creación de ticket.
 */
export function TicketForm({ categories, locations, isTechnician, user, onSubmit }: TicketFormProps) {
  const [ticketType, setTicketType] = useState<AsistiaTicketType>("request");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState(() => createDefaultTicketDescription());
  const [technicianId, setTechnicianId] = useState(() => defaultTechnicianId(user, isTechnician));
  const [requesterId, setRequesterId] = useState(() => defaultRequesterId(user, isTechnician));
  const [locationId, setLocationId] = useState(user.locationId ? String(user.locationId) : "");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const requesterRef = useRef<ServerSearchableSelectHandle>(null);
  const categoryRef = useRef<SearchableSelectHandle>(null);
  const descriptionRef = useRef<RichDescriptionEditorHandle>(null);
  const pendingDescriptionFocusRef = useRef(false);

  const categoryOptions = useMemo(() => buildCategoryOptions(categories), [categories]);
  const locationOptions = useMemo(() => buildLocationOptions(locations), [locations]);
  const showLocationField = locations.length > 0 && (isTechnician || !user.locationId);
  const effectiveType = isTechnician ? ticketType : "request";
  const selectedCategory = useMemo(
    () => categories.find((category) => String(category.id) === categoryId) ?? null,
    [categories, categoryId],
  );
  const defaultTechnicianOption = useMemo<SearchableSelectOption | null>(() => {
    if (!isTechnician || !user.id) return null;
    const location = findLocationById(locations, user.locationId);
    const locationName = location ? locationDisplayName(location) : "";
    const label = buildRequesterDisplayLabel(
      { fullName: user.name, login: user.login, locationId: user.locationId },
      locations,
    );
    return {
      value: String(user.id),
      label,
      searchText: `${user.name} ${user.login} ${user.email ?? ""} ${locationName}`.toLowerCase(),
    };
  }, [isTechnician, locations, user.email, user.id, user.locationId, user.login, user.name]);

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
      if (!technician.isActive) {
        return null;
      }
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

  const errors = useMemo<FormErrors>(() => {
    const nextErrors: FormErrors = {};
    if (!categoryId) {
      nextErrors.category = "Seleccione una categoría.";
    }
    const validationContent = getTicketDescriptionValidationContent(
      description,
      effectiveType,
      selectedCategory,
    );
    if (validationContent.length < DESCRIPTION_MIN_LENGTH) {
      nextErrors.description = `Su descripción debe tener al menos ${DESCRIPTION_MIN_LENGTH} caracteres.`;
    }
    if (isTechnician && !technicianId) {
      nextErrors.technician = "Seleccione el técnico asignado.";
    }
    const attachmentError = validateAttachmentSelection(attachments);
    if (attachmentError) {
      nextErrors.attachments = attachmentError;
    }
    return nextErrors;
  }, [attachments, categoryId, description, effectiveType, isTechnician, selectedCategory, technicianId]);

  const canSubmit = Object.keys(errors).length === 0 && !submitting;
  const createActionLabel = useMemo(
    () => `Crear ${typeLabel(effectiveType).toLowerCase()}`,
    [effectiveType],
  );

  /** @returns void */
  const focusInitialField = useCallback(() => {
    if (isTechnician) {
      requesterRef.current?.focusAndOpen();
      return;
    }
    categoryRef.current?.focusAndOpen();
  }, [isTechnician]);

  useLayoutEffect(() => {
    focusInitialField();
  }, [focusInitialField]);

  /** @param value - ID del solicitante. @returns void */
  const handleRequesterChange = (value: string) => {
    setRequesterId(value);
    if (value) {
      window.requestAnimationFrame(() => categoryRef.current?.focusAndOpen());
    }
  };

  /** @param value - ID de categoría. @returns void */
  const handleCategoryChange = (value: string) => {
    const nextCategory = categories.find((category) => String(category.id) === value) ?? null;
    setDescription((current) =>
      updateTicketDescriptionPrefix(
        current,
        effectiveType,
        selectedCategory,
        effectiveType,
        nextCategory,
      ),
    );
    setCategoryId(value);
    pendingDescriptionFocusRef.current = Boolean(value);
  };

  /** @param type - Tipo de ticket. @returns void */
  const handleTicketTypeChange = (type: AsistiaTicketType) => {
    setDescription((current) =>
      updateTicketDescriptionPrefix(current, ticketType, selectedCategory, type, selectedCategory),
    );
    setTicketType(type);
  };

  useLayoutEffect(() => {
    if (!pendingDescriptionFocusRef.current || !categoryId) {
      return;
    }

    pendingDescriptionFocusRef.current = false;
    window.requestAnimationFrame(() => {
      descriptionRef.current?.focusAtEnd();
    });
  }, [categoryId, description]);

  /** @param fullDescription - HTML completo del editor. @returns void */
  const handleDescriptionChange = (fullDescription: string) => {
    setDescription(fullDescription);
  };

  /** @param clearFeedback - Si limpia errores de submit. @returns void */
  const resetForm = (clearFeedback = true) => {
    setTicketType("request");
    setCategoryId("");
    setDescription(createDefaultTicketDescription());
    setTechnicianId(defaultTechnicianId(user, isTechnician));
    setRequesterId(defaultRequesterId(user, isTechnician));
    setLocationId(user.locationId ? String(user.locationId) : "");
    setAttachments([]);
    if (clearFeedback) {
      setSubmitError("");
    }
    focusInitialField();
  };

  /** @param event - Submit del formulario. @returns void */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const subject = selectedCategory?.fullPath || selectedCategory?.name || "";
      await onSubmit({
        type: effectiveType,
        subject,
        description,
        categoryId: Number(categoryId),
        locationId: locationId ? Number(locationId) : undefined,
        assignedTechnicianId: technicianId ? Number(technicianId) : undefined,
        requesterId: requesterId ? Number(requesterId) : undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
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
        <h2 className="text-lg font-semibold">{createActionLabel}</h2>
        <Badge variant={ticketType === "incident" ? "danger" : "success"}>
          {ticketType === "incident" ? "Incidente" : "Solicitud"}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {isTechnician ? (
          <Field id="ticket-type" label="Tipo">
            <div className="grid grid-cols-3 gap-2">
              {(["request", "incident"] as AsistiaTicketType[]).map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={ticketType === type ? "default" : "outline"}
                  onClick={() => handleTicketTypeChange(type)}
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
        ) : null}

        {isTechnician ? (
          <Field id="ticket-requester" label="Solicitante">
            <ServerSearchableSelect
              ref={requesterRef}
              id="ticket-requester"
              value={requesterId}
              onChange={handleRequesterChange}
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
            ref={categoryRef}
            id="ticket-category"
            value={categoryId}
            onChange={handleCategoryChange}
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
          ref={descriptionRef}
          id="ticket-description"
          value={description}
          onChange={handleDescriptionChange}
          describedBy={errors.description ? "ticket-description-error" : undefined}
          disabled={submitting}
        />
      </Field>

      <TicketAttachmentsField
        files={attachments}
        onChange={setAttachments}
        disabled={submitting}
        error={errors.attachments}
      />

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
              {createActionLabel}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
