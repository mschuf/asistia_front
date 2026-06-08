import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/api/apiClient";
import { isAbortError } from "@/lib/http";
import { fetchTiMetrics } from "@/services/ticketsService";
import type { TiMetricsResponse } from "@/types/asistia";

interface UseTiMetricsOptions {
  enabled: boolean;
  /** Recargar al mostrar la pestaña Indicadores (p. ej. tras crear un ticket en otra pestaña). */
  isTabActive?: boolean;
}

export function useTiMetrics({ enabled, isTabActive = false }: UseTiMetricsOptions) {
  const [metrics, setMetrics] = useState<TiMetricsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refreshMetrics = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchTiMetrics({ showBackdrop: true });
      setMetrics(data);
    } catch (err) {
      const message =
        err instanceof ApiError || err instanceof Error
          ? err.message
          : "No se pudieron cargar las indicadores";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !isTabActive) return;

    const controller = new AbortController();
    const { signal } = controller;

    async function loadMetrics() {
      setLoading(true);
      setError("");
      try {
        const data = await fetchTiMetrics({ signal });
        if (signal.aborted) return;
        setMetrics(data);
      } catch (err) {
        if (signal.aborted || isAbortError(err)) return;
        const message =
          err instanceof ApiError || err instanceof Error
            ? err.message
            : "No se pudieron cargar las indicadores";
        setError(message);
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    }

    void loadMetrics();
    return () => controller.abort();
  }, [enabled, isTabActive]);

  return { metrics, loading, error, refreshMetrics };
}
