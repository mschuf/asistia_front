/**
 * @file PersonaFormDialog.tsx
 * @description Modal reutilizable para crear y editar personas del módulo Portería.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import {
  actualizarPersona,
  crearPersona,
  eliminarFotoPersona,
  obtenerFotoPersonaBlob,
  subirFotoPersona,
  type CrearPersonaPayload,
  type Persona,
} from "@/api/personas";
import { ApiError } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  ServerSearchableSelect,
  type ServerSearchableSelectHandle,
} from "@/components/ui/server-searchable-select";
import { useToast } from "@/context/ToastContext";
import {
  loadProveedorSelectOptions,
  resolveProveedorSelectOption,
} from "@/lib/porteria-proveedores";
import { PersonaCreatePhotoField } from "./PersonaCreatePhotoField";
import { PersonaMrzScannerDialog } from "@/components/personas/PersonaMrzScannerDialog";
import { PersonaPhotoField } from "./PersonaPhotoField";

interface PersonaFormState {
  nombre: string;
  documento: string;
  proveedorId: string;
  email: string;
  telefono: string;
  activo: boolean;
}

interface PersonaRequiredErrors {
  nombre: boolean;
  documento: boolean;
  proveedorId: boolean;
}

const EMPTY_FORM: PersonaFormState = {
  nombre: "",
  documento: "",
  proveedorId: "",
  email: "",
  telefono: "",
  activo: true,
};

const EMPTY_REQUIRED_ERRORS: PersonaRequiredErrors = {
  nombre: false,
  documento: false,
  proveedorId: false,
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

interface PersonaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  persona?: Persona | null;
  onSaved?: (persona: Persona, mode: "create" | "edit") => void | Promise<void>;
  toastScope?: string;
  stacked?: boolean;
  captureEscape?: boolean;
}

/**
 * Modal con formulario completo de persona (alta/edición) y gestión de foto.
 */
