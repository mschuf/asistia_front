/**
 * @file ErsTasksEditor.tsx
 * @description Editor de tareas del proyecto para la vista TI.
 */
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ErsProjectState, ErsTechnician } from "@/api/ers";
import type { ErsEditState } from "@/types/pages/ers-page.types";
import { useState } from "react";

interface ErsTasksEditorProps {
  tasks: ErsEditState["tasks"];
  states: ErsProjectState[];
  technicians: ErsTechnician[];
  onChange: (tasks: ErsEditState["tasks"]) => void;
}

/** Editor de tareas con botón "+" y carga local. */
export function ErsTasksEditor({ tasks, states, technicians, onChange }: ErsTasksEditorProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTask, setNewTask] = useState<ErsEditState["tasks"][number]>({
    name: "",
    content: "",
    percentDone: 0,
    projectStateId: "",
    userId: "",
    planStartDate: "",
    planEndDate: "",
  });

  const openCreateModal = () => {
    setNewTask({
      name: "",
      content: "",
      percentDone: 0,
      projectStateId: "",
      userId: "",
      planStartDate: "",
      planEndDate: "",
    });
    setCreateModalOpen(true);
  };

  const createTask = () => {
    onChange([...tasks, { ...newTask }]);
    setCreateModalOpen(false);
  };

  const removeTask = (index: number) => {
    onChange(tasks.filter((_, taskIndex) => taskIndex !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Tareas del proyecto</p>
        <Button type="button" size="sm" variant="outline" onClick={openCreateModal}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Agregar
        </Button>
      </div>

      {tasks.length === 0 ? (
        <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          No hay tareas. Usa &quot;Agregar&quot; para crear la primera.
        </p>
      ) : null}

      {tasks.map((task, index) => (
        <div key={`task-${index}`} className="rounded-md border px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="grid min-w-0 flex-1 grid-cols-1 gap-1 text-sm md:grid-cols-3 md:gap-2">
              <p className="truncate">
                <span className="text-muted-foreground">Nombre:</span>{" "}
                <span className="font-medium">{task.name.trim() || `Tarea ${index + 1}`}</span>
              </p>
              <p className="truncate">
                <span className="text-muted-foreground">Estado:</span>{" "}
                <span>
                  {states.find((state) => String(state.id) === task.projectStateId)?.name ?? "Sin estado"}
                </span>
              </p>
              <p className="truncate">
                <span className="text-muted-foreground">Responsable:</span>{" "}
                <span>
                  {technicians.find((user) => String(user.id) === task.userId)?.fullName ?? "Sin responsable"}
                </span>
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => removeTask(index)}
              aria-label={`Eliminar tarea ${index + 1}`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      ))}

      <Dialog
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        title="Agregar tarea"
        description="Completa los datos de la nueva tarea."
        className="max-w-3xl"
      >
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Nombre</span>
              <Input
                value={newTask.name}
                onChange={(event) => setNewTask((current) => ({ ...current, name: event.target.value }))}
                placeholder="Nombre de tarea"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">% Avance</span>
              <Input
                type="number"
                min={0}
                max={100}
                value={newTask.percentDone}
                onChange={(event) =>
                  setNewTask((current) => ({
                    ...current,
                    percentDone: Math.max(0, Math.min(100, Number(event.target.value))),
                  }))
                }
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Estado tarea</span>
              <Select
                value={newTask.projectStateId}
                onChange={(event) =>
                  setNewTask((current) => ({ ...current, projectStateId: event.target.value }))
                }
              >
                <option value="">Sin estado</option>
                {states.map((state) => (
                  <option key={state.id} value={String(state.id)}>
                    {state.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Responsable</span>
              <Select
                value={newTask.userId}
                onChange={(event) => setNewTask((current) => ({ ...current, userId: event.target.value }))}
              >
                <option value="">Sin responsable</option>
                {technicians.map((user) => (
                  <option key={user.id} value={String(user.id)}>
                    {user.fullName}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Inicio planificado</span>
              <Input
                type="datetime-local"
                value={newTask.planStartDate}
                onChange={(event) =>
                  setNewTask((current) => ({ ...current, planStartDate: event.target.value }))
                }
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Fin planificado</span>
              <Input
                type="datetime-local"
                value={newTask.planEndDate}
                onChange={(event) =>
                  setNewTask((current) => ({ ...current, planEndDate: event.target.value }))
                }
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Descripción</span>
            <Textarea
              className="min-h-20"
              value={newTask.content}
              onChange={(event) => setNewTask((current) => ({ ...current, content: event.target.value }))}
            />
          </label>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={createTask}>
              Agregar tarea
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

