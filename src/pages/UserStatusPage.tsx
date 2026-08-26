import { BookUser, History, Plus, RefreshCw, UsersRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError } from "@/api/apiClient";
import {
  activateMonitoredUser,
  createMonitoredUser,
  deactivateMonitoredUser,
  formatUserStatusSources,
  getUserStatusSyncHistory,
  startAllUserStatusSync,
  startUserStatusSourceSync,
  updateMonitoredUser,
  userStatusRunningLabel,
  USER_STATUS_SOURCE_LABELS,
  USER_STATUS_SOURCES,
  type MonitoredUser,
  type MonitoredUserPayload,
  type UserStatusPageSize,
  type UserStatusSource,
} from "@/api/userStatus";
import { MonitoredUserDialog } from "@/components/user-status/MonitoredUserDialog";
import { SourceDirectoryDialog } from "@/components/user-status/SourceDirectoryDialog";
import { SyncHistoryDialog } from "@/components/user-status/SyncHistoryDialog";
import { UserStatusFilters } from "@/components/user-status/UserStatusFilters";
import { UserStatusHistoryDialog } from "@/components/user-status/UserStatusHistoryDialog";
import { UserStatusSourceCounters } from "@/components/user-status/UserStatusSourceCounters";
import { UserStatusSyncBanner } from "@/components/user-status/UserStatusSyncBanner";
import { formatDate, UserStatusTable } from "@/components/user-status/UserStatusTable";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { useToast } from "@/context/ToastContext";
import { useUserStatusList } from "@/hooks/useUserStatusList";
import { useUserStatusSync } from "@/hooks/useUserStatusSync";

