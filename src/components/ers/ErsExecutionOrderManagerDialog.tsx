/**
 * @file ErsExecutionOrderManagerDialog.tsx
 * @description Reordenamiento por arrastre del orden de ejecución de los proyectos de una sede.
 */
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type Modifier,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, GripVertical, Loader2, X } from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError } from "@/api/apiClient";
import {
  listarSedesErs,
  obtenerOrdenEjecucionErs,
  reordenarOrdenEjecucionErs,
  type ErsExecutionOrderItem,
  type ErsLocation,
} from "@/api/ers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useToast } from "@/context/ToastContext";
import { buildLocationFilterOptions } from "@/lib/tickets";
import { cn } from "@/lib/utils";

/** Bloquea el eje horizontal: la lista solo se reordena verticalmente. */
const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });

interface ErsExecutionOrderManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Se invoca tras un guardado correcto, para que la vista de fondo recargue sus datos. */
  onSaved?: () => void;
}

/**
 * Las dos zonas viven en un único estado para que mover un proyecto entre ellas sea una
 * transición atómica y pura, en lugar de dos `setState` encadenados.
 */
interface OrderDraft {
  ordered: ErsExecutionOrderItem[];
  unassigned: ErsExecutionOrderItem[];
}

/** Fila arrastrable de la zona con orden asignado. */
const SortableRow = memo(function SortableRow({
  item,
  position,
  onUnassign,
}: {
  item: ErsExecutionOrderItem;
  position: number;
  onUnassign: (projectId: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.projectId,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-md border bg-card px-2 py-1.5",
        isDragging && "opacity-40",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Reordenar ${item.projectName}`}
        className="shrink-0 cursor-grab touch-none rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" aria-hidden="true" />
      </button>
      <span className="w-7 shrink-0 text-center text-sm font-semibold tabular-nums text-primary">
        {position}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm" title={item.projectName}>
        {item.projectName}
      </span>
      {item.sharedAcrossLocations ? (
        <Badge
          variant="warning"
          className="shrink-0"
          title="Este proyecto también tiene tickets en otra sede y comparte un único orden entre todas"
        >
          Multi-sede
        </Badge>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        title="Quitar el orden de ejecución"
        aria-label={`Quitar el orden de ${item.projectName}`}
        onClick={() => onUnassign(item.projectId)}
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </Button>
    </li>
  );
});

/**
 * Diálogo de superadmin para reorganizar por arrastre el orden de ejecución de una sede.
 * El arrastre solo muta el estado local; el guardado envía la sede completa en una transacción.
 */
export function ErsExecutionOrderManagerDialog({
  open,
  onOpenChange,
  onSaved,
}: ErsExecutionOrderManagerDialogProps) {
  const toast = useToast();
  const [locations, setLocations] = useState<ErsLocation[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [locationId, setLocationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<OrderDraft>({ ordered: [], unassigned: [] });
  const [baseline, setBaseline] = useState<ErsExecutionOrderItem[]>([]);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  // Ref y no state: el listener de Escape del Dialog lo consulta en el mismo tick del evento.
  const draggingRef = useRef(false);

  const sensors = useSensors(
    // Sin umbral, un clic en el handle se interpretaría como arrastre y bloquearía los botones.
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLocationsLoading(true);
    void listarSedesErs({ signal: controller.signal, showBackdrop: false })
      .then(setLocations)
      .catch(() => {
        if (!controller.signal.aborted) toast.error("No se pudieron cargar las sedes.", "ERS");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLocationsLoading(false);
      });
    return () => controller.abort();
  }, [open, toast]);

  const applyServerList = useCallback((items: ErsExecutionOrderItem[]) => {
    // El backend ya devuelve los asignados primero y ordenados; los nulos al final.
    setDraft({
      ordered: items.filter((item) => item.executionOrder !== null),
      unassigned: items.filter((item) => item.executionOrder === null),
    });
    setBaseline(items);
  }, []);

  useEffect(() => {
    const parsedId = Number(locationId);
    if (!open || !parsedId) {
      applyServerList([]);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    void obtenerOrdenEjecucionErs(
      { locationId: parsedId },
      { signal: controller.signal, showBackdrop: false },
    )
      .then((suggestion) => applyServerList(suggestion.items))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        applyServerList([]);
        toast.error(
          error instanceof ApiError ? error.message : "No se pudo cargar el orden de la sede.",
          "ERS",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [applyServerList, locationId, open, toast]);

  const locationOptions = useMemo(() => buildLocationFilterOptions(locations), [locations]);

  /**
   * Estado proyectado que se muestra y se envía: el orden es la posición en `ordered`, así que
   * la vista no puede desincronizarse del payload.
   */
  const projected = useMemo(
    () => [
      ...draft.ordered.map((item, index) => ({ ...item, executionOrder: index + 1 })),
      ...draft.unassigned.map((item) => ({ ...item, executionOrder: null })),
    ],
    [draft],
  );

  const dirty = useMemo(() => {
    if (projected.length !== baseline.length) return true;
    const previous = new Map(baseline.map((item) => [item.projectId, item.executionOrder]));
    return projected.some((item) => previous.get(item.projectId) !== item.executionOrder);
  }, [baseline, projected]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    draggingRef.current = true;
    setActiveId(event.active.id);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    draggingRef.current = false;
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setDraft((current) => {
      const from = current.ordered.findIndex((item) => item.projectId === active.id);
      const to = current.ordered.findIndex((item) => item.projectId === over.id);
      if (from === -1 || to === -1) return current;
      return { ...current, ordered: arrayMove(current.ordered, from, to) };
    });
  }, []);

  const handleDragCancel = useCallback(() => {
    draggingRef.current = false;
    setActiveId(null);
  }, []);

  const handleAssignNext = useCallback((projectId: number) => {
    setDraft((current) => {
      const target = current.unassigned.find((item) => item.projectId === projectId);
      if (!target) return current;
      return {
        ordered: [...current.ordered, target],
        unassigned: current.unassigned.filter((item) => item.projectId !== projectId),
      };
    });
  }, []);

  const handleUnassign = useCallback((projectId: number) => {
    setDraft((current) => {
      const target = current.ordered.find((item) => item.projectId === projectId);
      if (!target) return current;
      return {
        ordered: current.ordered.filter((item) => item.projectId !== projectId),
        unassigned: [...current.unassigned, target],
      };
    });
  }, []);

  const handleSave = async () => {
    const parsedId = Number(locationId);
    if (!parsedId || !dirty) return;
    setSaving(true);
    try {
      const fresh = await reordenarOrdenEjecucionErs({
        locationId: parsedId,
        items: projected.map((item) => ({
          projectId: item.projectId,
          executionOrder: item.executionOrder,
        })),
      });
      applyServerList(fresh);
      toast.success("Orden de ejecución actualizado.", "ERS");
      onSaved?.();
      // Se cierra con el prop directo y no con `handleOpenChange`: ya no hay cambios pendientes
      // que confirmar, y `dirty` todavía no refleja el `applyServerList` de esta misma tanda.
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(
        error instanceof ApiError ? error.message : "No se pudo guardar el orden de ejecución.",
        "ERS",
      );
    } finally {
      setSaving(false);
    }
  };

  const { ordered, unassigned } = draft;
  const activeItem = ordered.find((item) => item.projectId === activeId) ?? null;
  const activePosition = ordered.findIndex((item) => item.projectId === activeId) + 1;
  const busy = loading || saving;

  const handleOpenChange = (next: boolean) => {
    // dnd-kit cancela el arrastre con Escape; sin esto la misma pulsación cerraría el diálogo.
    if (!next && draggingRef.current) return;
    if (
      !next &&
      dirty &&
      !window.confirm("Hay cambios sin guardar en el orden. ¿Cerrar y descartarlos?")
    ) {
      return;
    }
    onOpenChange(next);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Orden de ejecución por sede"
      description="Arrastra para reorganizar. Al guardar, la sede se renumera de 1 en adelante sin huecos, así que pueden cambiar proyectos que no moviste."
      className="max-w-2xl"
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="ers-order-location" className="text-sm font-medium">
            Sede
          </label>
          <SearchableSelect
            id="ers-order-location"
            value={locationId}
            onChange={setLocationId}
            options={locationOptions}
            placeholder="Selecciona una sede"
            disabled={locationsLoading || saving}
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Cargando proyectos...
          </div>
        ) : !locationId ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Selecciona una sede para ver sus proyectos.
          </p>
        ) : projected.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay proyectos en esta sede.
          </p>
        ) : (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <SortableContext
                items={ordered.map((item) => item.projectId)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-1.5">
                  {ordered.map((item, index) => (
                    <SortableRow
                      key={item.projectId}
                      item={item}
                      position={index + 1}
                      onUnassign={handleUnassign}
                    />
                  ))}
                </ul>
              </SortableContext>
              <DragOverlay>
                {activeItem ? (
                  <div className="flex items-center gap-2 rounded-md border bg-card px-2 py-1.5 shadow-soft ring-2 ring-primary">
                    <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="w-7 shrink-0 text-center text-sm font-semibold tabular-nums text-primary">
                      {activePosition}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">{activeItem.projectName}</span>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>

            {ordered.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ningún proyecto de esta sede tiene orden asignado.
              </p>
            ) : null}

            {unassigned.length > 0 ? (
              <div className="space-y-1.5 border-t pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Sin orden asignado
                </p>
                <ul className="space-y-1.5">
                  {unassigned.map((item) => (
                    <li
                      key={item.projectId}
                      className="flex items-center gap-2 rounded-md border border-dashed px-2 py-1.5"
                    >
                      <span className="w-7 shrink-0 text-center text-sm text-muted-foreground">—</span>
                      <span className="min-w-0 flex-1 truncate text-sm" title={item.projectName}>
                        {item.projectName}
                      </span>
                      {item.sharedAcrossLocations ? (
                        <Badge
                          variant="warning"
                          className="shrink-0"
                          title="Este proyecto también tiene tickets en otra sede y comparte un único orden entre todas"
                        >
                          Multi-sede
                        </Badge>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0 gap-1.5"
                        title={`Asignar el orden ${ordered.length + 1}`}
                        onClick={() => handleAssignNext(item.projectId)}
                      >
                        <ArrowDown className="h-4 w-4" aria-hidden="true" />
                        Asignar siguiente
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        )}

        <div className="flex items-center justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!dirty || busy}
            onClick={() => applyServerList(baseline)}
          >
            Descartar
          </Button>
          <Button
            type="button"
            size="sm"
            className="gap-2"
            disabled={!dirty || busy}
            onClick={() => void handleSave()}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Guardar orden
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
