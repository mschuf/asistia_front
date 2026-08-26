import { RefreshCw } from "lucide-react";
import { formatUserStatusSources, type RunningSync } from "@/api/userStatus";
import { formatDate } from "./UserStatusTable";

/**
 * Aviso persistente mientras hay fuentes consultando sistemas externos.
 */
export function UserStatusSyncBanner({ running }: { running: RunningSync[] }) {
  if (running.length === 0) return null;
  const startedAt = running.map((item) => item.startedAt).sort()[0];
  return (
    <div className="flex items-start gap-3 rounded-md border border-sky-200 bg-sky-50 p-3 text-sm text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100">
      <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
      <div>
        <p className="font-medium">Sincronización en curso: {formatUserStatusSources(running.map((item) => item.source))}</p>
        <p className="mt-1 text-sky-800/90 dark:text-sky-200/80">
          {startedAt ? `Empezó a las ${formatDate(startedAt)}. ` : ""}
          Puede tardar varios minutos según la cantidad de usuarios. El listado se actualiza solo al terminar; no hace falta pulsar otra vez.
        </p>
      </div>
    </div>
  );
}
