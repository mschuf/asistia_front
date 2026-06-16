/**
 * @file auth-access.ts
 * @description Utilidades para determinar acceso a módulos según grupos y rol del usuario.
 */
import type { AuthUser } from "../types/auth";

/** Flags mínimos para evaluar permisos de módulos. */
export interface AccessFlags {
  isPorteriaUser: boolean;
  role: AuthUser["role"] | null;
  isSuperAdmin: boolean;
}

/**
 * Indica si el usuario pertenece solo al grupo portería (sin rol TI ni super-admin).
 * @param flags - Flags de sesión del usuario.
 * @returns `true` si debe acceder únicamente al módulo Portería.
 */
export function isPorteriaOnlyUser(flags: AccessFlags): boolean {
  return Boolean(flags.isPorteriaUser && flags.role === "final_user" && !flags.isSuperAdmin);
}

/**
 * Indica si el usuario puede acceder al módulo de tickets.
 * @param flags - Flags de sesión del usuario.
 * @returns `true` si puede ver y usar tickets.
 */
export function canAccessTickets(flags: AccessFlags): boolean {
  return !isPorteriaOnlyUser(flags);
}

/**
 * Resuelve la ruta de inicio tras autenticación según el perfil del usuario.
 * @param flags - Flags de sesión del usuario.
 * @returns Ruta por defecto para usuarios autenticados.
 */
export function resolveDefaultAuthenticatedPath(flags: AccessFlags): "/porteria" | "/tickets" {
  return isPorteriaOnlyUser(flags) ? "/porteria" : "/tickets";
}

/**
 * Extrae flags de acceso desde el usuario de sesión.
 * @param user - Usuario autenticado o `null`.
 * @returns Flags normalizados para evaluar permisos.
 */
export function accessFlagsFromUser(user: AuthUser | null): AccessFlags {
  return {
    isPorteriaUser: Boolean(user?.isPorteriaUser),
    role: user?.role ?? null,
    isSuperAdmin: Boolean(user?.isSuperAdmin),
  };
}
