import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";

interface FieldProps {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

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
