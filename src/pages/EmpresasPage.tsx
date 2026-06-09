import { Building2, Eye, Pencil, Plus, Power, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  actualizarEmpresa,
  activarEmpresa,
  crearEmpresa,
  desactivarEmpresa,
  eliminarEmpresaDefinitiva,
  listarEmpresas,
  type ActualizarEmpresaPayload,
  type CrearEmpresaPayload,
  type Empresa,
} from "@/api/empresas";
import { ApiError } from "@/api/apiClient";
import {
  EmpresaConfirmDialog,
  type EmpresaConfirmAction,
} from "@/components/empresas/EmpresaConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

const actionIconButtonClass =
  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40";

interface EmpresaFormState {
  name: string;
  isActive: boolean;
  msTenantId: string;
  msClientId: string;
  msClientSecret: string;
  msMailbox: string;
  msMailFolder: string;
  geminiModel: string;
  daemonMaxEmails: string;
  daemonIntervalSeconds: string;
}

const EMPTY_FORM: EmpresaFormState = {
  name: "",
  isActive: true,
  msTenantId: "",
  msClientId: "",
  msClientSecret: "",
  msMailbox: "",
  msMailFolder: "inbox",
  geminiModel: "gemini-3-flash-preview",
  daemonMaxEmails: "20",
  daemonIntervalSeconds: "60",
};

