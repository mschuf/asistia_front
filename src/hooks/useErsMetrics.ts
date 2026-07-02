import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/api/apiClient';
import { obtenerMetricasErs, type ErsMetricsResponse } from '@/api/ers';
import { isAbortError } from '@/lib/http';

export function useErsMetrics() {
  const [metrics, setMetrics] = useState<ErsMetricsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  const refresh = useCallback(async () => {
    setReloadToken((value) => value + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    void obtenerMetricasErs({ signal: controller.signal })
      .then(setMetrics)
      .catch((loadError) => {
        if (controller.signal.aborted || isAbortError(loadError)) return;
        setError(loadError instanceof ApiError ? loadError.message : 'No se pudieron cargar los indicadores ERS.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reloadToken]);

  return { metrics, loading, error, refresh };
}
