/**
 * @file textarea.tsx
 * @description Área de texto multilínea estilizada con soporte de ref y atributos HTML estándar.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

/** Props del componente Textarea; extiende los atributos nativos de `<textarea>`. */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

/**
 * Textarea de formulario con altura mínima y estilos del sistema de diseño.
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
