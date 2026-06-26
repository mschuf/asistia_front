/**
 * @file porteria-navigation.ts
 * @description Rutas y resolucion de tabs del modulo Porteria.
 */
import type { PorteriaTab } from "@/types/pages/porteria-page.types";

export const PORTERIA_TAB_PATHS: Record<PorteriaTab, string> = {
  indicadores: "/porteria",
  visita: "/porteria/visitas",
  historial: "/porteria/historial",
};

/** @param pathname - Ruta actual. @returns true si la pagina usa encabezado propio sin el titulo global. */
export function isPorteriaStandalonePage(pathname: string): boolean {
  return (
    pathname.startsWith("/porteria/personas") ||
    pathname.startsWith("/porteria/proveedores") ||
    pathname.startsWith("/porteria/motivos-visita")
  );
}

/** @param pathname - Ruta actual. @returns Tab activa segun la URL, o null si no aplica. */
export function resolvePorteriaTab(pathname: string): PorteriaTab | null {
  if (!pathname.startsWith("/porteria")) return null;
  if (pathname.startsWith("/porteria/visitas")) return "visita";
  if (pathname.startsWith("/porteria/historial")) return "historial";
  if (pathname.startsWith("/porteria/personas")) return null;
  if (pathname.startsWith("/porteria/motivos-visita")) return null;
  if (pathname.startsWith("/porteria/proveedores")) return null;
  return "indicadores";
}
