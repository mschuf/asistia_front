import { useState } from 'react';
import { ArrowRightLeft, Building2, FolderKanban, History, Inbox, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ErsMetricSlice, ErsMetricsResponse } from '@/api/ers';
import { MobileRefreshFab } from '@/components/layout/MobileRefreshFab';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { useAuth } from '@/context/AuthContext';

type ErsChartMode = 'system' | 'area';

const ERS_ACTIVE_BAR_COLORS = [
  '#2563eb',
  '#16a34a',
  '#ea580c',
  '#7c3aed',
  '#0891b2',
  '#dc2626',
  '#ca8a04',
  '#059669',
  '#db2777',
  '#4f46e5',
  '#9333ea',
  '#0d9488',
  '#be123c',
  '#65a30d',
  '#475569',
];

function getErsActiveBarBackground(index: number): string {
  if (index < ERS_ACTIVE_BAR_COLORS.length) return ERS_ACTIVE_BAR_COLORS[index];

  const offset = index - ERS_ACTIVE_BAR_COLORS.length;
  const firstColor = ERS_ACTIVE_BAR_COLORS[offset % ERS_ACTIVE_BAR_COLORS.length];
  const secondColor = ERS_ACTIVE_BAR_COLORS[
    Math.floor(offset / ERS_ACTIVE_BAR_COLORS.length + offset + 5) % ERS_ACTIVE_BAR_COLORS.length
  ];

  return `repeating-linear-gradient(-45deg, ${firstColor}, ${firstColor} 5px, ${secondColor} 5px, ${secondColor} 10px)`;
}

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
  const [chartMode, setChartMode] = useState<ErsChartMode>('system');
  if (loading && !metrics) {
    return <div className='flex min-h-40 items-center justify-center'><Loading label='Cargando indicadores ERS...' /></div>;
  }
  if (!metrics) return <MobileRefreshFab visible onClick={onRefresh} loading={loading} />;
  const chartRows = chartMode === 'system' ? metrics.activeBySystem : metrics.activeByArea;
  const chartTitle = chartMode === 'system' ? 'Proyectos activos por SISTEMA' : 'Proyectos activos por ÁREA/GRUPO';
  const nextChartLabel = chartMode === 'system'
    ? 'Ver proyectos activos por área/grupo'
    : 'Ver proyectos activos por sistema';
  const sorted = [...chartRows].sort((a, b) => b.active - a.active || a.name.localeCompare(b.name, 'es'));
  const max = Math.max(0, ...sorted.map((item) => item.active));

  return (
    <>
      <div className='space-y-4'>
        <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
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
          <MetricCard
            label='Sin aprobar'
            slice={metrics.unapproved}
            icon={Inbox}
            className='border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200'
            onClick={() => navigate('/ers?lifecycle=active&approved=unapproved&assignedMemberId=')}
          />
        </div>

        <div className='rounded-md border bg-card p-4'>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <p className='text-sm font-medium'>{chartTitle}</p>
            </div>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              aria-label={nextChartLabel}
              title={nextChartLabel}
              onClick={() => setChartMode((value) => (value === 'system' ? 'area' : 'system'))}
            >
              <ArrowRightLeft className='h-4 w-4' aria-hidden='true' />
            </Button>
          </div>
          {sorted.length ? (
            <ul className='scrollbar-brand mt-4 max-h-96 space-y-3 overflow-y-auto pr-2'>
              {sorted.map((item, index) => {
                const width = max > 0 ? Math.round((item.active / max) * 100) : 0;
                return (
                  <li key={`${chartMode}-${item.name}`}>
                    <div className='mb-1 flex items-center justify-between gap-2 text-sm'>
                      <span className='truncate font-medium'>{item.name}</span>
                      <span className='tabular-nums text-muted-foreground'>{item.active}</span>
                    </div>
                    <div className='h-2 overflow-hidden rounded-full bg-muted'>
                      <div
                        className='h-full min-w-[2px] rounded-full'
                        style={{ background: getErsActiveBarBackground(index), width: `${width}%` }}
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
