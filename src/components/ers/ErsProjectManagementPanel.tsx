/**
 * @file ErsProjectManagementPanel.tsx
 * @description Sección de gestión TI del proyecto ERS.
 */
import type { ErsProjectState, ErsTechnician } from "@/api/ers";
import { ErsTechnicianDualList } from "@/components/ers/ErsTechnicianDualList";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ErsEditState } from "@/types/pages/ers-page.types";

interface ErsProjectManagementPanelProps {
  form: ErsEditState;
  onChange: (next: ErsEditState) => void;
  states: ErsProjectState[];
  technicians: ErsTechnician[];
  teamTechnicians?: ErsTechnician[];
  loadingStates: boolean;
  loadingTechnicians: boolean;
  loadingTeamTechnicians?: boolean;
  showTeamLocations?: boolean;
  progressFromTasks: number;
  teamSearch: string;
  onTeamSearchChange: (value: string) => void;
}

/** Panel de aprobador/estado/equipo del proyecto. */
export function ErsProjectManagementPanel({
  form,
  onChange,
  states,
  technicians,
  teamTechnicians = technicians,
  loadingStates,
  loadingTechnicians,
  loadingTeamTechnicians = loadingTechnicians,
  showTeamLocations = false,
  progressFromTasks,
  teamSearch,
  onTeamSearchChange,
}: ErsProjectManagementPanelProps) {
  const addTeamMember = (userId: string) => {
    if (form.teamMemberIds.includes(userId)) return;
    onChange({
      ...form,
      teamMemberIds: [...form.teamMemberIds, userId],
    });
  };

  const removeTeamMember = (userId: string) => {
    onChange({
      ...form,
      teamMemberIds: form.teamMemberIds.filter((id) => id !== userId),
    });
  };

  return (
    <div className="space-y-4 rounded-md border bg-card p-4 shadow-soft">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[26fr_17fr_17fr]">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Aprobador</span>
          <Select
            value={form.approverId}
            onChange={(event) => onChange({ ...form, approverId: event.target.value })}
            disabled={loadingTechnicians}
          >
            <option value="">Sin aprobador</option>
            {technicians.map((user) => (
              <option key={user.id} value={String(user.id)}>
                {user.fullName}{user.locationName ? ` · ${user.locationName}` : ""}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Estado</span>
          <Select
            value={form.projectStateId}
            onChange={(event) => onChange({ ...form, projectStateId: event.target.value })}
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
          onChange={(event) => onTeamSearchChange(event.target.value)}
          placeholder="Buscar técnico..."
        />
        <ErsTechnicianDualList
          technicians={teamTechnicians}
          selectedIds={form.teamMemberIds}
          onAdd={addTeamMember}
          onRemove={removeTeamMember}
          loading={loadingTeamTechnicians}
          filterQuery={teamSearch}
          showLocation={showTeamLocations}
          selectedTitle="Equipo seleccionado"
          emptyTechniciansMessage="Sin técnicos para mostrar."
          emptyAvailableMessage="No hay más técnicos que coincidan con la búsqueda."
          emptySelectedMessage="Selecciona uno o más técnicos de la columna izquierda."
        />
      </div>
    </div>
  );
}
