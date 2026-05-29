import type { ReactNode } from "react";
import type { AuthUser } from "../types/auth";

export type Role = AuthUser["role"];

export function resolveRole(user: AuthUser | null): Role | null {
  return user?.role ?? null;
}

export function roleLabel(role: Role | null): string {
  if (role === "technician") return "TI";
  if (role === "final_user") return "Usuario";
  return "Usuario";
}

export function isTechnicianRole(role: Role | null): boolean {
  return role === "technician";
}
