/**
 * @file ErsEditDialog.tsx
 * @description Diálogo de edición TI (transacción 2 en guardado único).
 */
import { useEffect, useMemo, useState } from "react";
import { ApiError } from "@/api/apiClient";
import { guardarErs, listarTecnicosPorSede, type ErsTechnician } from "@/api/ers";
import { ErsTasksEditor } from "@/components/ers/ErsTasksEditor";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/context/ToastContext";
import type { ErsEditDialogProps, ErsEditState } from "@/types/pages/ers-page.types";

/** Modal de edición TI del proyecto ERS. */
export function ErsEditDialog({
  open,
  onOpenChange,
  detail,
  states,
  loadingStates,
  onSaved,
}: ErsEditDialogProps) {
  const toast = useToast();
  const [form, setForm] = useState<ErsEditState>({
    approverId: "",
    projectStateId: "",
    teamMemberIds: [],
    tasks: [],
  });
  const [technicians, setTechnicians] = useState<ErsTechnician[]>([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);
  const [saving, setSaving] = useState(false);
  const [teamSearch, setTeamSearch] = useState("");

  useEffect(() => {
    if (!open || !detail) return;
    setForm({
      approverId: detail.approverId ? String(detail.approverId) : "",
      projectStateId: detail.projectStateId ? String(detail.projectStateId) : "",
      teamMemberIds: detail.team.map((member) => String(member.userId)),
      tasks: detail.tasks.map((task) => ({
        id: task.id,
        name: task.name,
        content: task.content ?? "",
        percentDone: task.percentDone,
        projectStateId: task.projectStateId ? String(task.projectStateId) : "",
        userId: task.userId ? String(task.userId) : "",
        planStartDate: toDateTimeLocal(task.planStartDate),
        planEndDate: toDateTimeLocal(task.planEndDate),
      })),
    });
  }, [detail, open]);

  useEffect(() => {
    if (!open || !detail?.locationId) {
      setTechnicians([]);
      return;
    }
    let cancelled = false;
    setLoadingTechnicians(true);
    void listarTecnicosPorSede({ locationId: detail.locationId, limit: 200 })
      .then((response) => {
        if (!cancelled) setTechnicians(response.items);
      })
      .catch((error) => {
        if (cancelled) return;
        const message = error instanceof ApiError ? error.message : "No se pudieron cargar técnicos.";
        toast.error(message, "ERS");
      })
      .finally(() => {
        if (!cancelled) setLoadingTechnicians(false);
      });

    return () => {
      cancelled = true;
    };
  }, [detail?.locationId, open, toast]);

  const selectedTeamIds = useMemo(() => new Set(form.teamMemberIds), [form.teamMemberIds]);

  const filteredTeam = useMemo(() => {
    const query = teamSearch.trim().toLowerCase();
    const baseList = query
      ? technicians.filter((item) => item.fullName.toLowerCase().includes(query))
      : technicians;

    return [...baseList].sort((a, b) => {
      const aSelected = selectedTeamIds.has(String(a.id));
      const bSelected = selectedTeamIds.has(String(b.id));
      if (aSelected !== bSelected) return aSelected ? -1 : 1;
      return a.fullName.localeCompare(b.fullName, "es", { sensitivity: "base" });
    });
  }, [teamSearch, technicians, selectedTeamIds]);

  if (!detail) return null;

  const progressFromTasks =
    form.tasks.length > 0
      ? Math.round(
          form.tasks.reduce((acc, task) => acc + (Number.isFinite(task.percentDone) ? task.percentDone : 0), 0) /
            form.tasks.length,
        )
      : 0;

  const toggleTeamMember = (userId: string) => {
    setForm((current) => {
      const exists = current.teamMemberIds.includes(userId);
      return {
        ...current,
        teamMemberIds: exists
          ? current.teamMemberIds.filter((id) => id !== userId)
          : [...current.teamMemberIds, userId],
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await guardarErs(detail.projectId, {
        approverId: form.approverId ? Number(form.approverId) : undefined,
        projectStateId: form.projectStateId ? Number(form.projectStateId) : undefined,
        teamMemberIds: form.teamMemberIds.map((id) => Number(id)),
        tasks: form.tasks.map((task) => ({
          name: task.name.trim(),
          content: task.content.trim() || undefined,
          percentDone: Math.max(0, Math.min(100, Number(task.percentDone) || 0)),
          projectStateId: task.projectStateId ? Number(task.projectStateId) : undefined,
          userId: task.userId ? Number(task.userId) : undefined,
          planStartDate: toIsoDate(task.planStartDate),
          planEndDate: toIsoDate(task.planEndDate),
        })),
      });
      onSaved(saved);
      onOpenChange(false);
      toast.success("Proyecto ERS actualizado.", "ERS");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No se pudo guardar el proyecto ERS.";
      toast.error(message, "ERS");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Editar ERS #${detail.projectId}`}
      description="Vista TI: aprobador, equipo, tareas y estado."
      className="max-w-5xl"
      allowOverflow
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Aprobador (GLPI)</span>
            <Select
              value={form.approverId}
              onChange={(event) => setForm((current) => ({ ...current, approverId: event.target.value }))}
              disabled={loadingTechnicians}
            >
              <option value="">Sin aprobador</option>
              {technicians.map((user) => (
                <option key={user.id} value={String(user.id)}>
                  {user.fullName}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">Estado</span>
            <Select
              value={form.projectStateId}
              onChange={(event) => setForm((current) => ({ ...current, projectStateId: event.target.value }))}
              disabled={loadingStates}
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
            <span className="text-muted-foreground">Avance del proyecto</span>
            <Input value={`${progressFromTasks}%`} readOnly />
          </label>
        </div>

        <div className="space-y-2 rounded-md border p-3">
          <p className="text-sm font-medium">Equipo</p>
          <Input
            value={teamSearch}
            onChange={(event) => setTeamSearch(event.target.value)}
            placeholder="Buscar técnico..."
          />
          <div className="max-h-[8.5rem] overflow-y-auto rounded-md border p-2">
            {filteredTeam.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin técnicos para mostrar.</p>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {filteredTeam.map((user) => {
                  const checked = selectedTeamIds.has(String(user.id));
                  return (
                    <label key={user.id} className="flex min-w-0 items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTeamMember(String(user.id))}
                      />
                      <span className="truncate">{user.fullName}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <ErsTasksEditor
          tasks={form.tasks}
          states={states}
          technicians={technicians}
          onChange={(tasks) => setForm((current) => ({ ...current, tasks }))}
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function toDateTimeLocal(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function toIsoDate(value: string): string | undefined {
  const normalized = value.trim();
  if (!normalized) return undefined;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString();
}

