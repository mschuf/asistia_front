/**
 * @file ErsTechnicianDualList.tsx
 * @description Selector de técnicos en dos columnas: disponibles y seleccionados.
 */
import { ChevronRight, X } from "lucide-react";
import { useMemo } from "react";
import type { ErsTechnician } from "@/api/ers";

interface ErsTechnicianDualListProps {
  technicians: ErsTechnician[];
  selectedIds: string[];
  onAdd: (userId: string) => void;
  onRemove: (userId: string) => void;
  loading?: boolean;
  filterQuery?: string;
  showLocation?: boolean;
  availableTitle?: string;
  selectedTitle?: string;
  emptyTechniciansMessage?: string;
  emptyAvailableMessage?: string;
  emptySelectedMessage?: string;
}

const sortByName = (items: ErsTechnician[]) =>
  [...items].sort((a, b) => a.fullName.localeCompare(b.fullName, "es", { sensitivity: "base" }));

/** Lista dual para asignar técnicos entre columnas disponibles y seleccionados. */
export function ErsTechnicianDualList({
  technicians,
  selectedIds,
  onAdd,
  onRemove,
  loading = false,
  filterQuery = "",
  showLocation = false,
  availableTitle = "Técnicos disponibles",
  selectedTitle = "Seleccionados",
  emptyTechniciansMessage = "No hay técnicos disponibles para esta sede.",
  emptyAvailableMessage = "Todos los técnicos ya están asignados.",
  emptySelectedMessage = "Selecciona uno o más técnicos de la columna izquierda.",
}: ErsTechnicianDualListProps) {
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const query = filterQuery.trim().toLowerCase();

  const availableTechnicians = useMemo(
    () =>
      sortByName(
        technicians.filter((user) => {
          if (selectedSet.has(String(user.id))) return false;
          if (!query) return true;
          return `${user.fullName} ${user.locationName ?? ""}`.toLowerCase().includes(query);
        }),
      ),
    [technicians, selectedSet, query],
  );

  const selectedTechnicians = useMemo(
    () => sortByName(technicians.filter((user) => selectedSet.has(String(user.id)))),
    [technicians, selectedSet],
  );

  if (loading) {
    return <p className="text-sm text-muted-foreground">Cargando técnicos...</p>;
  }

  if (technicians.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyTechniciansMessage}</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="flex min-h-0 flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{availableTitle}</p>
          <span className="text-xs text-muted-foreground">{availableTechnicians.length}</span>
        </div>
        <div className="min-h-56 max-h-56 overflow-y-auto rounded-md border bg-muted/20 p-2">
          {availableTechnicians.length === 0 ? (
            <p className="text-sm text-muted-foreground">{emptyAvailableMessage}</p>
          ) : (
            <ul className="space-y-1">
              {availableTechnicians.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
                    onClick={() => onAdd(String(user.id))}
                  >
                    <span className="min-w-0 truncate">
                      {user.fullName}
                      {showLocation && user.locationName ? (
                        <span className="text-muted-foreground"> · {user.locationName}</span>
                      ) : null}
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="flex min-h-0 flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">{selectedTitle}</p>
          <span className="text-xs text-muted-foreground">{selectedTechnicians.length}</span>
        </div>
        <div className="min-h-56 max-h-56 overflow-y-auto rounded-md border bg-muted/20 p-2">
          {selectedTechnicians.length === 0 ? (
            <p className="text-sm text-muted-foreground">{emptySelectedMessage}</p>
          ) : (
            <ul className="space-y-1">
              {selectedTechnicians.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent"
                    onClick={() => onRemove(String(user.id))}
                  >
                    <span className="min-w-0 truncate">
                      {user.fullName}
                      {showLocation && user.locationName ? (
                        <span className="text-muted-foreground"> · {user.locationName}</span>
                      ) : null}
                    </span>
                    <X className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
