/**
 * @file ErsHistoryPage.tsx
 * @description Pantalla timeline del historial informativo de ERS.
 */
import { useEffect, useState } from "react";
import { Clock3, RefreshCw, UserCircle2 } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "@/api/apiClient";
import { listarHistorialErs, type ErsHistoryItem } from "@/api/ers-history";
import { obtenerErs, type ErsDetail } from "@/api/ers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";

const colorByAction: Record<ErsHistoryItem["actionType"], string> = {
  create:
    "border-emerald-200/80 bg-emerald-50/80 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200",
  update:
    "border-sky-200/80 bg-sky-50/80 text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-200",
  delete:
    "border-rose-200/80 bg-rose-50/80 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200",
};

const labelByAction: Record<ErsHistoryItem["actionType"], string> = {
  create: "Creación",
  update: "Actualización",
  delete: "Reorganización",
};

/** Vista de historial del proyecto ERS. */
export default function ErsHistoryPage() {
  const { isTechnician } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const projectIdNumber = Number(projectId);

  const [project, setProject] = useState<ErsDetail | null>(null);
  const [items, setItems] = useState<ErsHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!Number.isFinite(projectIdNumber) || projectIdNumber <= 0) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    Promise.all([obtenerErs(projectIdNumber), listarHistorialErs(projectIdNumber, { limit: 100 })])
      .then(([detail, history]) => {
        if (cancelled) return;
        setProject(detail);
        setItems(history.items);
      })
      .catch((fetchError) => {
        if (cancelled) return;
        const message =
          fetchError instanceof ApiError
            ? fetchError.message
            : "No se pudo cargar el historial del proyecto ERS.";
        setError(message);
        toast.error(message, "ERS");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectIdNumber, reloadToken, toast]);

  if (!isTechnician) {
    return <Navigate to="/ers" replace />;
  }

  if (!Number.isFinite(projectIdNumber) || projectIdNumber <= 0) {
    return <Navigate to="/ers" replace />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground">IRS / ERS</p>
          <h1 className="text-lg font-semibold">
            Historial ERS {project ? `#${project.projectId} - ${project.projectName}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Seguimiento informativo de cambios del proyecto y su gestión.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/ers/${projectIdNumber}/editar`)}
          >
            Volver a edición
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={loading}
            onClick={() => setReloadToken((value) => value + 1)}
            aria-label="Recargar historial"
            title="Recargar historial"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} aria-hidden="true" />
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      ) : null}

      {loading ? (
        <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground shadow-soft">
          Cargando historial ERS...
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Sin eventos registrados"
          description="Aún no hay movimientos para mostrar en el historial de este proyecto."
        />
      ) : (
        <ol className="space-y-3">
          {items.map((item, index) => {
            const itemColor = colorByAction[item.actionType];
            const showConnector = index < items.length - 1;
            return (
              <li key={item.id} className="relative pl-10">
                {showConnector ? (
                  <span
                    className="absolute left-[15px] top-8 h-[calc(100%-0.5rem)] w-px bg-border"
                    aria-hidden="true"
                  />
                ) : null}
                <span
                  className={cn(
                    "absolute left-0 top-1 inline-flex h-8 w-8 items-center justify-center rounded-full border",
                    itemColor,
                  )}
                  aria-hidden="true"
                >
                  <Clock3 className="h-4 w-4" />
                </span>
                <article className="rounded-xl border bg-card p-4 shadow-soft">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        item.actionType === "create"
                          ? "success"
                          : item.actionType === "update"
                            ? "info"
                            : "danger"
                      }
                    >
                      {labelByAction[item.actionType]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(item.happenedAt)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-foreground">{item.summary}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <UserCircle2 className="h-4 w-4" aria-hidden="true" />
                    <span>{item.actorDisplayName}</span>
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Fecha no disponible";
  return parsed.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

