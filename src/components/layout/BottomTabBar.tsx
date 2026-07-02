import { BarChart3, FilePlus2, History } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  resolveWorkspaceMode,
  resolveWorkspaceTab,
  workspaceTabPath,
  type WorkspaceTab,
} from '@/components/layout/IrsErsSwitch';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const items: Array<{ tab: WorkspaceTab; label: string; icon: typeof FilePlus2 }> = [
  { tab: 'metricas', label: 'Indicadores', icon: BarChart3 },
  { tab: 'crear', label: 'Crear', icon: FilePlus2 },
  { tab: 'historial', label: 'Historial', icon: History },
];

export function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isTechnician, isSuperAdmin } = useAuth();
  const isMainWorkspace =
    location.pathname === '/irs' ||
    location.pathname === '/ers' ||
    location.pathname === '/ers/indicadores' ||
    location.pathname === '/ers/nuevo';
  if (!isAuthenticated || !isMainWorkspace) return null;

  const mode = resolveWorkspaceMode(location.pathname);
  const current = resolveWorkspaceTab(location.pathname, location.search);
  const visibleItems =
    mode === "ers" && !isTechnician && !isSuperAdmin
      ? items.filter((item) => item.tab === "historial")
      : items;

  return (
    <nav
      aria-label='Navegación rápida'
      className='fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur sm:hidden'
    >
      <ul className='mx-auto flex max-w-screen-md items-stretch'>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = current === item.tab;
          return (
            <li key={item.tab} className='flex-1'>
              <button
                type='button'
                onClick={() => {
                  if (!active) navigate(workspaceTabPath(mode, item.tab));
                }}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex w-full flex-col items-center justify-center gap-1 px-2 py-2 text-xs font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className='h-5 w-5' aria-hidden='true' />
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
