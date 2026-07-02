/**
 * @file auth-access.ts
 * @description Utilidades para determinar acceso a módulos según grupos y rol del usuario.
 */
import type { AuthUser } from "../types/auth";

/** Flags mínimos para evaluar permisos de módulos. */
export interface AccessFlags {
  role: AuthUser["role"] | null;
  isSuperAdmin: boolean;
}

/**
 * Indica si el usuario puede acceder al módulo de tickets.
 * @param flags - Flags de sesión del usuario.
 * @returns `true` si puede ver y usar tickets.
 */
export function canAccessTickets(flags: AccessFlags): boolean {
  return Boolean(flags.role);
}

/** Indica si el usuario puede ejecutar operaciones de TI. */
export function hasTechnicianAccess(user: AuthUser | null): boolean {
  return user?.role === "technician" || user?.isSuperAdmin === true;
}

/**
 * Resuelve la ruta de inicio tras autenticación según el perfil del usuario.
 * @param flags - Flags de sesión del usuario.
 * @returns Ruta por defecto para usuarios autenticados.
 */
export function resolveDefaultAuthenticatedPath(_flags: AccessFlags): "/irs" {
  return "/irs";
}

/**
 * Extrae flags de acceso desde el usuario de sesión.
 * @param user - Usuario autenticado o `null`.
 * @returns Flags normalizados para evaluar permisos.
 */
export function accessFlagsFromUser(user: AuthUser | null): AccessFlags {
  return {
    role: user?.role ?? null,
    isSuperAdmin: Boolean(user?.isSuperAdmin),
  };
}
