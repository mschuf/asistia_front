/**
 * @file PorteriaIndicadoresPage.tsx
 * @description Vista de indicadores y seguimiento en tiempo real.
 */
import { PorteriaCards } from "@/components/porteria/PorteriaCards";
import { PorteriaSeguimientoCards } from "@/components/porteria/PorteriaSeguimientoCards";
import { useRegisterPorteriaRefresh } from "@/context/PorteriaRefreshContext";
import { usePorteriaIndicadores } from "@/hooks/usePorteria";

/** @returns Metricas y visitantes activos de Porteria. */
export default function PorteriaIndicadoresPage() {
  const { metrics, trackingVisitors, loading, refresh } = usePorteriaIndicadores();

  useRegisterPorteriaRefresh(refresh, loading);

  return (
    <>
      <PorteriaCards metrics={metrics} />
      <PorteriaSeguimientoCards visitors={trackingVisitors} />
    </>
  );
}
