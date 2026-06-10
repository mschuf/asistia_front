/**
 * @file role.ts
 * @description Utilidades para resolver roles de usuario y etiquetas legibles en la UI.
 */
import type { ReactNode } from "react";
import type { AuthUser } from "../types/auth";

export type Role = AuthUser["role"];

/**
 * Obtiene el rol del usuario autenticado o `null` si no hay sesión.
 * @param user - Usuario autenticado o `null`.
 * @returns Rol del usuario o `null`.
 */
export function resolveRole(user: AuthUser | null): Role | null {
  return user?.role ?? null;
}

/**
 * Devuelve la etiqueta en español para mostrar el rol en la interfaz.
 * @param role - Rol del usuario o `null`.
 * @returns Texto legible del rol ("TI", "Usuario", etc.).
 */
export function roleLabel(role: Role | null): string {
  if (role === "technician") return "TI";
  if (role === "final_user") return "Usuario";
  return "Usuario";
}

/**
 * Indica si el rol corresponde a un técnico de soporte.
 * @param role - Rol del usuario o `null`.
 * @returns `true` si el rol es `technician`.
 */
export function isTechnicianRole(role: Role | null): boolean {
  return role === "technician";
}
