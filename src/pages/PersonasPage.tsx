/**
 * @file PersonasPage.tsx
 * @description CRUD de personas del módulo Portería.
 */
import { Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  activarPersona,
  desactivarPersona,
  eliminarPersona,
  obtenerFotoPersonaBlob,
  type Persona,
} from "@/api/personas";
import { ApiError } from "@/api/apiClient";
import { PersonaFormDialog } from "@/components/personas/PersonaFormDialog";
import { PersonasFilters } from "@/components/personas/PersonasFilters";
import { PersonasTable } from "@/components/personas/PersonasTable";
import { PorteriaTabs } from "@/components/porteria/PorteriaTabs";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { useToast } from "@/context/ToastContext";
import { usePersonas } from "@/hooks/usePersonas";
import {
  isPorteriaAllPageSize,
  parsePorteriaPageSize,
  PORTERIA_PAGE_SIZE_ALL,
  PORTERIA_PAGE_SIZE_OPTIONS,
} from "@/lib/porteria";
import { PORTERIA_TAB_PATHS, resolvePorteriaTab } from "@/lib/porteria-navigation";
import type { PorteriaTab } from "@/types/pages/porteria-page.types";

/** CRUD de personas con filtros, orden y paginación. */
export default function PersonasPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const tab = resolvePorteriaTab(location.pathname);
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
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [photoViewOpen, setPhotoViewOpen] = useState(false);
  const [photoViewPersona, setPhotoViewPersona] = useState<Persona | null>(null);
  const [photoViewUrl, setPhotoViewUrl] = useState<string | null>(null);
  const [photoViewLoading, setPhotoViewLoading] = useState(false);
  const photoViewUrlRef = useRef<string | null>(null);

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
      revokePhotoViewUrl(photoViewUrlRef.current);
    };
  }, [revokePhotoViewUrl]);

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
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback(
    (persona: Persona) => {
      setEditing(persona);
      setDialogOpen(true);
    },
    [],
  );

  const openConfirm = useCallback((persona: Persona, action: "activate" | "deactivate" | "delete") => {
    setConfirmPersona(persona);
    setConfirmAction(action);
    setConfirmOpen(true);
  }, []);

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Portería</p>
          <h1 className="text-lg font-semibold">Personas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registro de visitantes y personal para el control de acceso.
          </p>
        </div>

        <div className="flex w-full shrink-0 items-center gap-2 sm:ml-auto sm:w-auto">
          <PorteriaTabs
            value={tab}
            onChange={(nextTab: PorteriaTab) => navigate(PORTERIA_TAB_PATHS[nextTab])}
          />
        </div>
      </div>

      <PersonasFilters
        filters={filters}
        onChange={setFilters}
        onApply={applyFilters}
        actions={
          <Button type="button" className="w-full sm:w-auto" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nueva persona
          </Button>
        }
      />

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

      <PersonaFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        persona={editing}
        onSaved={async (_, mode) => {
          if (mode === "create") {
            setPage(1);
          }
          await reload();
        }}
      />

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
            ? `¿Eliminar definitivamente a ${confirmPersona?.nombre}? Solo es posible si no tiene visitas registradas.`
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
