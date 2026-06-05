import { BarChart3, FilePlus2, History } from "lucide-react";
import { useLocation, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

type BottomTab = "metricas" | "crear" | "historial";

interface BottomTabItem {
  tab: BottomTab;
  label: string;
  icon: typeof FilePlus2;
}

const items: BottomTabItem[] = [
  { tab: "metricas", label: "Métricas", icon: BarChart3 },
  { tab: "crear", label: "Crear", icon: FilePlus2 },
  { tab: "historial", label: "Historial", icon: History },
];

function readBottomTab(value: string | null): BottomTab {
  if (value === "crear" || value === "create") return "crear";
  if (value === "historial" || value === "history") return "historial";
  return "metricas";
}

export function BottomTabBar() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated || !location.pathname.startsWith("/tickets")) {
    return null;
  }

  const current = readBottomTab(searchParams.get("tab"));

  const handleSelect = (tab: BottomTab) => {
    if (tab === "metricas") {
      setSearchParams({});
    } else {
      setSearchParams({ tab });
    }
  };

  return (
    <nav
      aria-label="Navegación rápida"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur sm:hidden"
    >
      <ul className="mx-auto flex max-w-screen-md items-stretch">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = current === item.tab;
          return (
            <li key={item.tab} className="flex-1">
              <button
                type="button"
                onClick={() => handleSelect(item.tab)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex w-full flex-col items-center justify-center gap-1 px-2 py-2 text-xs font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