export default function EmpresasPage() {
  const toast = useToast();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Empresa | null>(null);
  const [form, setForm] = useState<EmpresaFormState>(EMPTY_FORM);
  const [revealClientSecret, setRevealClientSecret] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<EmpresaConfirmAction | null>(null);
  const [confirmEmpresa, setConfirmEmpresa] = useState<Empresa | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const loadEmpresas = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listarEmpresas({ page, limit: PAGE_SIZE, search: search || undefined });
      setEmpresas(result.items);
      setTotal(result.total);
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudieron cargar las empresas.";
      toast.error(message, "Empresas");
    } finally {
      setLoading(false);
    }
  }, [page, search, toast]);

  useEffect(() => {
    void loadEmpresas();
  }, [loadEmpresas]);

  useEffect(() => {
    if (!dialogOpen) {
      setRevealClientSecret(false);
    }
  }, [dialogOpen]);

  function openCreateDialog() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEditDialog(empresa: Empresa) {
    setEditing(empresa);
    setForm({
      name: empresa.name,
      isActive: empresa.isActive,
      msTenantId: empresa.msTenantId,
      msClientId: empresa.msClientId,
      msClientSecret: "",
      msMailbox: empresa.msMailbox,
      msMailFolder: empresa.msMailFolder,
      geminiModel: empresa.geminiModel,
      daemonMaxEmails: String(empresa.daemonMaxEmails),
      daemonIntervalSeconds: String(empresa.daemonIntervalSeconds),
    });
    setDialogOpen(true);
  }

  function updateForm<K extends keyof EmpresaFormState>(key: K, value: EmpresaFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openConfirm(action: EmpresaConfirmAction, empresa: Empresa) {
    setConfirmAction(action);
    setConfirmEmpresa(empresa);
    setConfirmOpen(true);
  }

  function closeConfirm() {
    setConfirmOpen(false);
    setConfirmAction(null);
    setConfirmEmpresa(null);
  }

  async function handleConfirmAction() {
    if (!confirmAction || !confirmEmpresa) return;

    setConfirmLoading(true);
    try {
      if (confirmAction === "deactivate") {
        await desactivarEmpresa(confirmEmpresa.id);
        toast.success(`"${confirmEmpresa.name}" desactivada.`, "Empresa desactivada");
      } else if (confirmAction === "activate") {
        await activarEmpresa(confirmEmpresa.id);
        toast.success(`"${confirmEmpresa.name}" activada.`, "Empresa activada");
      } else {
        await eliminarEmpresaDefinitiva(confirmEmpresa.id);
        toast.success(`"${confirmEmpresa.name}" eliminada definitivamente.`, "Empresa eliminada");
      }

      closeConfirm();
      await loadEmpresas();
    } catch (error) {
      const fallback =
        confirmAction === "deactivate"
          ? "No se pudo desactivar la empresa."
          : confirmAction === "activate"
            ? "No se pudo activar la empresa."
            : "No se pudo eliminar la empresa definitivamente.";
      const message = error instanceof ApiError ? error.message : fallback;
      toast.error(message, "Empresas");
    } finally {
      setConfirmLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const daemonMaxEmails = Number(form.daemonMaxEmails);
    const daemonIntervalSeconds = Number(form.daemonIntervalSeconds);

    if (!Number.isFinite(daemonMaxEmails) || daemonMaxEmails <= 0) {
      toast.error("Máximo de correos debe ser un entero positivo.", "Empresas");
      setSaving(false);
      return;
    }

    if (!Number.isFinite(daemonIntervalSeconds) || daemonIntervalSeconds <= 0) {
      toast.error("Intervalo del daemon debe ser un entero positivo.", "Empresas");
      setSaving(false);
      return;
    }

    try {
      if (editing) {
        const payload: ActualizarEmpresaPayload = {
          name: form.name.trim(),
          isActive: form.isActive,
          msTenantId: form.msTenantId.trim(),
          msClientId: form.msClientId.trim(),
          msMailbox: form.msMailbox.trim(),
          msMailFolder: form.msMailFolder.trim() || "inbox",
          geminiModel: form.geminiModel.trim() || "gemini-3-flash-preview",
          daemonMaxEmails,
          daemonIntervalSeconds,
        };

        if (form.msClientSecret.trim()) {
          payload.msClientSecret = form.msClientSecret;
        }

        await actualizarEmpresa(editing.id, payload);
        toast.success("Empresa actualizada.", "Empresas");
      } else {
        if (!form.msClientSecret.trim()) {
          toast.error("El secreto de cliente Microsoft es obligatorio.", "Empresas");
          setSaving(false);
          return;
        }

        const payload: CrearEmpresaPayload = {
          name: form.name.trim(),
          isActive: form.isActive,
          msTenantId: form.msTenantId.trim(),
          msClientId: form.msClientId.trim(),
          msClientSecret: form.msClientSecret,
          msMailbox: form.msMailbox.trim(),
          msMailFolder: form.msMailFolder.trim() || "inbox",
          geminiModel: form.geminiModel.trim() || "gemini-3-flash-preview",
          daemonMaxEmails,
          daemonIntervalSeconds,
        };

        await crearEmpresa(payload);
        toast.success("Empresa creada.", "Empresas");
      }

      setDialogOpen(false);
      await loadEmpresas();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo guardar la empresa.";
      toast.error(message, "Empresas");
    } finally {
      setSaving(false);
    }
  }

  function applySearch() {
    setPage(1);
    setSearch(searchInput.trim());
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Super-Admin</p>
          <h1 className="text-lg font-semibold">Empresas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Configuración por tenant.</p>
        </div>
        <Button type="button" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nueva empresa
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              applySearch();
            }
          }}
          placeholder="Buscar por nombre, buzón, modelo o estado (activ / inac)"
          aria-label="Buscar empresa"
        />
        <Button type="button" variant="outline" onClick={applySearch}>
          Buscar
        </Button>
      </div>

      {loading ? (
        <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground shadow-soft">
          Cargando empresas…
        </div>
      ) : empresas.length === 0 ? (
        <EmptyState
          title="Sin empresas"
          description="Todavía no hay empresas registradas o no coinciden con la búsqueda."
          action={
            <Button type="button" onClick={openCreateDialog}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nueva empresa
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-md border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left text-sm">
              <thead className="bg-muted text-xs uppercase tracking-normal text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Empresa</th>
                  <th className="px-4 py-3 font-semibold">Buzón</th>
                  <th className="px-4 py-3 font-semibold">Activa</th>
                  <th className="px-4 py-3 font-semibold">Modelo Gemini</th>
                  <th className="px-4 py-3 font-semibold">Intervalo daemon</th>
                  <th className="px-4 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {empresas.map((empresa) => (
                  <tr key={empresa.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">{empresa.name}</td>
                    <td className="px-4 py-3">{empresa.msMailbox}</td>
                    <td className="px-4 py-3">
                      <Badge variant={empresa.isActive ? "success" : "danger"}>
                        {empresa.isActive ? "Activa" : "Inactiva"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{empresa.geminiModel}</td>
                    <td className="px-4 py-3">{empresa.daemonIntervalSeconds}s</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-nowrap items-center gap-1.5">
                        <button
                          type="button"
                          aria-label="Editar"
                          title="Editar"
                          onClick={() => openEditDialog(empresa)}
                          className={cn(
                            actionIconButtonClass,
                            "border-sky-200/80 bg-sky-50/60 text-sky-700 hover:border-sky-300 hover:bg-sky-100/80",
                            "dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300 dark:hover:border-sky-800 dark:hover:bg-sky-950/50",
                          )}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        {empresa.isActive ? (
                          <button
                            type="button"
                            aria-label="Desactivar"
                            title="Desactivar"
                            onClick={() => openConfirm("deactivate", empresa)}
                            className={cn(
                              actionIconButtonClass,
                              "border-amber-200/80 bg-amber-50/60 text-amber-800 hover:border-amber-300 hover:bg-amber-100/80",
                              "dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:border-amber-800 dark:hover:bg-amber-950/50",
                            )}
                          >
                            <Power className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            aria-label="Activar"
                            title="Activar"
                            onClick={() => openConfirm("activate", empresa)}
                            className={cn(
                              actionIconButtonClass,
                              "border-emerald-200/80 bg-emerald-50/60 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100/80",
                              "dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/50",
                            )}
                          >
                            <Power className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        )}
                        <button
                          type="button"
                          aria-label="Eliminar definitivamente"
                          title="Eliminar definitivamente"
                          onClick={() => openConfirm("delete", empresa)}
                          className={cn(
                            actionIconButtonClass,
                            "border-red-200/80 bg-red-50/60 text-red-700 hover:border-red-300 hover:bg-red-100/80",
                            "dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300 dark:hover:border-red-800 dark:hover:bg-red-950/50",
                          )}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Página {page} de {totalPages} · {total} empresa{total === 1 ? "" : "s"}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
              Anterior
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Editar empresa" : "Nueva empresa"}
        description="Configurá la integración Microsoft y parámetros del daemon."
      >
        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <Field id="empresa-name" label="Nombre de la empresa">
            <Input
              id="empresa-name"
              value={form.name}
              onChange={(event) => updateForm("name", event.target.value)}
              required
            />
          </Field>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => updateForm("isActive", event.target.checked)}
            />
            Empresa activa
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="empresa-tenant" label="Tenant ID Microsoft">
              <Input
                id="empresa-tenant"
                value={form.msTenantId}
                onChange={(event) => updateForm("msTenantId", event.target.value)}
                required
              />
            </Field>
            <Field id="empresa-client" label="Client ID Microsoft">
              <Input
                id="empresa-client"
                value={form.msClientId}
                onChange={(event) => updateForm("msClientId", event.target.value)}
                required
              />
            </Field>
          </div>

          <Field
            id="empresa-secret"
            label="Secreto de cliente Microsoft"
          >
            <div className="relative">
              <Input
                id="empresa-secret"
                type={revealClientSecret ? "text" : "password"}
                value={form.msClientSecret}
                onChange={(event) => updateForm("msClientSecret", event.target.value)}
                required={!editing}
                placeholder={editing ? "Dejar vacío para no cambiar" : undefined}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground"
                aria-label="Mantener presionado para ver el secreto"
                title="Mantener presionado para ver"
                onPointerDown={() => setRevealClientSecret(true)}
                onPointerUp={() => setRevealClientSecret(false)}
                onPointerLeave={() => setRevealClientSecret(false)}
                onPointerCancel={() => setRevealClientSecret(false)}
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="empresa-mailbox" label="Buzón Microsoft">
              <Input
                id="empresa-mailbox"
                type="email"
                value={form.msMailbox}
                onChange={(event) => updateForm("msMailbox", event.target.value)}
                required
              />
            </Field>
            <Field id="empresa-folder" label="Carpeta de correo">
              <Input
                id="empresa-folder"
                value={form.msMailFolder}
                onChange={(event) => updateForm("msMailFolder", event.target.value)}
                required
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="empresa-gemini" label="Modelo Gemini">
              <Input
                id="empresa-gemini"
                value={form.geminiModel}
                onChange={(event) => updateForm("geminiModel", event.target.value)}
                required
              />
            </Field>
            <Field id="empresa-max-emails" label="Máx. correos por ciclo">
              <Input
                id="empresa-max-emails"
                type="number"
                min={1}
                value={form.daemonMaxEmails}
                onChange={(event) => updateForm("daemonMaxEmails", event.target.value)}
                required
              />
            </Field>
            <Field id="empresa-interval" label="Intervalo daemon (seg)">
              <Input
                id="empresa-interval"
                type="number"
                min={1}
                value={form.daemonIntervalSeconds}
                onChange={(event) => updateForm("daemonIntervalSeconds", event.target.value)}
                required
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando…" : editing ? "Guardar cambios" : "Crear empresa"}
            </Button>
          </div>
        </form>
      </Dialog>

      <EmpresaConfirmDialog
        open={confirmOpen}
        action={confirmAction}
        empresa={confirmEmpresa}
        loading={confirmLoading}
        onOpenChange={(open) => {
          if (!open && !confirmLoading) {
            closeConfirm();
            return;
          }
          setConfirmOpen(open);
        }}
        onConfirm={() => void handleConfirmAction()}
      />

      <div className="rounded-md border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <Building2 className="h-4 w-4" aria-hidden="true" />
          Administración de empresas
        </div>
        <p className="mt-2">
          Cada empresa representa un tenant con credenciales Microsoft y parámetros del daemon de correo.
        </p>
      </div>
    </div>
  );
}
