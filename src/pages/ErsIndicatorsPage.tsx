import { ErsMetrics } from '@/components/ers/ErsMetrics';
import { WorkspaceHeader } from '@/components/layout/WorkspaceHeader';
import { useErsMetrics } from '@/hooks/useErsMetrics';

export default function ErsIndicatorsPage() {
  const { metrics, loading, error, refresh } = useErsMetrics();
  return (
    <div className='space-y-5'>
      <WorkspaceHeader onRefresh={() => void refresh()} refreshing={loading} />
      {error ? (
        <p className='rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive'>{error}</p>
      ) : null}
      <ErsMetrics metrics={metrics} loading={loading} onRefresh={() => void refresh()} />
    </div>
  );
}
