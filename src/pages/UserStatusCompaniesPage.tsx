import { Building2, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "@/api/apiClient";
import {
  activateUserStatusCompany,
  createUserStatusCompany,
  deactivateUserStatusCompany,
  updateUserStatusCompany,
  type UserStatusCompany,
  type UserStatusCompanyPageSize,
} from "@/api/userStatusCompanies";
import { UserStatusCompaniesTable } from "@/components/user-status-companies/UserStatusCompaniesTable";
import { UserStatusCompanyDialog } from "@/components/user-status-companies/UserStatusCompanyDialog";
import { UserStatusCompanyFilters } from "@/components/user-status-companies/UserStatusCompanyFilters";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { useToast } from "@/context/ToastContext";
import { useUserStatusCompanies } from "@/hooks/useUserStatusCompanies";

export default function UserStatusCompaniesPage() {
  const toast = useToast();
  const list = useUserStatusCompanies();
  const [editing, setEditing] = useState<UserStatusCompany | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<UserStatusCompany | null>(null);
  const [changingStatus, setChangingStatus] = useState(false);

  const paginationFrom = list.total === 0 ? 0 : list.limit === "all" ? 1 : (list.page - 1) * list.limit + 1;
  const paginationTo = list.limit === "all" ? list.total : Math.min(list.page * list.limit, list.total);

  async function saveCompany(payload: { name: string; active: boolean }) {
    try {
      if (editing) {
        await updateUserStatusCompany(editing.id, payload);
        toast.success("Empresa actualizada.", "Estado de usuarios");
      } else {
        await createUserStatusCompany(payload);
        toast.success("Empresa creada.", "Estado de usuarios");
      }
      list.reload();
    } catch (error) {
      throw new Error(error instanceof ApiError ? error.message : "No se pudo guardar la empresa.");
    }
  }

  async function confirmStatusChange() {
    if (!statusTarget) return;
    const activate = !statusTarget.active;
    setChangingStatus(true);
    try {
      if (activate) await activateUserStatusCompany(statusTarget.id);
      else await deactivateUserStatusCompany(statusTarget.id);
      toast.success(`Empresa ${activate ? "activada" : "desactivada"}.`, "Estado de usuarios");
      setStatusTarget(null);
      list.reload();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "No se pudo cambiar el estado de la empresa.", "Estado de usuarios");
    } finally {
      setChangingStatus(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link to="/admin/estado-usuarios" className="text-xs text-muted-foreground hover:text-foreground">
            Estado de usuarios
          </Link>
          <div className="mt-1 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" aria-hidden="true" />
            <h1 className="text-2xl font-semibold">Empresas</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Administrá las empresas que pueden asociarse a usuarios monitoreados.</p>
        </div>
        <Button
          type="button"
          className="gap-2"
          onClick={() => { setEditing(null); setFormOpen(true); }}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nueva empresa
        </Button>
      </div>

      <UserStatusCompanyFilters
        filters={list.draftFilters}
        onChange={list.setDraftFilters}
        onApply={list.applyFilters}
        disabled={list.loading}
      />

      {list.error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{list.error}</div> : null}
      {list.loading ? (
        <div className="rounded-md border bg-card p-8 text-center text-sm text-muted-foreground shadow-soft">Cargando empresas…</div>
      ) : (
        <UserStatusCompaniesTable
          rows={list.items}
          sort={list.sort}
          onSort={list.setSortColumn}
          onEdit={(company) => { setEditing(company); setFormOpen(true); }}
          onStatusChange={setStatusTarget}
        />
      )}

      {list.total > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Mostrar por página</span>
              <Select
                className="h-9 w-24 text-center"
                value={String(list.limit)}
                onChange={(event) => list.setPageLimit((event.target.value === "all" ? "all" : Number(event.target.value)) as UserStatusCompanyPageSize)}
              >
                <option value="15">15</option>
                <option value="50">50</option>
                <option value="100">100</option>
                <option value="all">Todos</option>
              </Select>
            </label>
            <p className="text-sm text-muted-foreground">Mostrando {paginationFrom} - {paginationTo} de {list.total} elementos</p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" disabled={list.page <= 1 || list.limit === "all"} onClick={() => list.setPage(list.page - 1)}>Anterior</Button>
            <span className="min-w-28 text-center text-sm text-muted-foreground">Página {list.page} de {list.totalPages}</span>
            <Button type="button" variant="outline" size="sm" disabled={list.page >= list.totalPages || list.limit === "all"} onClick={() => list.setPage(list.page + 1)}>Siguiente</Button>
          </div>
        </div>
      ) : null}

      <UserStatusCompanyDialog
        open={formOpen}
        company={editing}
        onOpenChange={setFormOpen}
        onSave={saveCompany}
      />
      <Dialog
        open={statusTarget !== null}
        onOpenChange={(open) => { if (!open && !changingStatus) setStatusTarget(null); }}
        title={statusTarget?.active ? "Desactivar empresa" : "Activar empresa"}
        description={statusTarget ? (
          statusTarget.active
            ? `${statusTarget.name} dejará de estar disponible para nuevas asociaciones. Los usuarios actuales conservarán la relación.`
            : `${statusTarget.name} volverá a estar disponible para asociarla a usuarios.`
        ) : undefined}
      >
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" disabled={changingStatus} onClick={() => setStatusTarget(null)}>Cancelar</Button>
          <Button type="button" disabled={changingStatus} onClick={() => void confirmStatusChange()}>
            {changingStatus ? "Procesando…" : statusTarget?.active ? "Desactivar" : "Activar"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
