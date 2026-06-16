/**
 * @file VisitasPage.tsx
 * @description CRUD de visitas del módulo Portería.
 */
import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { ensurePersonaFromGlpi } from "@/api/personas";
import {
  actualizarVisita,
  crearVisita,
  eliminarVisita,
  finalizarVisita,
  type CrearVisitaPayload,
  type Visita,
  type VisitaEstado,
  type VisitaZona,
} from "@/api/visitas";
import { ApiError } from "@/api/apiClient";
import { VisitasFilters } from "@/components/visitas/VisitasFilters";
import { VisitasTable } from "@/components/visitas/VisitasTable";
import { VisitaTarjetaColorSelector } from "@/components/visitas/VisitaTarjetaColorSelector";
import { VisitaZonasSelector } from "@/components/visitas/VisitaZonasSelector";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ServerSearchableSelect } from "@/components/ui/server-searchable-select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/context/ToastContext";
import { useRegisterPorteriaRefresh } from "@/context/PorteriaRefreshContext";
import { useVisitas } from "@/hooks/useVisitas";
import {
  loadVisitPersonCandidateOptions,
  parseCandidateValue,
  resolveCandidateFullName,
  resolveCandidateOption,
  toCandidateValue,
} from "@/lib/porteria-personas";
import {
  isVisitaTarjetaColor,
  resolveZonasFromTarjetaColor,
  type VisitaTarjetaColor,
} from "@/lib/visita-tarjeta-color";
import {
  isPorteriaAllPageSize,
  parsePorteriaPageSize,
  PORTERIA_PAGE_SIZE_ALL,
  PORTERIA_PAGE_SIZE_OPTIONS,
} from "@/lib/porteria";

interface VisitaFormState {
  personaId: string;
  motivo: string;
  responsableValue: string;
  estado: VisitaEstado;
  credencialNumero: string;
  tarjetaColor: VisitaTarjetaColor | "";
  entradaAt: string;
  salidaAt: string;
  observaciones: string;
  zonasPermitidas: VisitaZona[];
}

