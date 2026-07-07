/**
 * @file ErsEditSidebar.tsx
 * @description Menú contextual de la pantalla de edición ERS.
 */
import { cn } from "@/lib/utils";

export type ErsEditSection = "escalador" | "gestion" | "tareas" | "documentos";

interface ErsEditSidebarProps {
  activeSection: ErsEditSection;
  onChange: (section: ErsEditSection) => void;
  tasksCount: number;
  documentsCount: number;
}

export const ERS_EDIT_SECTIONS: Array<{ id: ErsEditSection; label: string }> = [
  { id: "escalador", label: "1. Datos iniciales" },
  { id: "gestion", label: "2. Gestión del proyecto" },
  { id: "tareas", label: "3. Tareas" },
  { id: "documentos", label: "4. Documentos" },
];

/** Menú vertical de navegación interna de edición ERS. */
export function ErsEditSidebar({ activeSection, onChange, tasksCount, documentsCount }: ErsEditSidebarProps) {
  return (
    <nav className="rounded-md border bg-card p-2">
      <ul className="space-y-1">
        {ERS_EDIT_SECTIONS.map((section) => (
          <li key={section.id}>
            <button
              type="button"
              onClick={() => onChange(section.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors",
                activeSection === section.id
                  ? "bg-muted font-semibold text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <span>{section.label}</span>
              {section.id === "tareas" ? (
                <span className="rounded-full border px-2 py-0.5 text-xs tabular-nums">{tasksCount}</span>
              ) : section.id === "documentos" ? (
                <span className="rounded-full border px-2 py-0.5 text-xs tabular-nums">{documentsCount}</span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
