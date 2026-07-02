import { useEffect, useMemo, useState } from 'react';
import { BarChart3, FilePlus2, History, RefreshCw } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  IrsErsSwitch,
  resolveWorkspaceMode,
  resolveWorkspaceTab,
  workspaceTabPath,
  type WorkspaceTab,
} from '@/components/layout/IrsErsSwitch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import {
  findLocationById,
  locationCompanyName,
  locationDisplayName,
} from '@/lib/tickets';
import { cn } from '@/lib/utils';
import { listLocations } from '@/services/ticketsService';
import type { AsistiaLocation } from '@/types/asistia';
import { roleLabel } from '@/utils/role';

const tabs: Array<{ tab: WorkspaceTab; label: string; icon: typeof BarChart3 }> = [
  { tab: 'metricas', label: 'Indicadores', icon: BarChart3 },
  { tab: 'crear', label: 'Crear', icon: FilePlus2 },
  { tab: 'historial', label: 'Historial', icon: History },
];

interface WorkspaceHeaderProps {
  locations?: AsistiaLocation[];
  onRefresh?: () => void;
  refreshing?: boolean;
}

/** Cabecera común de las tres vistas principales IRS/ERS. */
export function WorkspaceHeader({
  locations,
  onRefresh,
  refreshing = false,
}: WorkspaceHeaderProps) {
  const { user, role, isTechnician, isSuperAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [fallbackLocations, setFallbackLocations] = useState<AsistiaLocation[]>([]);

  useEffect(() => {
    if (locations?.length || !user?.locationId) return;
    const controller = new AbortController();
    void listLocations({ signal: controller.signal, showBackdrop: false })
      .then(setFallbackLocations)
      .catch(() => setFallbackLocations([]));
    return () => controller.abort();
  }, [locations, user?.locationId]);

  const mode = resolveWorkspaceMode(location.pathname);
  const activeTab = resolveWorkspaceTab(location.pathname, location.search);
  const visibleTabs =
    mode === "ers" && !isTechnician && !isSuperAdmin
      ? tabs.filter((item) => item.tab === "historial")
      : tabs;
  const locationPool = locations?.length ? locations : fallbackLocations;
  const userLocation = useMemo(
    () => findLocationById(locationPool, user?.locationId),
    [locationPool, user?.locationId],
  );
  const userLocationName = userLocation ? locationDisplayName(userLocation) : null;
  const userCompanyName = userLocationName ? locationCompanyName(userLocationName) : null;

  return (
    <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
      <div className='flex flex-wrap gap-2'>
        <Badge variant={role === 'technician' ? 'success' : 'default'}>
          {roleLabel(role)}
        </Badge>
        {user?.name ? (
          <Badge className='bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950/40 dark:text-orange-200 dark:ring-orange-800'>
            {user.name}
          </Badge>
        ) : null}
        {userCompanyName ? <Badge variant='info'>{userCompanyName}</Badge> : null}
        {userLocationName ? <Badge variant='default'>{userLocationName}</Badge> : null}
      </div>

      <div className='ml-auto hidden shrink-0 items-center gap-2 sm:flex'>
        <IrsErsSwitch />
        {onRefresh ? (
          <div className='flex shrink-0 rounded-md border bg-card p-1'>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              aria-label='Actualizar'
              title='Actualizar'
              disabled={refreshing}
              onClick={onRefresh}
            >
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} aria-hidden='true' />
            </Button>
          </div>
        ) : null}
        <div className='flex shrink-0 rounded-md border bg-card p-1'>
          {visibleTabs.map(({ tab, label, icon: Icon }) => (
            <Button
              key={tab}
              type='button'
              size='sm'
              variant={activeTab === tab ? 'default' : 'ghost'}
              className='gap-2'
              onClick={() => {
                if (activeTab !== tab) navigate(workspaceTabPath(mode, tab));
              }}
            >
              <Icon className='h-4 w-4' aria-hidden='true' />
              {label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
