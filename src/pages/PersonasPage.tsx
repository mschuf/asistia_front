/**
 * @file PersonasPage.tsx
 * @description CRUD de personas del módulo Portería.
 */
import { Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  activarPersona,
  actualizarPersona,
  crearPersona,
  desactivarPersona,
  eliminarFotoPersona,
  eliminarPersona,
  obtenerFotoPersonaBlob,
  previewPersonaFromGlpi,
  searchVisitPersonCandidates,
  subirFotoPersona,
  type CrearPersonaPayload,
  type Persona,
} from "@/api/personas";
import { ApiError } from "@/api/apiClient";
import { PersonaPhotoField } from "@/components/personas/PersonaPhotoField";
import { PersonasFilters } from "@/components/personas/PersonasFilters";
import { PersonasTable } from "@/components/personas/PersonasTable";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { SearchableSelectOption } from "@/components/ui/searchable-select";
import {
  ServerSearchableSelect,
  type ServerSearchableSelectHandle,
} from "@/components/ui/server-searchable-select";
import { useToast } from "@/context/ToastContext";
import { usePersonas } from "@/hooks/usePersonas";
import {
  buildCandidateLabel,
  parseCandidateValue,
  toCandidateValue,
} from "@/lib/porteria-personas";
import {
  isPorteriaAllPageSize,
  parsePorteriaPageSize,
  PORTERIA_PAGE_SIZE_ALL,
  PORTERIA_PAGE_SIZE_OPTIONS,
} from "@/lib/porteria";

interface PersonaFormState {
  nombre: string;
  documento: string;
  empresa: string;
  email: string;
  telefono: string;
  activo: boolean;
}

const EMPTY_FORM: PersonaFormState = {
  nombre: "",
  documento: "",
  empresa: "",
  email: "",
  telefono: "",
  activo: true,
};

const PERSONA_PHOTO_MAX_INPUT_BYTES = 50 * 1024 * 1024;
const PERSONA_PHOTO_ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

type TieneGlpiChoice = "si" | "no";

