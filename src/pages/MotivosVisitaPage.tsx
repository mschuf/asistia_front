/**
 * @file MotivosVisitaPage.tsx
 * @description CRUD de motivos de visita del módulo Portería.
 */
import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  activarMotivoVisita,
  actualizarMotivoVisita,
  crearMotivoVisita,
  desactivarMotivoVisita,
  eliminarMotivoVisita,
  type CrearMotivoVisitaPayload,
  type MotivoVisita,
} from "@/api/motivos-visita";
import { ApiError } from "@/api/apiClient";
import { MotivosVisitaFilters } from "@/components/motivos-visita/MotivosVisitaFilters";
import { MotivosVisitaTable } from "@/components/motivos-visita/MotivosVisitaTable";
import { PorteriaTabs } from "@/components/porteria/PorteriaTabs";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/context/ToastContext";
import { useMotivosVisita } from "@/hooks/useMotivosVisita";
import {
  isPorteriaAllPageSize,
  parsePorteriaPageSize,
  PORTERIA_PAGE_SIZE_ALL,
  PORTERIA_PAGE_SIZE_OPTIONS,
} from "@/lib/porteria";
import { PORTERIA_TAB_PATHS, resolvePorteriaTab } from "@/lib/porteria-navigation";
import type { PorteriaTab } from "@/types/pages/porteria-page.types";

interface MotivoVisitaFormState {
  nombre: string;
  activo: boolean;
}

const EMPTY_FORM: MotivoVisitaFormState = {
  nombre: "",
  activo: true,
};

/** CRUD de motivos de visita con filtros, orden y paginación. */
export default function MotivosVisitaPage() {
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
  } = useMotivosVisita();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editing, setEditing] = useState<MotivoVisita | null>(null);
  const [confirmMotivo, setConfirmMotivo] = useState<MotivoVisita | null>(null);
  const [confirmAction, setConfirmAction] = useState<"activate" | "deactivate" | "delete" | null>(null);
  const [form, setForm] = useState<MotivoVisitaFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

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
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((motivo: MotivoVisita) => {
    setEditing(motivo);
    setForm({
      nombre: motivo.nombre,
      activo: motivo.activo,
    });
    setDialogOpen(true);
  }, []);

  const openConfirm = useCallback(
    (motivo: MotivoVisita, action: "activate" | "deactivate" | "delete") => {
      setConfirmMotivo(motivo);
      setConfirmAction(action);
      setConfirmOpen(true);
    },
    [],
  );

  const handleSave = useCallback(async () => {
    if (!form.nombre.trim()) {
      toast.error("El nombre es obligatorio.", "Motivos de visita");
      return;
    }

    setSaving(true);
    try {
      const payload: CrearMotivoVisitaPayload = {
        nombre: form.nombre.trim(),
        activo: form.activo,
      };

      if (editing) {
        await actualizarMotivoVisita(editing.id, payload);
      } else {
        await crearMotivoVisita(payload);
      }

      toast.success(editing ? "Motivo actualizado." : "Motivo creado.", "Motivos de visita");
      setDialogOpen(false);
      await reload();
    } catch (saveError) {
      const message =
        saveError instanceof ApiError ? saveError.message : "No se pudo guardar el motivo de visita.";
      toast.error(message, "Motivos de visita");
    } finally {
      setSaving(false);
    }
  }, [editing, form, reload, toast]);

  const handleConfirm = useCallback(async () => {
    if (!confirmMotivo || !confirmAction) return;

    setConfirmLoading(true);
    try {
      if (confirmAction === "activate") {
        await activarMotivoVisita(confirmMotivo.id);
        toast.success("Motivo activado.", "Motivos de visita");
      } else if (confirmAction === "deactivate") {
        await desactivarMotivoVisita(confirmMotivo.id);
        toast.success("Motivo desactivado.", "Motivos de visita");
      } else {
        await eliminarMotivoVisita(confirmMotivo.id);
        toast.success("Motivo eliminado.", "Motivos de visita");
      }
      setConfirmOpen(false);
      await reload();
    } catch (confirmError) {
      const message =
        confirmError instanceof ApiError ? confirmError.message : "No se pudo completar la acción.";
      toast.error(message, "Motivos de visita");
    } finally {
      setConfirmLoading(false);
    }
  }, [confirmAction, confirmMotivo, reload, toast]);

  const confirmTitle =
    confirmAction === "activate"
      ? "Activar motivo de visita"
      : confirmAction === "deactivate"
        ? "Desactivar motivo de visita"
        : "Eliminar motivo de visita";

  const confirmDescription =
    confirmAction === "activate"
      ? `¿Activar "${confirmMotivo?.nombre}"?`
      : confirmAction === "deactivate"
        ? `¿Desactivar "${confirmMotivo?.nombre}"?`
        : `¿Eliminar permanentemente "${confirmMotivo?.nombre}"? Solo es posible si no tiene visitas asociadas.`;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Portería</p>
          <h1 className="text-lg font-semibold">Motivos de visita</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Catálogo de motivos para registrar visitas de proveedores al frigorífico.
          </p>
        </div>

        <div className="flex w-full shrink-0 items-center gap-2 sm:ml-auto sm:w-auto">
          <PorteriaTabs
            value={tab}
            onChange={(nextTab: PorteriaTab) => navigate(PORTERIA_TAB_PATHS[nextTab])}
          />
        </div>
      </div>

      <MotivosVisitaFilters
        filters={filters}
        onChange={setFilters}
        onApply={applyFilters}
        actions={
          <Button type="button" className="w-full sm:w-auto" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nuevo motivo
          </Button>
        }
      />

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      {loading ? (
        <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground shadow-soft">
          Cargando motivos de visita…
        </div>
      ) : (
        <MotivosVisitaTable
          rows={items}
          sortColumn={sort?.column ?? null}
          sortOrder={sort?.order ?? null}
          onSortColumnChange={setSortColumn}
          onEdit={openEditDialog}
          onActivate={(motivo) => openConfirm(motivo, "activate")}
          onDeactivate={(motivo) => openConfirm(motivo, "deactivate")}
          onDelete={(motivo) => openConfirm(motivo, "delete")}
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
              Mostrando {paginationFrom}-{paginationTo} de {pagination.total} motivos
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
        title={editing ? "Editar motivo de visita" : "Nuevo motivo de visita"}
        description="Registre el motivo por el cual un proveedor puede ingresar."
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
        >
          <Field id="motivo-visita-nombre" label="Nombre">
            <Input
              id="motivo-visita-nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              required
            />
          </Field>
          {editing ? (
            <Field id="motivo-visita-activo" label="Estado">
              <Select
                id="motivo-visita-activo"
                value={form.activo ? "true" : "false"}
                onChange={(e) => setForm({ ...form, activo: e.target.value === "true" })}
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </Select>
            </Field>
          ) : null}
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear motivo"}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={confirmTitle}
        description={confirmDescription}
      >
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)} disabled={confirmLoading}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant={confirmAction === "delete" ? "destructive" : "default"}
            onClick={() => void handleConfirm()}
            disabled={confirmLoading}
          >
            {confirmLoading ? "Procesando…" : "Confirmar"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
