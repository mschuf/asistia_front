/**
 * @file ErsProjectManagementPanel.tsx
 * @description Sección de gestión TI del proyecto ERS.
 */
import type { ErsProjectState, ErsTechnician } from "@/api/ers";
import { ErsTechnicianDualList } from "@/components/ers/ErsTechnicianDualList";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { AuthUser } from "@/types/auth";
import type { ErsEditState } from "@/types/pages/ers-page.types";

interface ErsProjectManagementPanelProps {
  form: ErsEditState;
  onChange: (next: ErsEditState) => void;
  states: ErsProjectState[];
  requestTypes: string[];
  technicians: ErsTechnician[];
  currentUser: Pick<AuthUser, "id" | "name">;
  teamTechnicians?: ErsTechnician[];
  loadingStates: boolean;
  requestTypesDisabled: boolean;
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
  requestTypes,
  technicians,
  currentUser,
  teamTechnicians = technicians,
  loadingStates,
  requestTypesDisabled,
  loadingTechnicians,
  loadingTeamTechnicians = loadingTechnicians,
  showTeamLocations = false,
  progressFromTasks,
  teamSearch,
  onTeamSearchChange,
}: ErsProjectManagementPanelProps) {
  const currentUserIsListed = technicians.some((technician) => technician.id === currentUser.id);

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
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Tipo de Requerimiento</span>
          <Select
            value={form.requestType}
            onChange={(event) => onChange({ ...form, requestType: event.target.value })}
            disabled={requestTypesDisabled}
          >
            <option value="">Seleccionar tipo</option>
            {requestTypes.map((requestType) => (
              <option key={requestType} value={requestType}>
                {requestType}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Aprobado</span>
          <Select
            value={form.approved ? "si" : "no"}
            onChange={(event) => {
              const approved = event.target.value === "si";
              onChange({
                ...form,
                approved,
                approverId: approved ? String(currentUser.id) : "",
              });
            }}
          >
            <option value="no">No</option>
            <option value="si">Sí</option>
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Aprobador</span>
          <Select
            value={form.approverId}
            onChange={(event) => {
              const approverId = event.target.value;
              onChange({ ...form, approverId, approved: approverId !== "" });
            }}
            disabled={loadingTechnicians}
          >
            <option value="">Sin aprobador</option>
            {!currentUserIsListed ? (
              <option value={String(currentUser.id)}>{currentUser.name}</option>
            ) : null}
            {technicians.map((user) => (
              <option key={user.id} value={String(user.id)}>
                {user.fullName}{user.locationName ? ` · ${user.locationName}` : ""}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Prioridad TI</span>
          <Select
            value={form.priority}
            onChange={(event) => onChange({ ...form, priority: Number(event.target.value) })}
            disabled={!form.approved}
          >
            <option value={6}>Mayor</option>
            <option value={5}>Muy alta</option>
            <option value={4}>Alta</option>
            <option value={3}>Media</option>
            <option value={2}>Baja</option>
            <option value={1}>Muy baja</option>
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
