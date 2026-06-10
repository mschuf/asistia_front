/**
 * @file input.tsx
 * @description Campo de texto nativo estilizado con soporte de ref y atributos HTML estándar.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

/** Props del componente Input; extiende los atributos nativos de `<input>`. */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * Input de formulario con estilos del sistema de diseño.
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
