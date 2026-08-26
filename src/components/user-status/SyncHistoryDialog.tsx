import { useEffect, useState } from "react";
import { getUserStatusSyncHistory, SYNC_HISTORY_PAGE_SIZE, USER_STATUS_SOURCE_LABELS, type SyncHistoryItem } from "@/api/userStatus";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "./UserStatusTable";

const SYNC_STATUS_UI: Record<SyncHistoryItem["status"], { label: string; variant: BadgeProps["variant"] }> = {
  EN_PROGRESO: { label: "En curso", variant: "info" },
  COMPLETADO: { label: "Completado", variant: "success" },
  COMPLETADO_CON_ERRORES: { label: "Completado con errores", variant: "warning" },
  ERROR: { label: "Error", variant: "danger" },
  OMITIDO: { label: "Omitido", variant: "default" },
};

export function SyncHistoryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [items, setItems] = useState<SyncHistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (!open) { setPage(1); setItems([]); setTotal(0); } }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true); setError(null);
    void getUserStatusSyncHistory(page, SYNC_HISTORY_PAGE_SIZE)
      .then((result) => { if (!cancelled) { setItems(result.items); setTotal(result.total); } })
      .catch((caught) => { if (!cancelled) { setItems([]); setTotal(0); setError(caught instanceof Error ? caught.message : "No se pudo cargar el historial."); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, page]);

  const totalPages = Math.max(1, Math.ceil(total / SYNC_HISTORY_PAGE_SIZE));
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  const from = total === 0 ? 0 : (page - 1) * SYNC_HISTORY_PAGE_SIZE + 1;
  const to = Math.min(page * SYNC_HISTORY_PAGE_SIZE, total);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Historial de sincronizaciones" description="Auditoría de ejecuciones manuales y programadas por fuente." className="max-w-5xl">
      {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : loading && items.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Cargando sincronizaciones…</p> : items.length === 0 ? <EmptyState title="Sin sincronizaciones" /> : (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Inicio</th>
                  <th className="px-3 py-2">Fuente</th>
                  <th className="px-3 py-2">Disparo</th>
                  <th className="px-3 py-2">Resultado</th>
                  <th className="px-3 py-2">Procesados</th>
                  <th className="px-3 py-2">Exitosos</th>
                  <th className="px-3 py-2">Errores</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => {
                  const statusUi = SYNC_STATUS_UI[item.status] ?? SYNC_STATUS_UI.ERROR;
                  return (
                    <tr key={item.id}>
                      <td className="px-3 py-2 whitespace-nowrap">{formatDate(item.startedAt)}</td>
                      <td className="px-3 py-2">{USER_STATUS_SOURCE_LABELS[item.source]}</td>
                      <td className="px-3 py-2">{item.triggerType === "MANUAL" ? "Manual" : "Programado"}</td>
                      <td className="px-3 py-2"><Badge variant={statusUi.variant}>{statusUi.label}</Badge></td>
                      <td className="px-3 py-2 tabular-nums">{item.processed}</td>
                      <td className="px-3 py-2 tabular-nums">{item.succeeded}</td>
                      <td className="px-3 py-2 tabular-nums">{item.errors}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <nav aria-label="Paginación del historial de sincronizaciones" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground" aria-live="polite">Mostrando {from} - {to} de {total} elementos</p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" disabled={loading || page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
              <span className="min-w-28 text-center text-sm text-muted-foreground">Página {page} de {totalPages}</span>
              <Button type="button" variant="outline" size="sm" disabled={loading || page >= totalPages} onClick={() => setPage(page + 1)}>Siguiente</Button>
            </div>
          </nav>
        </div>
      )}
    </Dialog>
  );
}
