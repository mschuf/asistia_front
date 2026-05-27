import type { ReactNode } from "react";
import type { AuthUser } from "../auth";

export interface ProtectedRouteProps {
  children: ReactNode;
  roles?: AuthUser["role"][];
}
