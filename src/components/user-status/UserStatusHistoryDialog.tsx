import { useEffect, useState } from "react";
import { getUserStatusHistory, USER_STATUS_SOURCES, type MonitoredUser, type UserStatusHistoryItem, type UserStatusSource } from "@/api/userStatus";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { formatDate } from "./UserStatusTable";

interface Props { open: boolean; user: MonitoredUser | null; onOpenChange: (open: boolean) => void; }

export function UserStatusHistoryDialog({ open, user, onOpenChange }: Props) {
  const [source, setSource] = useState<"" | UserStatusSource>("");
  const [items, setItems] = useState<UserStatusHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void getUserStatusHistory(user.id, source || undefined)
      .then((result) => { if (!cancelled) setItems(result.items); })
      .catch((caught) => { if (!cancelled) setError(caught instanceof Error ? caught.message : "No se pudo cargar el historial."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, source, user]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={`Historial${user ? ` · ${user.name}` : ""}`} description="Solo se agrega una entrada cuando cambia el estado, la actividad o un detalle relevante." className="max-w-4xl">
      <div className="space-y-4">
        <label className="block max-w-xs space-y-1 text-sm">
          <span className="text-muted-foreground">Fuente</span>
          <Select value={source} onChange={(event) => setSource(event.target.value as "" | UserStatusSource)}>
            <option value="">Todas</option>
            {USER_STATUS_SOURCES.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
        </label>
        {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        {loading ? <p className="py-8 text-center text-sm text-muted-foreground">Cargando historial…</p> : items.length === 0 ? (
          <EmptyState title="Sin cambios registrados" description="El usuario todavía no tiene cambios de estado para la fuente seleccionada." />
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground"><tr><th className="px-3 py-2">Fecha</th><th className="px-3 py-2">Fuente</th><th className="px-3 py-2">Identificador</th><th className="px-3 py-2">Estado</th><th className="px-3 py-2">Detalle</th></tr></thead>
              <tbody className="divide-y divide-border">{items.map((item) => (
                <tr key={item.id}><td className="px-3 py-2 whitespace-nowrap">{formatDate(item.checkedAt)}</td><td className="px-3 py-2">{item.source}</td><td className="px-3 py-2">{item.identifier}</td><td className="px-3 py-2"><HistoryStatus status={item.status} /></td><td className="px-3 py-2 text-muted-foreground">{item.detail ?? "—"}</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </Dialog>
  );
}

function HistoryStatus({ status }: { status: UserStatusHistoryItem["status"] }) {
  const variant = status === "ACTIVO" ? "success" : status === "INACTIVO" || status === "ERROR" ? "danger" : status === "BLOQUEADO" || status === "EXPIRADO" ? "warning" : "default";
  return <Badge variant={variant}>{status.replace(/_/g, " ")}</Badge>;
}
