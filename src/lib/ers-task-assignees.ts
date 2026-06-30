/**
 * @file ers-task-assignees.ts
 * @description Resuelve opciones del dropdown Responsable al agregar tareas en Editar ERS.
 */
import type { ErsTeamMember, ErsTechnician } from "@/api/ers";

function sortByName(technicians: ErsTechnician[]): ErsTechnician[] {
  return [...technicians].sort((a, b) =>
    a.fullName.localeCompare(b.fullName, "es", { sensitivity: "base" }),
  );
}

/**
 * Opciones para responsable de tarea:
 * - Equipo persistido del proyecto
 * - Más técnicos recién seleccionados en Equipo del modal (sin duplicar)
 * - Si no hay ninguno, técnicos de la sede del usuario logueado
 */
export function resolveTaskAssigneeOptions(
  projectTeam: ErsTeamMember[],
  selectedTeamMemberIds: string[],
  techniciansByTicketLocation: ErsTechnician[],
  techniciansByUserLocation: ErsTechnician[],
): ErsTechnician[] {
  const persistedIds = new Set(projectTeam.map((member) => String(member.userId)));

  const options: ErsTechnician[] = projectTeam.map((member) => ({
    id: member.userId,
    fullName: member.fullName,
    locationId: null,
  }));

  for (const memberId of selectedTeamMemberIds) {
    if (persistedIds.has(memberId)) continue;
    const technician = techniciansByTicketLocation.find((item) => String(item.id) === memberId);
    if (technician) {
      options.push(technician);
    }
  }

  if (options.length === 0) {
    return sortByName(techniciansByUserLocation);
  }

  return sortByName(options);
}
