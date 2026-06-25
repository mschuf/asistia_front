/**
 * @file VisitasPage.tsx
 * @description CRUD de visitas del módulo Portería.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import {
  actualizarVisita,
  crearVisita,
  eliminarVisita,
  finalizarVisita,
  listarVisitasActivas,
  requiereCancelacionAlEliminar,
  subirFotoVisita,
  type CrearVisitaPayload,
  type Visita,
  type VisitaEstado,
} from "@/api/visitas";
import { obtenerPersona, type Persona } from "@/api/personas";
import { PersonaFormDialog } from "@/components/personas/PersonaFormDialog";
import { ApiError } from "@/api/apiClient";
import { VisitasFilters } from "@/components/visitas/VisitasFilters";
import { VisitasTable } from "@/components/visitas/VisitasTable";
import { VisitaTarjetaColorSelector } from "@/components/visitas/VisitaTarjetaColorSelector";
import { VisitaWebcamCapture } from "@/components/visitas/VisitaWebcamCapture";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  ServerSearchableSelect,
  type ServerSearchableSelectHandle,
} from "@/components/ui/server-searchable-select";
import type { SearchableSelectOption } from "@/components/ui/searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/context/ToastContext";
import { useRegisterPorteriaRefresh } from "@/context/PorteriaRefreshContext";
import { useVisitas } from "@/hooks/useVisitas";
import {
  buildPersonaLabel,
  loadVisitPersonCandidateOptions,
  parsePersonaSelectValue,
  resolveCandidateOption,
  toPersonaSelectValue,
} from "@/lib/porteria-personas";
import {
  loadMotivoVisitaSelectOptions,
  parseMotivoVisitaSelectValue,
  resolveMotivoVisitaSelectOption,
  toMotivoVisitaSelectValue,
} from "@/lib/porteria-motivos-visita";
import {
  loadResponsableCandidateOptions,
  parseResponsableSelectValue,
  resolveResponsableCandidateOption,
  resolveResponsableFullName,
  toResponsableSelectValue,
} from "@/lib/visitas-responsables";
import { personaTieneProveedorValido } from "@/lib/porteria-proveedores";
import {
  isVisitaTarjetaColor,
  resolveZonasFromTarjetaColor,
  type VisitaTarjetaColor,
} from "@/lib/visita-tarjeta-color";
import {
  credencialOcupadaMessage,
  getCredencialesOcupadas,
  isCredencialOcupada,
  normalizeCredencialNumero,
} from "@/lib/visita-credencial";
import {
  findVisitaActivaDePersona,
  personaEnVisitaActivaMessage,
} from "@/lib/visita-persona-activa";
import {
  isPorteriaAllPageSize,
  parsePorteriaPageSize,
  PORTERIA_PAGE_SIZE_ALL,
  PORTERIA_PAGE_SIZE_OPTIONS,
} from "@/lib/porteria";

interface VisitaFormState {
  personaId: string;
  motivoVisitaId: string;
  responsableValue: string;
  estado: VisitaEstado;
  credencialNumero: string;
  tarjetaColor: VisitaTarjetaColor | "";
  entradaAt: string;
  salidaAt: string;
  observaciones: string;
}

interface VisitaRequiredErrors {
  personaId: boolean;
  motivoVisitaId: boolean;
  responsableValue: boolean;
  credencialNumero: boolean;
}

const EMPTY_FORM: VisitaFormState = {
  personaId: "",
  motivoVisitaId: "",
  responsableValue: "",
  estado: "activa",
  credencialNumero: "",
  tarjetaColor: "",
  entradaAt: "",
  salidaAt: "",
  observaciones: "",
};

const EMPTY_REQUIRED_ERRORS: VisitaRequiredErrors = {
  personaId: false,
  motivoVisitaId: false,
  responsableValue: false,
  credencialNumero: false,
};
const TARJETA_COLOR_LABEL_ID = "visita-tarjeta-color-label";

/** Convierte ISO a valor para input datetime-local. */
function toDateTimeInput(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/** Convierte datetime-local a ISO8601 para la API. */
function fromDateTimeInput(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

/** Extrae HH:mm de un valor datetime-local. */
function toTimeInput(value: string): string {
  if (!value) return "";
  const timePart = value.split("T")[1];
  return timePart?.slice(0, 5) ?? "";
}

/** Actualiza solo la hora de un valor datetime-local conservando la fecha. */
function withTime(value: string, time: string): string {
  const datePart = value.includes("T") ? value.split("T")[0]! : toDateTimeInput(new Date().toISOString()).split("T")[0]!;
  return `${datePart}T${time}`;
}

/** Valores por defecto de entrada y salida al abrir el modal de creación. */
function defaultCreateDateTimes(): Pick<VisitaFormState, "entradaAt" | "salidaAt"> {
  const now = new Date();
  const entradaAt = toDateTimeInput(now.toISOString());
  const datePart = entradaAt.split("T")[0]!;
  return {
    entradaAt,
    salidaAt: `${datePart}T18:00`,
  };
}

/** CRUD de visitas con filtros, orden y paginación. */
export default function VisitasPage() {
  const toast = useToast();
  const {
    items,
    filters,
    setFilters,
    applyFilters,
    sort,
    setSortColumn,
    pagination,
    setPage,
    setPageLimit,
    loading,
    error,
    reload,
  } = useVisitas();

  useRegisterPorteriaRefresh(reload, loading);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [personaCreateOpen, setPersonaCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Visita | null>(null);
  const [confirmVisita, setConfirmVisita] = useState<Visita | null>(null);
  const [finalizeVisitaTarget, setFinalizeVisitaTarget] = useState<Visita | null>(null);
  const [finalizeObservaciones, setFinalizeObservaciones] = useState("");
  const [form, setForm] = useState<VisitaFormState>(EMPTY_FORM);
  const [visitasActivas, setVisitasActivas] = useState<Visita[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [finalizeLoading, setFinalizeLoading] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<File | null>(null);
  const [personaSelectedOption, setPersonaSelectedOption] = useState<SearchableSelectOption | null>(null);
  const [requiredErrors, setRequiredErrors] = useState<VisitaRequiredErrors>(EMPTY_REQUIRED_ERRORS);
  const personaRef = useRef<ServerSearchableSelectHandle | null>(null);
  const motivoRef = useRef<ServerSearchableSelectHandle | null>(null);
  const responsableRef = useRef<ServerSearchableSelectHandle | null>(null);
  const credencialRef = useRef<HTMLInputElement | null>(null);

  const numericLimit =
    typeof pagination.limit === "number" ? pagination.limit : PORTERIA_PAGE_SIZE_OPTIONS[0];
  const showingAll = isPorteriaAllPageSize(pagination.limit);
  const paginationFrom =
    pagination.total === 0 ? 0 : showingAll ? 1 : (pagination.page - 1) * numericLimit + 1;
  const paginationTo = showingAll
    ? pagination.total
    : Math.min(pagination.page * numericLimit, pagination.total);

  const loadPersonCandidateOptions = useCallback(
    (query: string, signal: AbortSignal) => loadVisitPersonCandidateOptions(query, signal),
    [],
  );

  const loadCreateResponsableOptions = useCallback(
    (query: string, signal: AbortSignal) => loadResponsableCandidateOptions(query, signal),
    [],
  );

  const resolvePersonCandidateOption = useCallback(
    (value: string, signal: AbortSignal) => resolveCandidateOption(value, signal),
    [],
  );

  const resolveCreateResponsableOption = useCallback(
    (value: string, signal: AbortSignal) => resolveResponsableCandidateOption(value, signal),
    [],
  );

  const resolveEditResponsableOption = useCallback(
    (value: string, signal: AbortSignal) =>
      resolveResponsableCandidateOption(value, signal, { allowLegacyText: true }),
    [],
  );

  const loadMotivoSelectOptions = useCallback(
    (query: string, signal: AbortSignal) => loadMotivoVisitaSelectOptions(query, signal),
    [],
  );

  const resolveMotivoSelectOption = useCallback(
    (value: string, signal: AbortSignal) => resolveMotivoVisitaSelectOption(value, signal),
    [],
  );

  const resolveEditMotivoSelectOption = useCallback(
    (value: string, signal: AbortSignal) =>
      resolveMotivoVisitaSelectOption(value, signal, { allowLegacyText: true }),
    [],
  );

  const refreshVisitasActivas = useCallback(async () => {
    try {
      const activas = await listarVisitasActivas();
      setVisitasActivas(activas);
    } catch {
      setVisitasActivas([]);
    }
  }, []);

  const occupiedCredenciales = useMemo(
    () => getCredencialesOcupadas(visitasActivas, editing?.id),
    [visitasActivas, editing?.id],
  );

  const openCreateDialog = useCallback(() => {
    setEditing(null);
    setCapturedPhoto(null);
    setPersonaCreateOpen(false);
    setPersonaSelectedOption(null);
    setRequiredErrors(EMPTY_REQUIRED_ERRORS);
    setForm({ ...EMPTY_FORM, ...defaultCreateDateTimes() });
    setDialogOpen(true);
    void refreshVisitasActivas();
  }, [refreshVisitasActivas]);

  const openEditDialog = useCallback(
    (visita: Visita) => {
      setEditing(visita);
      setPersonaCreateOpen(false);
      setPersonaSelectedOption(null);
      setRequiredErrors(EMPTY_REQUIRED_ERRORS);
      setForm({
        personaId: toPersonaSelectValue(visita.personaId),
        motivoVisitaId: visita.motivoVisitaId
          ? toMotivoVisitaSelectValue(visita.motivoVisitaId)
          : visita.motivo,
        responsableValue: visita.responsableNombre,
        estado: visita.estado,
        credencialNumero: visita.credencialNumero ?? "",
        tarjetaColor: isVisitaTarjetaColor(visita.tarjetaColor) ? visita.tarjetaColor : "",
        entradaAt: toDateTimeInput(visita.entradaAt),
        salidaAt: toDateTimeInput(visita.salidaAt),
        observaciones: visita.observaciones ?? "",
      });
      setDialogOpen(true);
      void refreshVisitasActivas();
    },
    [refreshVisitasActivas],
  );

  const handleTarjetaColorChange = useCallback((tarjetaColor: VisitaTarjetaColor) => {
    setForm((current) => ({
      ...current,
      tarjetaColor,
    }));
  }, []);

  const handlePersonaChange = useCallback(
    async (value: string) => {
      setForm((current) => ({ ...current, personaId: value }));
      setRequiredErrors((current) => ({ ...current, personaId: false }));

      if (editing) {
        return;
      }

      const personaId = parsePersonaSelectValue(value);
      if (personaId == null) {
        setForm((current) => ({
          ...current,
          motivoVisitaId: "",
          responsableValue: "",
        }));
        return;
      }

      try {
        const persona = await obtenerPersona(personaId);
        setForm((current) => {
          if (current.personaId !== value) {
            return current;
          }

          return {
            ...current,
            motivoVisitaId: persona.ultimoMotivo
              ? toMotivoVisitaSelectValue(persona.ultimoMotivo)
              : "",
            responsableValue: persona.ultimoResponsable
              ? toResponsableSelectValue(persona.ultimoResponsable)
              : "",
          };
        });
      } catch (personaError) {
        const message =
          personaError instanceof ApiError
            ? personaError.message
            : "No se pudieron cargar los últimos datos de la persona.";
        toast.error(message, "Visitas");
      }
    },
    [editing, toast],
  );

  const handlePersonaCreated = useCallback((persona: Persona) => {
    const value = toPersonaSelectValue(persona.id);
    setForm((current) => ({
      ...current,
      personaId: value,
      motivoVisitaId: "",
      responsableValue: "",
    }));
    setPersonaSelectedOption({
      value,
      label: buildPersonaLabel(persona.nombre, persona.documento),
      searchText: `${persona.nombre} ${persona.documento}`.toLowerCase(),
    });
    setRequiredErrors((current) => ({ ...current, personaId: false }));
    setPersonaCreateOpen(false);
  }, []);

  const handleSave = useCallback(async () => {
    const personaId = parsePersonaSelectValue(form.personaId);
    const motivoVisitaId = parseMotivoVisitaSelectValue(form.motivoVisitaId);
    const responsableValue = form.responsableValue.trim();
    const responsableId = parseResponsableSelectValue(form.responsableValue);
    const credencialNumero = normalizeCredencialNumero(form.credencialNumero);
    const nextRequiredErrors: VisitaRequiredErrors = {
      personaId: personaId == null,
      motivoVisitaId: motivoVisitaId == null,
      responsableValue: !responsableValue,
      credencialNumero: !credencialNumero,
    };
    setRequiredErrors(nextRequiredErrors);

    if (nextRequiredErrors.personaId) {
      toast.error("Seleccione una persona.", "Visitas");
      personaRef.current?.focusAndOpen();
      return;
    }
    if (nextRequiredErrors.motivoVisitaId) {
      toast.error("Seleccione un motivo de visita.", "Visitas");
      motivoRef.current?.focusAndOpen();
      return;
    }
    if (nextRequiredErrors.responsableValue) {
      toast.error("El responsable es obligatorio.", "Visitas");
      responsableRef.current?.focusAndOpen();
      return;
    }
    if (!editing && responsableId == null) {
      toast.error("Seleccione un responsable de GLPI.", "Visitas");
      responsableRef.current?.focusAndOpen();
      return;
    }
    if (nextRequiredErrors.credencialNumero) {
      toast.error("El número de tarjeta es obligatorio.", "Visitas");
      credencialRef.current?.focus();
      return;
    }
    if (!form.tarjetaColor) {
      toast.error("Seleccione el color de tarjeta.", "Visitas");
      const tarjetaColorLabel = document.getElementById(TARJETA_COLOR_LABEL_ID);
      tarjetaColorLabel?.focus();
      return;
    }
    if (personaId == null || motivoVisitaId == null) {
      return;
    }
    if (
      form.estado === "activa" &&
      credencialNumero &&
      isCredencialOcupada(credencialNumero, occupiedCredenciales)
    ) {
      toast.error(credencialOcupadaMessage(credencialNumero), "Visitas");
      return;
    }

    setSaving(true);
    try {
      const persona = await obtenerPersona(personaId);
      if (!personaTieneProveedorValido(persona.proveedorNombre)) {
        toast.error(
          "La persona seleccionada no tiene proveedor asignado. Edítela en Personas y seleccione un proveedor.",
          "Visitas",
        );
        return;
      }

      if (form.estado === "activa") {
        const entradaRef = form.entradaAt ? new Date(form.entradaAt) : new Date();
        const visitaActiva = findVisitaActivaDePersona(visitasActivas, personaId, editing?.id, entradaRef);
        if (visitaActiva) {
          toast.error(personaEnVisitaActivaMessage(visitaActiva.visitante, visitaActiva.id), "Visitas");
          return;
        }
      }

      const responsableNombre = editing
        ? (await resolveResponsableFullName(form.responsableValue)) || form.responsableValue.trim()
        : await resolveResponsableFullName(form.responsableValue);

      const isClosingVisit =
        editing != null && form.estado === "finalizada" && editing.estado !== "finalizada";

      const payload: CrearVisitaPayload = {
        personaId,
        motivoVisitaId,
        responsableNombre,
        responsableId: responsableId ?? undefined,
        estado: form.estado,
        zonasPermitidas: resolveZonasFromTarjetaColor(form.tarjetaColor),
        credencialNumero: credencialNumero || undefined,
        tarjetaColor: form.tarjetaColor,
        entradaAt: fromDateTimeInput(form.entradaAt),
        salidaAt: isClosingVisit ? new Date().toISOString() : fromDateTimeInput(form.salidaAt),
        observaciones: form.observaciones.trim() || undefined,
      };

      if (editing) {
        await actualizarVisita(editing.id, payload);
        toast.success("Visita actualizada.", "Visitas");
      } else {
        const visita = await crearVisita(payload);
        if (capturedPhoto) {
          try {
            await subirFotoVisita(visita.id, capturedPhoto);
          } catch (photoError) {
            const message =
              photoError instanceof ApiError
                ? photoError.message
                : "No se pudo guardar la foto de la visita.";
            toast.error(`${message} La visita fue creada igualmente.`, "Visitas");
          }
        }
        toast.success("Visita creada.", "Visitas");
      }

      setDialogOpen(false);
      await reload();
    } catch (saveError) {
      const message = saveError instanceof ApiError ? saveError.message : "No se pudo guardar la visita.";
      toast.error(message, "Visitas");
    } finally {
      setSaving(false);
    }
  }, [capturedPhoto, editing, form, occupiedCredenciales, reload, toast, visitasActivas]);

  const handleDelete = useCallback(async () => {
    if (!confirmVisita) return;

    setConfirmLoading(true);
    try {
      const result = await eliminarVisita(confirmVisita.id);
      toast.success(
        "cancelled" in result ? "Visita cancelada." : "Visita eliminada.",
        "Visitas",
      );
      setConfirmOpen(false);
      await reload();
    } catch (deleteError) {
      const message = deleteError instanceof ApiError ? deleteError.message : "No se pudo eliminar la visita.";
      toast.error(message, "Visitas");
    } finally {
      setConfirmLoading(false);
    }
  }, [confirmVisita, reload, toast]);

  const handleFinalizar = useCallback(async () => {
    if (!finalizeVisitaTarget) return;

    setFinalizeLoading(true);
    try {
      await finalizarVisita(finalizeVisitaTarget.id, finalizeObservaciones);
      toast.success("Visita finalizada.", "Visitas");
      setFinalizeOpen(false);
      await reload();
    } catch (finalizeError) {
      const message =
        finalizeError instanceof ApiError ? finalizeError.message : "No se pudo finalizar la visita.";
      toast.error(message, "Visitas");
    } finally {
      setFinalizeLoading(false);
    }
  }, [finalizeObservaciones, finalizeVisitaTarget, reload, toast]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full min-w-0 flex-1">
          <VisitasFilters
            filters={filters}
            onChange={setFilters}
            onApply={applyFilters}
            onCreateVisit={openCreateDialog}
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      {loading ? (
        <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground shadow-soft">
          Cargando visitas…
        </div>
      ) : (
        <VisitasTable
          rows={items}
          sortColumn={sort?.column ?? null}
          sortOrder={sort?.order ?? null}
          onSortColumnChange={setSortColumn}
          onEdit={openEditDialog}
          onFinalizar={(visita) => {
            setFinalizeVisitaTarget(visita);
            setFinalizeObservaciones(visita.observaciones ?? "");
            setFinalizeOpen(true);
          }}
          onDelete={(visita) => {
            setConfirmVisita(visita);
            setConfirmOpen(true);
          }}
        />
      )}

      {pagination.total > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="whitespace-nowrap">Mostrar por página</span>
              <Select
                aria-label="Mostrar por página"
                className="h-9 w-24 shrink-0 px-2 py-1 text-center text-sm font-medium tabular-nums text-foreground"
                value={showingAll ? PORTERIA_PAGE_SIZE_ALL : String(pagination.limit)}
                onChange={(event) => {
                  const nextLimit = parsePorteriaPageSize(event.target.value);
                  if (nextLimit) setPageLimit(nextLimit);
                }}
              >
                {PORTERIA_PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
                <option value={PORTERIA_PAGE_SIZE_ALL}>Todos</option>
              </Select>
            </label>
            <p className="text-sm text-muted-foreground">
              Mostrando {paginationFrom}-{paginationTo} de {pagination.total} visitas
            </p>
          </div>
          {!showingAll ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPage(pagination.page - 1)}
              >
                Anterior
              </Button>
              <span className="min-w-24 text-center text-sm text-muted-foreground">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage(pagination.page + 1)}
              >
                Siguiente
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setCapturedPhoto(null);
            setPersonaCreateOpen(false);
            setRequiredErrors(EMPTY_REQUIRED_ERRORS);
          }
        }}
        title={editing ? "Editar visita" : "Nueva visita"}
        description={
          editing
            ? "Edite el ingreso y los permisos de la visita."
            : "Registre el ingreso y los permisos de la visita."
        }
        className="max-h-[calc(100dvh-2rem)] max-w-4xl"
      >
        <form
          className="min-w-0 space-y-4"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
        >
          <Field id="visita-persona" label="Persona" required>
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-0 flex-1">
                <ServerSearchableSelect
                  ref={personaRef}
                  id="visita-persona"
                  value={form.personaId}
                  onChange={(value) => {
                    void handlePersonaChange(value);
                  }}
                  onLoadOptions={loadPersonCandidateOptions}
                  resolveSelectedOption={resolvePersonCandidateOption}
                  defaultSelectedOption={personaSelectedOption}
                  placeholder="Seleccionar persona"
                  searchPlaceholder="Buscar por nombre…"
                  noResultsText="Sin resultados"
                  loadingText="Buscando…"
                  disabled={saving}
                  invalid={requiredErrors.personaId}
                />
              </div>
              {!editing ? (
                <Button
                  type="button"
                  onClick={() => setPersonaCreateOpen(true)}
                  disabled={saving}
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Nueva persona
                </Button>
              ) : null}
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="visita-motivo" label="Motivo" className="sm:col-span-2" required>
              <ServerSearchableSelect
                ref={motivoRef}
                id="visita-motivo"
                value={form.motivoVisitaId}
                onChange={(value) => {
                  setForm((current) => ({ ...current, motivoVisitaId: value }));
                  setRequiredErrors((current) => ({ ...current, motivoVisitaId: false }));
                }}
                onLoadOptions={loadMotivoSelectOptions}
                resolveSelectedOption={editing ? resolveEditMotivoSelectOption : resolveMotivoSelectOption}
                placeholder="Seleccionar motivo"
                searchPlaceholder="Buscar motivo…"
                noResultsText="Sin resultados"
                loadingText="Buscando…"
                disabled={saving}
                invalid={requiredErrors.motivoVisitaId}
              />
            </Field>
            <Field id="visita-responsable" label="Responsable" required>
              <ServerSearchableSelect
                ref={responsableRef}
                id="visita-responsable"
                value={form.responsableValue}
                onChange={(value) => {
                  setForm((current) => ({ ...current, responsableValue: value }));
                  setRequiredErrors((current) => ({ ...current, responsableValue: false }));
                }}
                onLoadOptions={loadCreateResponsableOptions}
                resolveSelectedOption={
                  editing ? resolveEditResponsableOption : resolveCreateResponsableOption
                }
                placeholder="Seleccionar responsable"
                searchPlaceholder="Buscar usuario GLPI…"
                noResultsText="Sin resultados"
                loadingText="Buscando…"
                disabled={saving}
                invalid={requiredErrors.responsableValue}
              />
            </Field>
            {editing ? (
              <Field id="visita-estado" label="Estado">
                <Select
                  id="visita-estado"
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value as VisitaEstado })}
                >
                  <option value="programada">Programada</option>
                  <option value="activa">Activa</option>
                  <option value="finalizada">Finalizada</option>
                  <option value="cancelada">Cancelada</option>
                </Select>
              </Field>
            ) : null}
            <Field id="visita-credencial" label="Número de Tarjeta" required>
              <Input
                ref={credencialRef}
                id="visita-credencial"
                value={form.credencialNumero}
                onChange={(e) => {
                  setForm((current) => ({ ...current, credencialNumero: e.target.value }));
                  setRequiredErrors((current) => ({ ...current, credencialNumero: false }));
                }}
                className={
                  requiredErrors.credencialNumero
                    ? "border-destructive focus-visible:ring-destructive"
                    : undefined
                }
              />
            </Field>
            <Field id="visita-entrada" label="Entrada">
              <Input
                id="visita-entrada"
                type="time"
                value={toTimeInput(form.entradaAt)}
                onChange={(e) => setForm({ ...form, entradaAt: withTime(form.entradaAt, e.target.value) })}
              />
            </Field>
            <Field id="visita-salida" label="Salida">
              <Input
                id="visita-salida"
                type="time"
                value={toTimeInput(form.salidaAt)}
                onChange={(e) => setForm({ ...form, salidaAt: withTime(form.salidaAt, e.target.value) })}
              />
            </Field>
          </div>

          <VisitaTarjetaColorSelector
            labelId={TARJETA_COLOR_LABEL_ID}
            value={form.tarjetaColor}
            onChange={handleTarjetaColorChange}
            disabled={saving}
          />

          {!editing ? (
            <VisitaWebcamCapture
              onCapture={setCapturedPhoto}
              disabled={saving}
            />
          ) : null}

          <Field id="visita-observaciones" label="Observaciones">
            <Textarea
              id="visita-observaciones"
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
              rows={2}
              className="min-h-10 h-10"
            />
          </Field>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear visita"}
            </Button>
          </div>
        </form>
      </Dialog>

      <PersonaFormDialog
        open={personaCreateOpen}
        onOpenChange={setPersonaCreateOpen}
        onSaved={(persona, mode) => {
          if (mode === "create") {
            handlePersonaCreated(persona);
          }
        }}
        toastScope="Visitas"
        stacked
        captureEscape
      />

      <Dialog
        open={finalizeOpen}
        onOpenChange={(open) => {
          setFinalizeOpen(open);
          if (!open) {
            setFinalizeVisitaTarget(null);
            setFinalizeObservaciones("");
          }
        }}
        title="Finalizar visita"
        description={`¿Registrar la salida de ${finalizeVisitaTarget?.visitante} (visita #${finalizeVisitaTarget?.id})?`}
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            La hora de salida se registrará al momento de confirmar:{" "}
            <span className="font-medium tabular-nums text-foreground">
              {new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
            </span>
            .
          </p>
          <Field id="finalizar-observaciones" label="Observaciones">
            <Textarea
              id="finalizar-observaciones"
              value={finalizeObservaciones}
              onChange={(e) => setFinalizeObservaciones(e.target.value)}
              rows={3}
              placeholder="Notas sobre la salida o la visita…"
              disabled={finalizeLoading}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setFinalizeOpen(false)} disabled={finalizeLoading}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void handleFinalizar()} disabled={finalizeLoading}>
              {finalizeLoading ? "Finalizando…" : "Finalizar visita"}
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setConfirmVisita(null);
        }}
        title={
          confirmVisita && requiereCancelacionAlEliminar(confirmVisita.estado)
            ? "Eliminar visita activa"
            : "Eliminar visita"
        }
        description={
          confirmVisita && requiereCancelacionAlEliminar(confirmVisita.estado)
            ? `¿Eliminar la visita #${confirmVisita.id} - ${confirmVisita.visitante}? Pasará al estado Cancelada.`
            : `¿Eliminar permanentemente la visita #${confirmVisita?.id} - ${confirmVisita?.visitante}? La acción no se puede deshacer.`
        }
      >
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)} disabled={confirmLoading}>
            Cancelar
          </Button>
          <Button type="button" variant="destructive" onClick={() => void handleDelete()} disabled={confirmLoading}>
            {confirmLoading ? "Eliminando…" : "Eliminar"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