export function PersonaFormDialog({
  open,
  onOpenChange,
  persona = null,
  onSaved,
  toastScope = "Personas",
  stacked = false,
  captureEscape = false,
}: PersonaFormDialogProps) {
  const toast = useToast();
  const editing = persona;
  const [form, setForm] = useState<PersonaFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [removeExistingPhoto, setRemoveExistingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const [photoLoading, setPhotoLoading] = useState(false);
  const [requiredErrors, setRequiredErrors] = useState<PersonaRequiredErrors>(EMPTY_REQUIRED_ERRORS);
  const [mrzScannerOpen, setMrzScannerOpen] = useState(false);
  const photoPreviewUrlRef = useRef<string | null>(null);
  const nombreRef = useRef<HTMLInputElement | null>(null);
  const documentoRef = useRef<HTMLInputElement | null>(null);
  const proveedorRef = useRef<ServerSearchableSelectHandle | null>(null);

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

  useEffect(() => {
    return () => {
      revokePhotoPreview(photoPreviewUrlRef.current);
    };
  }, [revokePhotoPreview]);

  useEffect(() => {
    if (!open) return;

    setRequiredErrors(EMPTY_REQUIRED_ERRORS);

    if (!editing) {
      setForm(EMPTY_FORM);
      setMrzScannerOpen(false);
      resetPhotoState();
      return;
    }

    setMrzScannerOpen(false);
    resetPhotoState();
    setForm({
      nombre: editing.nombre,
      documento: editing.documento,
      proveedorId: String(editing.proveedorId),
      email: editing.email ?? "",
      telefono: editing.telefono ?? "",
      activo: editing.activo,
    });

    if (!editing.hasFoto) {
      return;
    }

    setPhotoLoading(true);
    const controller = new AbortController();
    void obtenerFotoPersonaBlob(editing.id, { signal: controller.signal })
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        photoPreviewUrlRef.current = objectUrl;
        setPhotoPreviewUrl(objectUrl);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        if (error instanceof ApiError) {
          toast.error(error.message, toastScope);
          return;
        }
        toast.error("No se pudo cargar la foto de la persona.", toastScope);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setPhotoLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [editing, open, resetPhotoState, toast, toastScope]);

  useEffect(() => {
    if (!open || !captureEscape) return;

    const handleKeyDownCapture = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopImmediatePropagation();
      onOpenChange(false);
    };

    window.addEventListener("keydown", handleKeyDownCapture, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDownCapture, true);
    };
  }, [captureEscape, onOpenChange, open]);

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

  const handleSave = useCallback(async () => {
    const nombre = form.nombre.trim();
    const documento = form.documento.trim();
    const proveedorId = Number(form.proveedorId);
    const nextRequiredErrors: PersonaRequiredErrors = {
      nombre: !nombre,
      documento: !documento,
      proveedorId: !Number.isFinite(proveedorId) || proveedorId <= 0,
    };
    setRequiredErrors(nextRequiredErrors);

    if (nextRequiredErrors.nombre) {
      toast.error("Ingrese el nombre.", toastScope);
      nombreRef.current?.focus();
      return;
    }
    if (nextRequiredErrors.documento) {
      toast.error("Ingrese el documento.", toastScope);
      documentoRef.current?.focus();
      return;
    }
    if (nextRequiredErrors.proveedorId) {
      toast.error("Seleccione un proveedor.", toastScope);
      proveedorRef.current?.focusAndOpen();
      return;
    }

    if (photoError) {
      toast.error(photoError, toastScope);
      return;
    }

    setSaving(true);
    try {
      const payload: CrearPersonaPayload = {
        nombre,
        documento,
        proveedorId,
        email: form.email.trim() || undefined,
        telefono: form.telefono.trim() || undefined,
        activo: form.activo,
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
        try {
          savedPersona = await subirFotoPersona(savedPersona.id, photoFile);
        } catch (error) {
          const message =
            error instanceof ApiError
              ? error.message
              : "No se pudo guardar la foto de la persona.";
          const suffix = editing
            ? "La persona fue actualizada igualmente."
            : "La persona fue creada igualmente.";
          toast.error(`${message} ${suffix}`, toastScope);
        }
      }

      const mode = editing ? "edit" : "create";
      toast.success(editing ? "Persona actualizada." : "Persona creada.", toastScope);
      onOpenChange(false);
      resetPhotoState();
      await onSaved?.(savedPersona, mode);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo guardar la persona.";
      toast.error(message, toastScope);
    } finally {
      setSaving(false);
    }
  }, [
    editing,
    form,
    onOpenChange,
    onSaved,
    photoError,
    photoFile,
    removeExistingPhoto,
    resetPhotoState,
    toast,
    toastScope,
  ]);

  const handleMrzDetected = useCallback(
    ({ fullName, documentNumber }: { fullName: string; documentNumber: string }) => {
      setForm((current) => ({
        ...current,
        nombre: fullName || current.nombre,
        documento: documentNumber || current.documento,
      }));
      setRequiredErrors((current) => ({
        ...current,
        nombre: false,
        documento: false,
      }));
      toast.success("MRZ detectada. Datos completados automáticamente.", toastScope);
    },
    [toast, toastScope],
  );

  const dialog = (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Editar persona" : "Nueva persona"}
      description="Complete los datos del visitante."
      className={stacked ? "z-[60]" : undefined}
    >
      <form
        className="space-y-4"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void handleSave();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="persona-nombre" label="Nombre" required>
            <Input
              ref={nombreRef}
              id="persona-nombre"
              value={form.nombre}
              onChange={(event) => {
                setForm({ ...form, nombre: event.target.value });
                setRequiredErrors((current) => ({ ...current, nombre: false }));
              }}
              className={
                requiredErrors.nombre
                  ? "border-destructive focus-visible:ring-destructive"
                  : undefined
              }
            />
          </Field>
          <Field id="persona-documento" label="Documento" required>
            <div className="flex items-center gap-2">
              <Input
                ref={documentoRef}
                id="persona-documento"
                value={form.documento}
                onChange={(event) => {
                  setForm({ ...form, documento: event.target.value });
                  setRequiredErrors((current) => ({ ...current, documento: false }));
                }}
                className={
                  requiredErrors.documento
                    ? "border-destructive focus-visible:ring-destructive"
                    : undefined
                }
              />
              {!editing ? (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Escanear MRZ con cámara"
                  onClick={() => setMrzScannerOpen(true)}
                  disabled={saving}
                >
                  <Camera className="h-4 w-4" aria-hidden="true" />
                </Button>
              ) : null}
            </div>
          </Field>
          <Field id="persona-proveedor" label="Proveedor" required>
            <ServerSearchableSelect
              ref={proveedorRef}
              id="persona-proveedor"
              value={form.proveedorId}
              onChange={(value) => {
                setForm({ ...form, proveedorId: value });
                setRequiredErrors((current) => ({ ...current, proveedorId: false }));
              }}
              onLoadOptions={loadProveedorSelectOptions}
              resolveSelectedOption={resolveProveedorSelectOption}
              defaultSelectedOption={
                editing
                  ? { value: String(editing.proveedorId), label: editing.proveedorNombre }
                  : null
              }
              placeholder="Seleccione un proveedor"
              searchPlaceholder="Buscar proveedor..."
              invalid={requiredErrors.proveedorId}
            />
          </Field>
          <Field id="persona-email" label="Email">
            <Input
              id="persona-email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </Field>
          <Field id="persona-telefono" label="Teléfono">
            <Input
              id="persona-telefono"
              value={form.telefono}
              onChange={(event) => setForm({ ...form, telefono: event.target.value })}
            />
          </Field>
          {editing ? (
            <Field id="persona-activo" label="Estado">
              <Select
                id="persona-activo"
                value={form.activo ? "true" : "false"}
                onChange={(event) => setForm({ ...form, activo: event.target.value === "true" })}
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </Select>
            </Field>
          ) : null}
        </div>
        {!editing ? (
          <PersonaCreatePhotoField
            previewUrl={photoPreviewUrl}
            onSelectFile={handlePhotoSelect}
            onRemove={handlePhotoRemove}
            disabled={saving}
            error={photoError}
          />
        ) : (
          <>
            <PersonaPhotoField
              previewUrl={photoPreviewUrl}
              onSelectFile={handlePhotoSelect}
              onRemove={handlePhotoRemove}
              disabled={saving || photoLoading}
              showCameraButton
              error={photoError}
            />
            {photoLoading ? (
              <p className="text-xs text-muted-foreground">Cargando foto existente…</p>
            ) : null}
          </>
        )}
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear persona"}
          </Button>
        </div>
      </form>
    </Dialog>
  );

  if (!stacked) {
    return (
      <>
        {dialog}
        {!editing ? (
          <PersonaMrzScannerDialog
            open={mrzScannerOpen}
            onOpenChange={setMrzScannerOpen}
            onDetected={handleMrzDetected}
          />
        ) : null}
      </>
    );
  }

  return (
    <div className="relative z-[60]">
      {dialog}
      {!editing ? (
        <PersonaMrzScannerDialog
          open={mrzScannerOpen}
          onOpenChange={setMrzScannerOpen}
          onDetected={handleMrzDetected}
        />
      ) : null}
    </div>
  );
}
