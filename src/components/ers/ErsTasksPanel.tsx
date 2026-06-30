/**
 * @file ErsTasksPanel.tsx
 * @description Sección de tareas del proyecto ERS con editor reutilizable.
 */
import type { ErsProjectState, ErsTechnician } from "@/api/ers";
import { ErsTasksEditor } from "@/components/ers/ErsTasksEditor";
import type { ErsEditState } from "@/types/pages/ers-page.types";

interface ErsTasksPanelProps {
  form: ErsEditState;
  onChange: (next: ErsEditState) => void;
  states: ErsProjectState[];
  technicians: ErsTechnician[];
  assigneeOptions: ErsTechnician[];
}

/** Panel de edición de tareas con detalle completo por ítem. */
export function ErsTasksPanel({
  form,
  onChange,
  states,
  technicians,
  assigneeOptions,
}: ErsTasksPanelProps) {
  return (
    <div className="rounded-md border bg-card p-4 shadow-soft">
      <ErsTasksEditor
        tasks={form.tasks}
        states={states}
        technicians={technicians}
        assigneeOptions={assigneeOptions}
        onChange={(tasks) => onChange({ ...form, tasks })}
      />
    </div>
  );
}
