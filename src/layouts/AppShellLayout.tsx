/**
 * @file AppShellLayout.tsx
 * @description Layout autenticado que envuelve páginas internas con shell, tema y outlet de rutas.
 */
import { Outlet } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useTheme } from "@/hooks/useTheme";

/**
 * Layout de aplicación con barra lateral, cabecera y área de contenido anidado.
 * @returns Shell principal con `Outlet` para rutas hijas.
 */
export default function AppShellLayout() {
  const { theme, toggleTheme } = useTheme();

  return (
    <AppShell theme={theme} onToggleTheme={toggleTheme}>
      <Outlet />
    </AppShell>
  );
}
