/**
 * @file label.tsx
 * @description Etiqueta de formulario accesible con estilos tipográficos consistentes.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

/** Props del componente Label; extiende los atributos nativos de `<label>`. */
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

/**
 * Etiqueta asociada a un control de formulario mediante `htmlFor`.
 */
const Label = React.forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn("text-sm font-medium leading-none text-foreground", className)}
    {...props}
  />
));
Label.displayName = "Label";

export { Label };
