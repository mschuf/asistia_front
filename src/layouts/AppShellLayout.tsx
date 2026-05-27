import { Outlet } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useTheme } from "@/hooks/useTheme";

export default function AppShellLayout() {
  const { theme, toggleTheme } = useTheme();

  return (
    <AppShell theme={theme} onToggleTheme={toggleTheme}>
      <Outlet />
    </AppShell>
  );
}
