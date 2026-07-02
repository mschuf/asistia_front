import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export type WorkspaceMode = 'irs' | 'ers';
export type WorkspaceTab = 'metricas' | 'crear' | 'historial';

export function resolveWorkspaceMode(pathname: string): WorkspaceMode {
  return pathname.startsWith('/ers') ? 'ers' : 'irs';
}

export function resolveWorkspaceTab(pathname: string, search: string): WorkspaceTab {
  if (pathname.startsWith('/ers/indicadores')) return 'metricas';
  if (pathname.startsWith('/ers/nuevo')) return 'crear';
  if (pathname === '/ers' || pathname.startsWith('/ers?')) return 'historial';
  const value = new URLSearchParams(search).get('tab');
  if (value === 'crear' || value === 'create') return 'crear';
  if (value === 'historial' || value === 'history') return 'historial';
  return 'metricas';
}

export function workspaceTabPath(mode: WorkspaceMode, tab: WorkspaceTab): string {
  if (mode === 'ers') {
    if (tab === 'metricas') return '/ers/indicadores';
    if (tab === 'crear') return '/ers/nuevo';
    return '/ers';
  }
  if (tab === 'crear') return '/irs?tab=crear';
  if (tab === 'historial') return '/irs?tab=historial';
  return '/irs';
}

export function isWorkspaceRoute(pathname: string): boolean {
  return pathname.startsWith('/irs') || pathname.startsWith('/ers');
}

interface IrsErsSwitchProps {
  className?: string;
}

/** Selector IRS/ERS respaldado por rutas navegables. */
export function IrsErsSwitch({ className }: IrsErsSwitchProps) {
  const { isTechnician, isSuperAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  if ((!isTechnician && !isSuperAdmin) || !isWorkspaceRoute(location.pathname)) return null;

  const mode = resolveWorkspaceMode(location.pathname);
  const tab = resolveWorkspaceTab(location.pathname, location.search);
  const isErsMode = mode === 'ers';

  return (
    <div className={cn('flex items-center gap-2 text-xs font-semibold text-foreground', className)}>
      <span className={cn(!isErsMode && 'text-primary')}>IRS</span>
      <button
        type='button'
        role='switch'
        aria-checked={isErsMode}
        aria-label={`Activar modo ${isErsMode ? 'IRS' : 'ERS'}`}
        title={`Activar modo ${isErsMode ? 'IRS' : 'ERS'}`}
        onClick={() => navigate(workspaceTabPath(isErsMode ? 'irs' : 'ers', tab))}
        className='relative h-7 w-12 shrink-0 rounded-full border border-primary bg-primary shadow-inner transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
      >
        <span
          className={cn(
            'absolute left-1 top-1 h-[18px] w-[18px] rounded-full border border-border bg-background shadow-sm transition-transform duration-200',
            isErsMode && 'translate-x-5',
          )}
        />
      </button>
      <span className={cn(isErsMode && 'text-primary')}>ERS</span>
    </div>
  );
}
