/**
 * @file public-only-route.types.ts
 * @description Tipos de la ruta accesible solo sin sesión activa (p. ej. login).
 */
import type { ReactElement } from "react";

/** Props del componente PublicOnlyRoute. */
export interface PublicOnlyRouteProps {
  children: ReactElement;
}