export default function UserStatusPage() {
  const toast = useToast();
  const list = useUserStatusList();
  const [editing, setEditing] = useState<MonitoredUser | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [historyUser, setHistoryUser] = useState<MonitoredUser | null>(null);
  const [syncHistoryOpen, setSyncHistoryOpen] = useState(false);
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<{ user: MonitoredUser; activate: boolean } | null>(null);
  const [changingStatus, setChangingStatus] = useState(false);
  const [starting, setStarting] = useState(false);
  const [syncSource, setSyncSource] = useState<"ALL" | UserStatusSource>("ALL");
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  const loadLastSync = useCallback(() => {
    void getUserStatusSyncHistory()
      .then((result) => {
        const completed = result.items.find((item) => item.status !== "ERROR" && item.status !== "EN_PROGRESO");
        setLastSyncAt(completed?.finishedAt ?? completed?.startedAt ?? null);
      })
      .catch(() => setLastSyncAt(null));
  }, []);
  useEffect(loadLastSync, [loadLastSync]);

  const onSyncFinished = useCallback((sources: UserStatusSource[]) => {
    list.reload();
    loadLastSync();
    void getUserStatusSyncHistory(1, 20)
      .then((history) => {
        const latest = sources.flatMap((source) => {
          const item = history.items.find((row) => row.source === source && row.status !== "EN_PROGRESO");
          return item ? [item] : [];
        });
        const errors = latest.reduce((sum, item) => sum + item.errors, 0);
        const processed = latest.reduce((sum, item) => sum + item.processed, 0);
        const names = formatUserStatusSources(sources);
        if (errors > 0) {
          toast.info(`Terminó ${names}. Procesados: ${processed}. Errores: ${errors}. Se conservaron los estados válidos previos.`, "Sincronización");
        } else {
          toast.success(`Sincronización de ${names} completada. Usuarios procesados: ${processed}.`, "Estado de usuarios");
        }
      })
      .catch(() => {
        toast.success(`Sincronización de ${formatUserStatusSources(sources)} terminó.`, "Estado de usuarios");
      });
  }, [list.reload, loadLastSync, toast]);
  const { running, refresh, mergeRunning } = useUserStatusSync(onSyncFinished);

  const runningSources = running.map((item) => item.source);
  const selectedIsRunning = syncSource === "ALL"
    ? runningSources.length === USER_STATUS_SOURCES.length
    : runningSources.includes(syncSource);
  const syncBusy = starting || selectedIsRunning;
  const syncLabel = starting ? "Iniciando…" : selectedIsRunning ? "En curso…" : "Sincronizar";
  const lastSyncLabel = running.length > 0
    ? `Sincronizando ${formatUserStatusSources(runningSources)}…`
    : lastSyncAt
      ? `Última sincronización: ${formatDate(lastSyncAt)}`
      : "Todavía no hay sincronizaciones registradas.";

  const paginationFrom = list.total === 0 ? 0 : list.limit === "all" ? 1 : (list.page - 1) * list.limit + 1;
  const paginationTo = list.limit === "all" ? list.total : Math.min(list.page * list.limit, list.total);
  const pageLabel = useMemo(() => `Página ${list.page} de ${list.totalPages}`, [list.page, list.totalPages]);

  async function saveUser(payload: MonitoredUserPayload) {
    try {
      if (editing) {
        await updateMonitoredUser(editing.id, payload);
        toast.success("Usuario monitoreado actualizado.", "Estado de usuarios");
      } else {
        await createMonitoredUser(payload);
        toast.success("Usuario agregado al monitoreo.", "Estado de usuarios");
      }
      list.reload();
    } catch (error) {
      throw new Error(error instanceof ApiError ? error.message : "No se pudo guardar el usuario.");
    }
  }

  async function runSync() {
    if (syncSource !== "ALL" && runningSources.includes(syncSource)) {
      toast.info(`${userStatusRunningLabel([syncSource])}. Esperá a que termine; el aviso de arriba se actualiza solo.`, "Sincronización en curso");
      return;
    }
    setStarting(true);
    try {
      const result = syncSource === "ALL" ? await startAllUserStatusSync() : await startUserStatusSourceSync(syncSource);
      mergeRunning([...result.accepted, ...result.alreadyRunning]);
      if (result.accepted.length === 0) {
        toast.info(`${userStatusRunningLabel(result.alreadyRunning)}. Esperá a que termine; no hace falta pulsar otra vez.`, "Sincronización en curso");
      } else if (result.alreadyRunning.length > 0) {
        toast.info(`Se inició la sincronización de ${formatUserStatusSources(result.accepted)}. ${userStatusRunningLabel(result.alreadyRunning)}.`, "Sincronización");
      } else {
        toast.success(`Sincronización de ${formatUserStatusSources(result.accepted)} iniciada. Puede tardar varios minutos; el listado se actualizará al terminar.`, "Sincronización");
      }
    } catch (error) {
      if (error instanceof ApiError && (error.status === 409 || error.code === "CONFLICT")) {
        toast.info(error.message, "Sincronización en curso");
        void refresh();
        return;
      }
      if (error instanceof ApiError && error.code === "REQUEST_TIMEOUT") {
        toast.info("La petición tardó más de lo habitual, pero la sincronización puede seguir en el servidor. El aviso de «en curso» se actualizará solo.", "Sincronización");
        void refresh();
        return;
      }
      toast.error(error instanceof ApiError ? error.message : "No se pudo iniciar la sincronización.", "Estado de usuarios");
    } finally {
      setStarting(false);
    }
  }

  async function confirmStatusChange() {
    if (!statusTarget) return;
    const { user, activate } = statusTarget;
    setChangingStatus(true);
    try {
      if (activate) await activateMonitoredUser(user.id);
      else await deactivateMonitoredUser(user.id);
      toast.success(`Se ${activate ? "activó" : "desactivó"} el monitoreo de ${user.name}.`, "Estado de usuarios");
      setStatusTarget(null);
      list.reload();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : `No se pudo ${activate ? "activar" : "desactivar"} el usuario.`, "Estado de usuarios");
    } finally {
      setChangingStatus(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center">
        <div>
          <div className="flex items-center gap-2"><UsersRound className="h-6 w-6 text-primary" aria-hidden="true" /><h1 className="text-2xl font-semibold">Estado de usuarios</h1></div>
          <p className="mt-2 text-xs text-muted-foreground">{lastSyncLabel}</p>
        </div>
        <UserStatusSourceCounters counts={list.sourceCounts} scope={list.countScope} onScopeChange={list.setCountScope} />
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <Select className="w-44 shrink-0" value={syncSource} aria-label="Sincronización manual" title="Si una fuente ya está en curso, no se cancela al pulsar de nuevo." onChange={(event) => setSyncSource(event.target.value as "ALL" | UserStatusSource)}>
            <option value="ALL">Todas las fuentes</option>
            {USER_STATUS_SOURCES.map((source) => <option key={source} value={source}>{USER_STATUS_SOURCE_LABELS[source]}</option>)}
          </Select>
          <Button type="button" variant="outline" className="gap-2" disabled={syncBusy} title={selectedIsRunning ? "Esta fuente ya se está sincronizando" : "Consultar estados en las fuentes elegidas"} onClick={() => void runSync()}>
            <RefreshCw className={`h-4 w-4 ${syncBusy ? "animate-spin" : ""}`} />
            {syncLabel}
          </Button>
          <span className="mx-1.5 h-8 w-0.5 shrink-0 bg-muted-foreground/50" aria-hidden="true" />
          <Button type="button" variant="outline" className="gap-2" onClick={() => setSyncHistoryOpen(true)}><History className="h-4 w-4" />Historial</Button>
          <Button type="button" variant="outline" className="gap-2" onClick={() => setDirectoryOpen(true)}><BookUser className="h-4 w-4" />Directorio</Button>
          <Button type="button" className="gap-2" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" />Agregar usuario</Button>
        </div>
      </div>

      <UserStatusSyncBanner running={running} />

      <UserStatusFilters filters={list.draftFilters} onChange={list.setDraftFilters} onApply={list.applyFilters} disabled={list.loading} />
      {list.error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{list.error}</div> : null}
      {list.loading ? <div className="rounded-md border bg-card p-8 text-center text-sm text-muted-foreground shadow-soft">Cargando estados de usuarios…</div> : (
        <UserStatusTable
          rows={list.items}
          sort={list.sort}
          onSort={list.setSortColumn}
          onEdit={(user) => { setEditing(user); setFormOpen(true); }}
          onHistory={setHistoryUser}
          onDeactivate={(user) => setStatusTarget({ user, activate: false })}
          onActivate={(user) => setStatusTarget({ user, activate: true })}
        />
      )}

      {list.total > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <label className="flex items-center gap-2 text-sm text-muted-foreground"><span>Mostrar por página</span><Select className="h-9 w-24 text-center" value={String(list.limit)} onChange={(event) => list.setPageLimit((event.target.value === "all" ? "all" : Number(event.target.value)) as UserStatusPageSize)}><option value="15">15</option><option value="50">50</option><option value="100">100</option><option value="all">Todos</option></Select></label>
            <p className="text-sm text-muted-foreground">Mostrando {paginationFrom} - {paginationTo} de {list.total} elementos</p>
          </div>
          <div className="flex items-center gap-2"><Button type="button" variant="outline" size="sm" disabled={list.page <= 1 || list.limit === "all"} onClick={() => list.setPage(list.page - 1)}>Anterior</Button><span className="min-w-28 text-center text-sm text-muted-foreground">{pageLabel}</span><Button type="button" variant="outline" size="sm" disabled={list.page >= list.totalPages || list.limit === "all"} onClick={() => list.setPage(list.page + 1)}>Siguiente</Button></div>
        </div>
      ) : null}

      <MonitoredUserDialog open={formOpen} user={editing} onOpenChange={setFormOpen} onSave={saveUser} />
      <UserStatusHistoryDialog open={historyUser !== null} user={historyUser} onOpenChange={(open) => { if (!open) setHistoryUser(null); }} />
      <SyncHistoryDialog open={syncHistoryOpen} onOpenChange={setSyncHistoryOpen} />
      <SourceDirectoryDialog open={directoryOpen} onOpenChange={setDirectoryOpen} />
      <Dialog
        open={statusTarget !== null}
        onOpenChange={(open) => { if (!open && !changingStatus) setStatusTarget(null); }}
        title={statusTarget?.activate ? "Activar monitoreo" : "Desactivar monitoreo"}
        description={statusTarget ? (statusTarget.activate ? `Se volverá a sincronizar a ${statusTarget.user.name} en todas sus fuentes configuradas.` : `Se dejará de sincronizar a ${statusTarget.user.name} en todas sus fuentes.`) : undefined}
      >
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={changingStatus} onClick={() => setStatusTarget(null)}>Cancelar</Button><Button type="button" disabled={changingStatus} onClick={() => void confirmStatusChange()}>{changingStatus ? (statusTarget?.activate ? "Activando…" : "Desactivando…") : statusTarget?.activate ? "Activar" : "Desactivar"}</Button></div>
      </Dialog>
    </div>
  );
}