const EMPTY_FORM: VisitaFormState = {
  personaId: "",
  motivo: "",
  responsableValue: "",
  estado: "activa",
  credencialNumero: "",
  tarjetaColor: "",
  entradaAt: "",
  salidaAt: "",
  observaciones: "",
  zonasPermitidas: [],
};

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
  const [editing, setEditing] = useState<Visita | null>(null);
  const [confirmVisita, setConfirmVisita] = useState<Visita | null>(null);
  const [finalizeVisitaTarget, setFinalizeVisitaTarget] = useState<Visita | null>(null);
  const [finalizeObservaciones, setFinalizeObservaciones] = useState("");
  const [form, setForm] = useState<VisitaFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [finalizeLoading, setFinalizeLoading] = useState(false);

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

  const resolvePersonCandidateOption = useCallback(
    (value: string, signal: AbortSignal) => resolveCandidateOption(value, signal),
    [],
  );

  const resolveResponsableCandidateOption = useCallback(
    (value: string, signal: AbortSignal) => resolveCandidateOption(value, signal, { allowLegacyText: true }),
    [],
  );

  const openCreateDialog = useCallback(() => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }, []);

  const openEditDialog = useCallback((visita: Visita) => {
    setEditing(visita);
    setForm({
      personaId: toCandidateValue("postgres", visita.personaId),
      motivo: visita.motivo,
      responsableValue: visita.responsableNombre,
      estado: visita.estado,
      credencialNumero: visita.credencialNumero ?? "",
      tarjetaColor: isVisitaTarjetaColor(visita.tarjetaColor) ? visita.tarjetaColor : "",
      entradaAt: toDateTimeInput(visita.entradaAt),
      salidaAt: toDateTimeInput(visita.salidaAt),
      observaciones: visita.observaciones ?? "",
      zonasPermitidas: isVisitaTarjetaColor(visita.tarjetaColor)
        ? resolveZonasFromTarjetaColor(visita.tarjetaColor)
        : visita.zonasPermitidas,
    });
    setDialogOpen(true);
  }, []);

  const handleTarjetaColorChange = useCallback((tarjetaColor: VisitaTarjetaColor) => {
    setForm((current) => ({
      ...current,
      tarjetaColor,
      zonasPermitidas: resolveZonasFromTarjetaColor(tarjetaColor),
    }));
  }, []);

  const handleSave = useCallback(async () => {
    const parsed = parseCandidateValue(form.personaId);
    if (!parsed) {
      toast.error("Seleccione una persona.", "Visitas");
      return;
    }
    if (!form.motivo.trim() || !form.responsableValue.trim()) {
      toast.error("Motivo y responsable son obligatorios.", "Visitas");
      return;
    }
    if (!form.tarjetaColor) {
      toast.error("Seleccione el color de tarjeta.", "Visitas");
      return;
    }

    setSaving(true);
    try {
      let personaId: number;
      if (parsed.source === "glpi") {
        const persona = await ensurePersonaFromGlpi(parsed.id);
        personaId = persona.id;
      } else {
        personaId = parsed.id;
      }

      const responsableNombre = await resolveCandidateFullName(form.responsableValue);

      const payload: CrearVisitaPayload = {
        personaId,
        motivo: form.motivo.trim(),
        responsableNombre,
        estado: form.estado,
        zonasPermitidas: resolveZonasFromTarjetaColor(form.tarjetaColor),
        credencialNumero: form.credencialNumero.trim() || undefined,
        tarjetaColor: form.tarjetaColor,
        entradaAt: fromDateTimeInput(form.entradaAt),
        salidaAt: fromDateTimeInput(form.salidaAt),
        observaciones: form.observaciones.trim() || undefined,
      };

      if (editing) {
        await actualizarVisita(editing.id, payload);
        toast.success("Visita actualizada.", "Visitas");
      } else {
        await crearVisita(payload);
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
  }, [editing, form, reload, toast]);

  const handleDelete = useCallback(async () => {
    if (!confirmVisita) return;

    setConfirmLoading(true);
    try {
      await eliminarVisita(confirmVisita.id);
      toast.success("Visita eliminada.", "Visitas");
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
        <div>
          <h2 className="text-base font-semibold">Visitas</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Visitas del día — gestión de ingresos, permisos por zona y responsables.
          </p>
        </div>
        <Button type="button" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nueva visita
        </Button>
      </div>

      <VisitasFilters filters={filters} onChange={setFilters} onApply={applyFilters} />

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
        onOpenChange={setDialogOpen}
        title={editing ? "Editar visita" : "Nueva visita"}
        description={
          editing
            ? "Edite el ingreso y los permisos de la visita."
            : "Registre el ingreso y los permisos de la visita."
        }
        className="max-h-[95vh] max-w-4xl"
        contentClassName="overflow-visible"
        allowOverflow
      >
        <form
          className="min-w-0 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
        >
          <Field id="visita-persona" label="Persona">
            <ServerSearchableSelect
              id="visita-persona"
              value={form.personaId}
              onChange={(value) => setForm({ ...form, personaId: value })}
              onLoadOptions={loadPersonCandidateOptions}
              resolveSelectedOption={resolvePersonCandidateOption}
              placeholder="Seleccionar persona"
              searchPlaceholder="Buscar por nombre…"
              noResultsText="Sin resultados"
              loadingText="Buscando…"
              disabled={saving}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="visita-motivo" label="Motivo" className="sm:col-span-2">
              <Input
                id="visita-motivo"
                value={form.motivo}
                onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                required
              />
            </Field>
            <Field id="visita-responsable" label="Responsable">
              <ServerSearchableSelect
                id="visita-responsable"
                value={form.responsableValue}
                onChange={(value) => setForm({ ...form, responsableValue: value })}
                onLoadOptions={loadPersonCandidateOptions}
                resolveSelectedOption={resolveResponsableCandidateOption}
                placeholder="Seleccionar responsable"
                searchPlaceholder="Buscar por nombre…"
                noResultsText="Sin resultados"
                loadingText="Buscando…"
                disabled={saving}
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
            <Field id="visita-credencial" label="Número de credencial">
              <Input
                id="visita-credencial"
                value={form.credencialNumero}
                onChange={(e) => setForm({ ...form, credencialNumero: e.target.value })}
              />
            </Field>
            <Field id="visita-entrada" label="Entrada">
              <Input
                id="visita-entrada"
                type="datetime-local"
                value={form.entradaAt}
                onChange={(e) => setForm({ ...form, entradaAt: e.target.value })}
              />
            </Field>
            <Field id="visita-salida" label="Salida">
              <Input
                id="visita-salida"
                type="datetime-local"
                value={form.salidaAt}
                onChange={(e) => setForm({ ...form, salidaAt: e.target.value })}
              />
            </Field>
          </div>

          <VisitaTarjetaColorSelector
            value={form.tarjetaColor}
            onChange={handleTarjetaColorChange}
            disabled={saving}
          />

          <VisitaZonasSelector value={form.zonasPermitidas} readOnly />

          <Field id="visita-observaciones" label="Observaciones">
            <Textarea
              id="visita-observaciones"
              value={form.observaciones}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
              rows={3}
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
        onOpenChange={setConfirmOpen}
        title="Eliminar visita"
        description={`¿Eliminar la visita #${confirmVisita?.id} de ${confirmVisita?.visitante}?`}
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
