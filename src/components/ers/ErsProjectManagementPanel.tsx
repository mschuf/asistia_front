/**
 * @file ErsProjectManagementPanel.tsx
 * @description Sección de gestión TI del proyecto ERS.
 */
import { Calculator, Wand2 } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import {
  obtenerOrdenEjecucionErs,
  type ErsExecutionOrderItem,
  type ErsProjectState,
  type ErsTechnician,
} from "@/api/ers";
import { ApiError } from "@/api/apiClient";
import { ErsTechnicianDualList } from "@/components/ers/ErsTechnicianDualList";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/types/auth";
import type { ErsEditState, ErsFieldErrors, ErsFocusSignal } from "@/types/pages/ers-page.types";

const NO_SEDE_TITLE = "Selecciona una sede antes de continuar";

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
  showPriority?: boolean;
  progressFromTasks: number;
  teamSearch: string;
  onTeamSearchChange: (value: string) => void;
  /** Sede seleccionada, para resolver el alcance del orden de ejecución. */
  executionOrderContext: { locationId?: number; excludeProjectId?: number };
  errors?: ErsFieldErrors;
  focusSignal?: ErsFocusSignal | null;
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
  showPriority = true,
  progressFromTasks,
  teamSearch,
  onTeamSearchChange,
  executionOrderContext,
  errors,
  focusSignal,
}: ErsProjectManagementPanelProps) {
  const { isSuperAdmin } = useAuth();
  const toast = useToast();
  const currentUserIsListed = technicians.some((technician) => technician.id === currentUser.id);
  const executionOrderInputRef = useRef<HTMLInputElement>(null);
  const requestTypeRef = useRef<HTMLSelectElement>(null);
  const [executionOrderListOpen, setExecutionOrderListOpen] = useState(false);
  const [executionOrderItems, setExecutionOrderItems] = useState<ErsExecutionOrderItem[]>([]);
  const [loadingExecutionOrder, setLoadingExecutionOrder] = useState(false);

  const hasExecutionOrderScope = Boolean(executionOrderContext.locationId);
  const executionOrderTitle = hasExecutionOrderScope ? undefined : NO_SEDE_TITLE;
  const requestTypeInvalid =
    Boolean(errors?.requestType) && (!form.requestType || !requestTypes.includes(form.requestType));
  const executionOrderInvalid = Boolean(errors?.executionOrder);

  useEffect(() => {
    if (!focusSignal) return;
    switch (focusSignal.field) {
      case "executionOrder":
        executionOrderInputRef.current?.focus();
        break;
      case "requestType":
        requestTypeRef.current?.focus();
        break;
      default:
        break;
    }
  }, [focusSignal]);

  const fetchExecutionOrderSuggestion = async () => {
    if (!executionOrderContext.locationId) return null;
    setLoadingExecutionOrder(true);
    try {
      return await obtenerOrdenEjecucionErs(
        { locationId: executionOrderContext.locationId, excludeProjectId: executionOrderContext.excludeProjectId },
        { showBackdrop: false },
      );
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo obtener el orden de ejecución.",
        "ERS",
      );
      return null;
    } finally {
      setLoadingExecutionOrder(false);
    }
  };

  const handleShowExecutionOrderList = async () => {
    const suggestion = await fetchExecutionOrderSuggestion();
    if (!suggestion) return;
    setExecutionOrderItems(suggestion.items);
    setExecutionOrderListOpen(true);
  };

  const handleSuggestNextExecutionOrder = async () => {
    const suggestion = await fetchExecutionOrderSuggestion();
    if (!suggestion) return;
    onChange({ ...form, executionOrder: String(suggestion.nextAvailable) });
  };

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
          <span className="text-muted-foreground">
            Tipo de Requerimiento <span className="text-destructive">*</span>
          </span>
          <Select
            ref={requestTypeRef}
            className={cn(requestTypeInvalid && "border-destructive focus-visible:ring-destructive")}
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
            disabled={!isSuperAdmin}
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
            disabled={!isSuperAdmin || loadingTechnicians}
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
        {showPriority && isSuperAdmin ? (
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
        ) : null}
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Orden de ejecución</span>
          <div className="relative" title={executionOrderTitle}>
            <Input
              ref={executionOrderInputRef}
              type="number"
              min={1}
              className={cn(
                "pr-16",
                executionOrderInvalid && "border-destructive focus-visible:ring-destructive",
              )}
              value={form.executionOrder}
              onChange={(event) => onChange({ ...form, executionOrder: event.target.value })}
              disabled={!isSuperAdmin || !hasExecutionOrderScope}
              placeholder="Sin asignar"
              title={executionOrderTitle}
            />
            <div className="absolute right-1 top-1/2 flex -translate-y-1/2 gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                disabled={!isSuperAdmin || !hasExecutionOrderScope || loadingExecutionOrder}
                onClick={() => void handleShowExecutionOrderList()}
                title={executionOrderTitle ?? "Ver órdenes de ejecución usados en esta sede"}
                aria-label="Ver órdenes de ejecución usados en esta sede"
              >
                <Calculator className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                disabled={!isSuperAdmin || !hasExecutionOrderScope || loadingExecutionOrder}
                onClick={() => void handleSuggestNextExecutionOrder()}
                title={executionOrderTitle ?? "Sugerir el siguiente orden de ejecución libre"}
                aria-label="Sugerir el siguiente orden de ejecución libre"
              >
                <Wand2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
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

      <Dialog
        open={executionOrderListOpen}
        onOpenChange={setExecutionOrderListOpen}
        title="Órdenes de ejecución en esta sede"
        description="Proyectos de la misma sede y su orden de ejecución actual."
        className="max-w-md"
      >
        {executionOrderItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay proyectos en esta sede.
          </p>
        ) : (
          <ul className="divide-y">
            {executionOrderItems.map((item) => (
              <li key={item.projectId} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="min-w-0 truncate">{item.projectName}</span>
                <span
                  className={cn(
                    "shrink-0 tabular-nums",
                    item.executionOrder === null ? "text-muted-foreground" : "font-medium",
                  )}
                >
                  {item.executionOrder ?? "Sin asignar"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Dialog>
    </div>
  );
}
