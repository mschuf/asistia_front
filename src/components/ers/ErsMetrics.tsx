import { Building2, FolderKanban, History, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ErsMetricSlice, ErsMetricsResponse } from '@/api/ers';
import { MobileRefreshFab } from '@/components/layout/MobileRefreshFab';
import { Loading } from '@/components/ui/loading';
import { useAuth } from '@/context/AuthContext';
import { getSiteMetricBarStyle } from '@/lib/site-metric-bar-colors';

function Percent({ slice }: { slice: ErsMetricSlice }) {
  return (
    <p className='mt-1 text-sm text-muted-foreground'>
      <span className='font-medium tabular-nums text-foreground'>{slice.activePercent}%</span>
      <span className='ml-1'>({slice.activeThisMonth} / {slice.totalThisMonth} del mes)</span>
    </p>
  );
}

function MetricCard({
  label,
  slice,
  icon: Icon,
  className,
  onClick,
}: {
  label: string;
  slice: ErsMetricSlice;
  icon: typeof Users;
  className: string;
  onClick: () => void;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={`rounded-md border p-4 text-left transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
    >
      <div className='flex items-center justify-between gap-3'>
        <span className='text-sm font-medium'>{label}</span>
        <Icon className='h-5 w-5' aria-hidden='true' />
      </div>
      <p className='mt-3 text-2xl font-semibold tabular-nums'>
        {slice.active}{' '}
        <span className='text-base font-medium'>{slice.active === 1 ? 'proyecto activo' : 'proyectos activos'}</span>
      </p>
      <Percent slice={slice} />
    </button>
  );
}

export function ErsMetrics({
  metrics,
  loading,
  onRefresh,
}: {
  metrics: ErsMetricsResponse | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  if (loading && !metrics) {
    return <div className='flex min-h-40 items-center justify-center'><Loading label='Cargando indicadores ERS...' /></div>;
  }
  if (!metrics) return <MobileRefreshFab visible onClick={onRefresh} loading={loading} />;
  const sorted = [...metrics.activeByLocation].sort((a, b) => b.active - a.active || a.name.localeCompare(b.name, 'es'));
  const max = Math.max(0, ...sorted.map((item) => item.active));

  return (
    <>
      <div className='space-y-4'>
        <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-3'>
          <MetricCard
            label='Mi Grupo'
            slice={metrics.myGroup}
            icon={Users}
            className='border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-200'
            onClick={() => navigate('/ers?lifecycle=active&assignedMemberId=')}
          />
          {metrics.mySite ? (
            <MetricCard
              label='Mi Sede'
              slice={metrics.mySite}
              icon={Building2}
              className='border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-200'
              onClick={() => navigate(`/ers?lifecycle=active&locationId=${user?.locationId ?? ''}&assignedMemberId=`)}
            />
          ) : null}
          <MetricCard
            label='Mis Proyectos'
            slice={metrics.myProjects}
            icon={FolderKanban}
            className='border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200'
            onClick={() => navigate(`/ers?lifecycle=active&assignedMemberId=${user?.id ?? ''}`)}
          />
        </div>

        <div className='rounded-md border bg-card p-4'>
          <p className='text-sm font-medium'>Indicadores</p>
          <p className='mt-1 text-xs text-muted-foreground'>Proyectos activos por sede</p>
          {sorted.length ? (
            <ul className='scrollbar-brand mt-4 max-h-96 space-y-3 overflow-y-auto pr-2'>
              {sorted.map((item) => {
                const width = max > 0 ? Math.round((item.active / max) * 100) : 0;
                return (
                  <li key={item.locationId ?? 'without-location'}>
                    <div className='mb-1 flex items-center justify-between gap-2 text-sm'>
                      <span className='truncate font-medium'>{item.name}</span>
                      <span className='tabular-nums text-muted-foreground'>{item.active}</span>
                    </div>
                    <div className='h-2 overflow-hidden rounded-full bg-muted'>
                      <div
                        className='h-full min-w-[2px] rounded-full'
                        style={{ ...getSiteMetricBarStyle(item.name), width: `${width}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className='mt-2 text-sm text-muted-foreground'>No hay proyectos activos.</p>
          )}
        </div>
        <p className='flex items-center gap-1 text-xs text-muted-foreground'>
          <History className='h-3.5 w-3.5' aria-hidden='true' />
          Los cards abren Historial con los filtros ERS correspondientes.
        </p>
      </div>
      <MobileRefreshFab visible onClick={onRefresh} loading={loading} />
    </>
  );
}
