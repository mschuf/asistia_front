/**
 * @file AppShell.tsx
 * @description Layout principal con header, menú lateral y barra inferior móvil.
 */
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { BarChart3, Building2, ChevronDown, FilePlus2, History, LogOut, Menu, MessageSquareText, Moon, Sun, ClipboardList, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { IrsErsSwitch } from "@/components/layout/IrsErsSwitch";
import { InstallAppButton } from "@/components/layout/InstallAppButton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { roleLabel } from "@/utils/role";

interface AppShellProps {
  children: ReactNode;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

type NavTab = "metricas" | "crear" | "historial";

const ticketNavItems: Array<{ label: string; tab: NavTab; icon: typeof FilePlus2 }> = [
  { label: "Indicadores", tab: "metricas", icon: BarChart3 },
  { label: "Crear", tab: "crear", icon: FilePlus2 },
  { label: "Historial", tab: "historial", icon: History },
];

const superAdminNavItems: Array<{
  label: string;
  icon: typeof Building2;
  path: string | null;
  enabled: boolean;
}> = [
  { label: "Empresas", icon: Building2, path: "/admin/empresas", enabled: true },
  { label: "Prompts", icon: MessageSquareText, path: "/admin/prompts", enabled: true },
  { label: "Reporte irs", icon: History, path: "/admin/reporte-irs", enabled: true },
];

interface NavSectionProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  showBorder?: boolean;
  children: ReactNode;
}

/** Sección colapsable del menú lateral con chevron. */
function NavSection({ title, expanded, onToggle, showBorder = false, children }: NavSectionProps) {
  return (
    <div className={cn("space-y-1", showBorder && "border-t pt-3")}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <span>{title}</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition-transform duration-200", expanded && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      {expanded ? <div className="space-y-1">{children}</div> : null}
    </div>
  );
}

/**
 * Shell de la aplicación con navegación, tema y cierre de sesión.
 * @param props - Contenido hijo, tema y toggle de tema.
 * @returns Layout con header, aside y main.
 */
export function AppShell({ children, theme, onToggleTheme }: AppShellProps) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { isAuthenticated, user, role, isSuperAdmin, canAccessTickets, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentTab = readNavTab(searchParams.get("tab"));
  const onTicketsRoute = location.pathname.startsWith("/irs");
  const onErsRoute = location.pathname.startsWith("/ers");
  const isErsMode = onErsRoute;
  const onSuperAdminRoute = location.pathname.startsWith("/admin");
  const isTicketsHistorialLayout = onTicketsRoute && currentTab === "historial";
  const [irsExpanded, setIrsExpanded] = useState(onTicketsRoute);
  const [superAdminExpanded, setSuperAdminExpanded] = useState(onSuperAdminRoute);
  const isWideHistoryLayout = isTicketsHistorialLayout || location.pathname === '/ers';

  useEffect(() => {
    if (onTicketsRoute || onErsRoute) setIrsExpanded(true);
  }, [onTicketsRoute, onErsRoute]);

  useEffect(() => {
    if (onSuperAdminRoute) setSuperAdminExpanded(true);
  }, [onSuperAdminRoute]);

  /** Cierra sesión con toast y cierra el menú. @returns void */
  function handleLogout() {
    setLoggingOut(true);
    void logout({ showToast: true })
      .finally(() => {
        setLoggingOut(false);
        setOpen(false);
      });
  }

  /** @param tab - Pestaña de tickets destino. @returns void */
  function goToTab(tab: NavTab) {
    const search = tab === "metricas" ? "" : `?tab=${tab}`;
    navigate(`/irs${search}`);
    setOpen(false);
  }

  /** @param path - Ruta super-admin. @returns void */
  function goToSuperAdmin(path: string) {
    navigate(path);
    setOpen(false);
  }

  return (
    <div className={cn("min-h-screen bg-background", isErsMode && "ers-theme")}>
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              type="button"
              aria-label="Abrir menú"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </Button>
            <Link
              to="/irs"
              className="min-w-0 rounded-sm text-left transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Ir a IRS — asistIA Gestión Inteligente de Servicios"
            >
              <p className="truncate text-base font-semibold leading-tight">asistIA</p>
              <p className="truncate text-xs text-muted-foreground">
                Gestión Inteligente de Servicios
              </p>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <IrsErsSwitch className="gap-1.5 text-[11px] sm:hidden" />
            <Button
              variant="outline"
              size="icon"
              type="button"
              aria-label="Cambiar tema"
              onClick={onToggleTheme}
              title="Cambiar tema"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 -translate-x-full flex-col border-r bg-card shadow-soft transition-transform",
          open && "translate-x-0",
        )}
        aria-hidden={!open}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link
            to="/irs"
            className="min-w-0 rounded-sm text-left transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={() => setOpen(false)}
            aria-label="Ir a IRS — asistIA Gestión Inteligente de Servicios"
          >
            <p className="truncate font-semibold leading-tight">asistIA</p>
            <p className="truncate text-xs text-muted-foreground">Gestión Inteligente de Servicios</p>
          </Link>
          <Button variant="ghost" size="icon" type="button" aria-label="Cerrar menú" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {canAccessTickets ? (
            <NavSection
              title="IRS"
              expanded={irsExpanded}
              onToggle={() => setIrsExpanded((current) => !current)}
            >
              {ticketNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = onTicketsRoute && currentTab === item.tab;
                return (
                  <button
                    key={item.tab}
                    type="button"
                    onClick={() => goToTab(item.tab)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                      isActive && "bg-muted text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </button>
                );
              })}
              {role !== "final_user" ? (
                <button
                  type="button"
                  onClick={() => {
                    navigate("/ers");
                    setOpen(false);
                  }}
                  aria-current={onErsRoute ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                    onErsRoute && "bg-muted text-foreground",
                  )}
                >
                  <ClipboardList className="h-4 w-4" aria-hidden="true" />
                  ERS / Proyectos
                </button>
              ) : null}
            </NavSection>
          ) : null}
          {isSuperAdmin ? (
            <NavSection
              title="Super-Admin"
              expanded={superAdminExpanded}
              onToggle={() => setSuperAdminExpanded((current) => !current)}
              showBorder
            >
              {superAdminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.path ? isNavPathActive(location.pathname, item.path) : false;

                if (!item.enabled || !item.path) {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      disabled
                      aria-disabled="true"
                      className="flex w-full cursor-not-allowed items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-muted-foreground/70"
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {item.label}
                    </button>
                  );
                }

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => goToSuperAdmin(item.path!)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                      isActive && "bg-muted text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </button>
                );
              })}
            </NavSection>
          ) : null}
        </nav>
        {isAuthenticated ? (
          <div className="border-t p-3">
            {user ? (
              <div className="mb-3 px-3">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.login}</p>
                <p className="mt-1 text-xs font-medium text-primary">{roleLabel(role)}</p>
              </div>
            ) : null}
            <Button
              variant="ghost"
              type="button"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
              disabled={loggingOut}
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
            </Button>
          </div>
        ) : null}
        <div className="border-t p-3">
          <InstallAppButton />
        </div>
        <p className="border-t px-4 py-3 text-center text-xs text-muted-foreground">
          Hecho con{" "}
          <span className="text-destructive/80" aria-hidden="true">
            💡
          </span>{" "}
          por el equipo TI
        </p> 
      </aside>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/35"
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <main
        className={cn(
          "py-5 pb-20 sm:py-7 sm:pb-7",
          isWideHistoryLayout ? "w-full min-w-0 px-4 sm:px-6" : "container",
        )}
      >
        {children}
      </main>

      <BottomTabBar />
    </div>
  );
}

/** @param pathname - Ruta actual. @param path - Ruta del ítem. @returns Si coincide exacta o como prefijo con `/`. */
function isNavPathActive(pathname: string, path: string): boolean {
  return pathname === path || pathname.startsWith(`${path}/`);
}

/** @param value - Query `tab`. @returns Pestaña de navegación normalizada. */
function readNavTab(value: string | null): NavTab {
  if (value === "crear" || value === "create") return "crear";
  if (value === "historial" || value === "history") return "historial";
  return "metricas";
}
