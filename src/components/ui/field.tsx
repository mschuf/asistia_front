/**
 * @file field.tsx
 * @description Campo de formulario con etiqueta asociada y mensaje de error opcional.
 */
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";

/** Props del componente Field. */
interface FieldProps {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Agrupa etiqueta, control hijo y mensaje de validación en un bloque accesible.
 * @param props - Identificador del campo, etiqueta, error y contenido del control.
 */
export function Field({ id, label, error, children, className }: FieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p className="text-sm text-destructive" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
