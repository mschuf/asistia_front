import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { BarChart3, FilePlus2, History, LogOut, Mail, Menu, Moon, Sun, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
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
  { label: "Crear", tab: "crear", icon: FilePlus2 },
  { label: "Historial", tab: "historial", icon: History },
  { label: "Métricas", tab: "metricas", icon: BarChart3 },
];

const toolNavItems = [{ label: "Probar correo", path: "/mail/test", icon: Mail }] as const;

export function AppShell({ children, theme, onToggleTheme }: AppShellProps) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { isAuthenticated, user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentTab = readNavTab(searchParams.get("tab"));
  const onTicketsRoute = location.pathname.startsWith("/tickets");

  function handleLogout() {
    setLoggingOut(true);
    void logout({ showToast: true })
      .finally(() => {
        setLoggingOut(false);
        setOpen(false);
      });
  }

  function goToTab(tab: NavTab) {
    const search = tab === "metricas" ? "" : `?tab=${tab}`;
    navigate(`/tickets${search}`);
    setOpen(false);
  }

  function goToPath(path: string) {
    navigate(path);
    setOpen(false);
  }

  return (
    <div className="min-h-screen bg-background">
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
            <div className="min-w-0">
              <p className="truncate text-base font-semibold leading-tight">asistIA</p>
              <p className="truncate text-xs text-muted-foreground">
                Gestión Inteligente de Requerimientos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
          <span className="font-semibold">asistIA</span>
          <Button variant="ghost" size="icon" type="button" aria-label="Cerrar menú" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
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
          <div className="my-2 border-t" role="presentation" />
          <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Herramientas</p>
          {toolNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => goToPath(item.path)}
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
        <p className="border-t px-4 py-3 text-center text-xs text-muted-foreground">
          Hecho con{" "}
          <span className="text-destructive/80" aria-hidden="true">
            ♥
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

      <main className="container py-5 pb-20 sm:py-7 sm:pb-7">{children}</main>

      <BottomTabBar />
    </div>
  );
}

function readNavTab(value: string | null): NavTab {
  if (value === "crear" || value === "create") return "crear";
  if (value === "historial" || value === "history") return "historial";
  return "metricas";
}