/** CRUD de personas con filtros, orden y paginación. */
export default function PersonasPage() {
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
  } = usePersonas();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editing, setEditing] = useState<Persona | null>(null);
  const [confirmPersona, setConfirmPersona] = useState<Persona | null>(null);
  const [confirmAction, setConfirmAction] = useState<"activate" | "deactivate" | "delete" | null>(null);
  const [form, setForm] = useState<PersonaFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [tieneGlpi, setTieneGlpi] = useState<TieneGlpiChoice>("no");
  const [glpiUserId, setGlpiUserId] = useState<number | null>(null);
  const [glpiSelectValue, setGlpiSelectValue] = useState("");
  const [glpiPreviewLoading, setGlpiPreviewLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [removeExistingPhoto, setRemoveExistingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [photoLoading, setPhotoLoading] = useState(false);
  const glpiSelectRef = useRef<ServerSearchableSelectHandle>(null);
  const photoPreviewUrlRef = useRef<string | null>(null);
  const [photoViewOpen, setPhotoViewOpen] = useState(false);
  const [photoViewPersona, setPhotoViewPersona] = useState<Persona | null>(null);
  const [photoViewUrl, setPhotoViewUrl] = useState<string | null>(null);
  const [photoViewLoading, setPhotoViewLoading] = useState(false);
  const photoViewUrlRef = useRef<string | null>(null);

  const revokePhotoPreview = useCallback((url: string | null) => {
    if (url?.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }, []);

  const resetPhotoState = useCallback(() => {
    revokePhotoPreview(photoPreviewUrlRef.current);
    photoPreviewUrlRef.current = null;
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
    setRemoveExistingPhoto(false);
    setPhotoError("");
    setPhotoLoading(false);
  }, [revokePhotoPreview]);

  const revokePhotoViewUrl = useCallback((url: string | null) => {
    if (url?.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }, []);

  const closePhotoView = useCallback(() => {
    setPhotoViewOpen(false);
    revokePhotoViewUrl(photoViewUrlRef.current);
    photoViewUrlRef.current = null;
    setPhotoViewUrl(null);
    setPhotoViewPersona(null);
    setPhotoViewLoading(false);
  }, [revokePhotoViewUrl]);

  const openPhotoView = useCallback(
    (persona: Persona) => {
      setPhotoViewPersona(persona);
      setPhotoViewOpen(true);
      setPhotoViewLoading(true);
      revokePhotoViewUrl(photoViewUrlRef.current);
      photoViewUrlRef.current = null;
      setPhotoViewUrl(null);

      void obtenerFotoPersonaBlob(persona.id)
        .then((blob) => {
          const objectUrl = URL.createObjectURL(blob);
          photoViewUrlRef.current = objectUrl;
          setPhotoViewUrl(objectUrl);
        })
        .catch(() => {
          toast.error("No se pudo cargar la foto de la persona.", "Personas");
          closePhotoView();
        })
        .finally(() => {
          setPhotoViewLoading(false);
        });
    },
    [closePhotoView, revokePhotoViewUrl, toast],
  );

  useEffect(() => {
    return () => {
      revokePhotoPreview(photoPreviewUrlRef.current);
      revokePhotoViewUrl(photoViewUrlRef.current);
    };
  }, [revokePhotoPreview, revokePhotoViewUrl]);

  useEffect(() => {
    if (!editing && tieneGlpi === "si") {
      window.requestAnimationFrame(() => {
        glpiSelectRef.current?.focusAndOpen();
      });
    }
  }, [editing, tieneGlpi]);

  const numericLimit =
    typeof pagination.limit === "number" ? pagination.limit : PORTERIA_PAGE_SIZE_OPTIONS[0];
  const showingAll = isPorteriaAllPageSize(pagination.limit);
  const paginationFrom =
    pagination.total === 0 ? 0 : showingAll ? 1 : (pagination.page - 1) * numericLimit + 1;
  const paginationTo = showingAll
    ? pagination.total
    : Math.min(pagination.page * numericLimit, pagination.total);

  const openCreateDialog = useCallback(() => {
    setEditing(null);
    setForm(EMPTY_FORM);
    resetPhotoState();
    setTieneGlpi("no");
    setGlpiUserId(null);
    setGlpiSelectValue("");
    setGlpiPreviewLoading(false);
    setDialogOpen(true);
  }, [resetPhotoState]);

  const loadGlpiUserOptions = useCallback(async (query: string, signal: AbortSignal) => {
    const result = await searchVisitPersonCandidates(query, 20, { signal });
    return result.items
      .filter((candidate) => candidate.source === "glpi")
      .map((candidate): SearchableSelectOption => {
        const value = toCandidateValue("glpi", candidate.id);
        const label = buildCandidateLabel(candidate);
        return {
          value,
          label,
          searchText: `${candidate.fullName} ${candidate.subtitle}`.toLowerCase(),
        };
      });
  }, []);

  const resolveGlpiUserOption = useCallback(
    async (value: string, signal: AbortSignal): Promise<SearchableSelectOption | null> => {
      const parsed = parseCandidateValue(value);
      if (!parsed || parsed.source !== "glpi") {
        return null;
      }

      const result = await searchVisitPersonCandidates("", 50, { signal });
      const match = result.items.find(
        (candidate) => candidate.source === "glpi" && candidate.id === parsed.id,
      );
      if (match) {
        return {
          value: toCandidateValue("glpi", match.id),
          label: buildCandidateLabel(match),
          searchText: `${match.fullName} ${match.subtitle}`.toLowerCase(),
        };
      }

      return {
        value: toCandidateValue("glpi", parsed.id),
        label: `Usuario GLPI #${parsed.id}`,
        searchText: String(parsed.id),
      };
    },
    [],
  );

  const handleGlpiUserSelect = useCallback(
    async (value: string) => {
      setGlpiSelectValue(value);

      const parsed = parseCandidateValue(value);
      if (!parsed || parsed.source !== "glpi") {
        setGlpiUserId(null);
        return;
      }

      setGlpiPreviewLoading(true);
      try {
        const preview = await previewPersonaFromGlpi(parsed.id);
        setGlpiUserId(preview.glpiUserId);
        setForm({
          nombre: preview.nombre,
          documento: "",
          empresa: preview.empresa ?? "",
          email: preview.email ?? "",
          telefono: preview.telefono ?? "",
          activo: true,
        });
      } catch (previewError) {
        setGlpiUserId(null);
        setGlpiSelectValue("");
        const message =
          previewError instanceof ApiError
            ? previewError.message
            : "No se pudieron cargar los datos del usuario GLPI.";
        toast.error(message, "Personas");
      } finally {
        setGlpiPreviewLoading(false);
      }
    },
    [toast],
  );

  const handleTieneGlpiChange = useCallback((choice: TieneGlpiChoice) => {
    setTieneGlpi(choice);
    if (choice === "no") {
      setGlpiUserId(null);
      setGlpiSelectValue("");
      setGlpiPreviewLoading(false);
      setForm(EMPTY_FORM);
    }
  }, []);

  const openEditDialog = useCallback(
    (persona: Persona) => {
      resetPhotoState();
      setEditing(persona);
      setForm({
        nombre: persona.nombre,
        documento: persona.documento,
        empresa: persona.empresa ?? "",
        email: persona.email ?? "",
        telefono: persona.telefono ?? "",
        activo: persona.activo,
      });
      setDialogOpen(true);

      if (!persona.hasFoto) {
        return;
      }

      setPhotoLoading(true);
      void obtenerFotoPersonaBlob(persona.id)
        .then((blob) => {
          const objectUrl = URL.createObjectURL(blob);
          photoPreviewUrlRef.current = objectUrl;
          setPhotoPreviewUrl(objectUrl);
        })
        .catch(() => {
          toast.error("No se pudo cargar la foto de la persona.", "Personas");
        })
        .finally(() => {
          setPhotoLoading(false);
        });
    },
    [resetPhotoState, toast],
  );

  const handlePhotoSelect = useCallback(
    (file: File) => {
      if (!PERSONA_PHOTO_ACCEPTED_TYPES.has(file.type) && !file.type.startsWith("image/")) {
        setPhotoError("Seleccioná un archivo de imagen válido (JPG, PNG, WEBP o GIF).");
        return;
      }

      if (file.size > PERSONA_PHOTO_MAX_INPUT_BYTES) {
        setPhotoError("La imagen supera el tamaño máximo de 50 MB antes de procesarse.");
        return;
      }

      revokePhotoPreview(photoPreviewUrlRef.current);
      const objectUrl = URL.createObjectURL(file);
      photoPreviewUrlRef.current = objectUrl;
      setPhotoFile(file);
      setPhotoPreviewUrl(objectUrl);
      setRemoveExistingPhoto(false);
      setPhotoError("");
    },
    [revokePhotoPreview],
  );

  const handlePhotoRemove = useCallback(() => {
    revokePhotoPreview(photoPreviewUrlRef.current);
    photoPreviewUrlRef.current = null;
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
    setRemoveExistingPhoto(Boolean(editing?.hasFoto));
    setPhotoError("");
  }, [editing?.hasFoto, revokePhotoPreview]);

  const openConfirm = useCallback((persona: Persona, action: "activate" | "deactivate" | "delete") => {
    setConfirmPersona(persona);
    setConfirmAction(action);
    setConfirmOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!form.nombre.trim() || !form.documento.trim()) {
      toast.error("Nombre y documento son obligatorios.", "Personas");
      return;
    }

    if (photoError) {
      toast.error(photoError, "Personas");
      return;
    }

    setSaving(true);
    try {
      const payload: CrearPersonaPayload = {
        nombre: form.nombre.trim(),
        documento: form.documento.trim(),
        empresa: form.empresa.trim() || undefined,
        email: form.email.trim() || undefined,
        telefono: form.telefono.trim() || undefined,
        activo: form.activo,
        ...(glpiUserId != null ? { glpiUserId } : {}),
      };

      let savedPersona: Persona;
      if (editing) {
        savedPersona = await actualizarPersona(editing.id, payload);
      } else {
        savedPersona = await crearPersona(payload);
      }

      if (editing && removeExistingPhoto && editing.hasFoto && !photoFile) {
        savedPersona = await eliminarFotoPersona(savedPersona.id);
      }

      if (photoFile) {
        savedPersona = await subirFotoPersona(savedPersona.id, photoFile);
      }

      toast.success(editing ? "Persona actualizada." : "Persona creada.", "Personas");
      setDialogOpen(false);
      resetPhotoState();
      await reload();
    } catch (saveError) {
      const message = saveError instanceof ApiError ? saveError.message : "No se pudo guardar la persona.";
      toast.error(message, "Personas");
    } finally {
      setSaving(false);
    }
  }, [editing, form, glpiUserId, photoError, photoFile, reload, removeExistingPhoto, resetPhotoState, toast]);

  const handleConfirm = useCallback(async () => {
    if (!confirmPersona || !confirmAction) return;

    setConfirmLoading(true);
    try {
      if (confirmAction === "activate") {
        await activarPersona(confirmPersona.id);
        toast.success("Persona activada.", "Personas");
      } else if (confirmAction === "deactivate") {
        await desactivarPersona(confirmPersona.id);
        toast.success("Persona desactivada.", "Personas");
      } else {
        await eliminarPersona(confirmPersona.id);
        toast.success("Persona eliminada.", "Personas");
      }
      setConfirmOpen(false);
      await reload();
    } catch (confirmError) {
      const message =
        confirmError instanceof ApiError ? confirmError.message : "No se pudo completar la acción.";
      toast.error(message, "Personas");
    } finally {
      setConfirmLoading(false);
    }
  }, [confirmAction, confirmPersona, reload, toast]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Portería</p>
          <h1 className="text-lg font-semibold">Personas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registro de visitantes y personal para el control de acceso.
          </p>
        </div>
        <Button type="button" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nueva persona
        </Button>
      </div>

      <PersonasFilters filters={filters} onChange={setFilters} onApply={applyFilters} />

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      {loading ? (
        <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground shadow-soft">
          Cargando personas…
        </div>
      ) : (
        <PersonasTable
          rows={items}
          sortColumn={sort?.column ?? null}
          sortOrder={sort?.order ?? null}
          onSortColumnChange={setSortColumn}
          onEdit={openEditDialog}
          onViewPhoto={openPhotoView}
          onActivate={(persona) => openConfirm(persona, "activate")}
          onDeactivate={(persona) => openConfirm(persona, "deactivate")}
          onDelete={(persona) => openConfirm(persona, "delete")}
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
              Mostrando {paginationFrom}-{paginationTo} de {pagination.total} personas
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
        onOpenChange={setDialogOpen}
        title={editing ? "Editar persona" : "Nueva persona"}
        description="Complete los datos del visitante o empleado."
        contentClassName={editing ? undefined : "overflow-visible"}
        allowOverflow={!editing}
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
        >
          {!editing ? (
            <div className="space-y-3 rounded-md border bg-muted/30 p-4">
              <fieldset>
                <legend className="text-sm font-medium">¿Tiene usuario de GLPI?</legend>
                <div className="mt-2 flex flex-wrap gap-4">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="persona-tiene-glpi"
                      value="si"
                      checked={tieneGlpi === "si"}
                      onChange={() => handleTieneGlpiChange("si")}
                      className="h-4 w-4 accent-primary"
                    />
                    Sí
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="persona-tiene-glpi"
                      value="no"
                      checked={tieneGlpi === "no"}
                      onChange={() => handleTieneGlpiChange("no")}
                      className="h-4 w-4 accent-primary"
                    />
                    No
                  </label>
                </div>
              </fieldset>
              {tieneGlpi === "si" ? (
                <Field id="persona-glpi-usuario" label="Usuario GLPI">
                  <ServerSearchableSelect
                    ref={glpiSelectRef}
                    id="persona-glpi-usuario"
                    value={glpiSelectValue}
                    onChange={(value) => void handleGlpiUserSelect(value)}
                    onLoadOptions={loadGlpiUserOptions}
                    resolveSelectedOption={resolveGlpiUserOption}
                    placeholder="Seleccionar usuario GLPI"
                    searchPlaceholder="Buscar por nombre…"
                    noResultsText="Sin resultados"
                    disabled={glpiPreviewLoading}
                  />
                  {glpiPreviewLoading ? (
                    <p className="mt-1 text-xs text-muted-foreground">Cargando datos de GLPI…</p>
                  ) : null}
                </Field>
              ) : null}
            </div>
          ) : null}
          <PersonaPhotoField
            previewUrl={photoPreviewUrl}
            onSelectFile={handlePhotoSelect}
            onRemove={handlePhotoRemove}
            disabled={saving || photoLoading}
            showCameraButton={Boolean(editing)}
            error={photoError}
          />
          {photoLoading ? (
            <p className="text-xs text-muted-foreground">Cargando foto existente…</p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="persona-nombre" label="Nombre">
              <Input
                id="persona-nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
              />
            </Field>
            <Field id="persona-documento" label="Documento">
              <Input
                id="persona-documento"
                value={form.documento}
                onChange={(e) => setForm({ ...form, documento: e.target.value })}
                required
              />
            </Field>
            <Field id="persona-empresa" label="Empresa">
              <Input
                id="persona-empresa"
                value={form.empresa}
                onChange={(e) => setForm({ ...form, empresa: e.target.value })}
              />
            </Field>
            <Field id="persona-email" label="Email">
              <Input
                id="persona-email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field id="persona-telefono" label="Teléfono">
              <Input
                id="persona-telefono"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              />
            </Field>
            {editing ? (
              <Field id="persona-activo" label="Estado">
                <Select
                  id="persona-activo"
                  value={form.activo ? "true" : "false"}
                  onChange={(e) => setForm({ ...form, activo: e.target.value === "true" })}
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </Select>
              </Field>
            ) : null}
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear persona"}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={photoViewOpen}
        onOpenChange={(open) => {
          if (!open) closePhotoView();
        }}
        title={photoViewPersona ? `Foto — ${photoViewPersona.nombre}` : "Foto"}
        contentClassName="flex items-center justify-center"
      >
        {photoViewLoading ? (
          <p className="py-8 text-sm text-muted-foreground">Cargando foto…</p>
        ) : photoViewUrl ? (
          <img
            src={photoViewUrl}
            alt={`Foto de ${photoViewPersona?.nombre ?? "persona"}`}
            className="max-h-[min(60vh,480px)] w-auto max-w-full rounded-md object-contain"
          />
        ) : null}
      </Dialog>

      <Dialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={
          confirmAction === "delete"
            ? "Eliminar persona"
            : confirmAction === "activate"
              ? "Activar persona"
              : "Desactivar persona"
        }
        description={
          confirmAction === "delete"
            ? `¿Eliminar definitivamente a ${confirmPersona?.nombre}? Solo es posible si no tiene visitas activas.`
            : confirmAction === "activate"
              ? `¿Activar a ${confirmPersona?.nombre}? Podrá usarse nuevamente en visitas.`
              : `¿Desactivar a ${confirmPersona?.nombre}? No podrá usarse en nuevas visitas.`
        }
      >
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)} disabled={confirmLoading}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant={confirmAction === "delete" ? "destructive" : "default"}
            onClick={() => void handleConfirm()}
            disabled={confirmLoading}
          >
            {confirmLoading
              ? "Procesando…"
              : confirmAction === "delete"
                ? "Eliminar"
                : confirmAction === "activate"
                  ? "Activar"
                  : "Desactivar"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
