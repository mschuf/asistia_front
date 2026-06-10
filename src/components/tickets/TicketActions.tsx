/**
 * @file TicketActions.tsx
 * @description Botones de acción inline sobre un ticket (asignar, resolver, cerrar, escalar).
 */
import { ArrowUpRight, Check, Loader2, Lock, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { canTransitionTicketStatus, isTicketFinalized } from "@/lib/tickets";
import type { AsistiaTicket, AsistiaTicketStatus } from "@/types/asistia";

interface TicketActionsProps {
  ticket: AsistiaTicket;
  onStatusChange?: (ticketId: number, status: AsistiaTicketStatus) => void;
  pendingStatus?: AsistiaTicketStatus | null;
  onAssignClick?: () => void;
  assignPending?: boolean;
}

const actions = [
  {
    id: "solved",
    label: "Resuelto",
    icon: Check,
    status: "solved" as const,
    className:
      "border-sky-200/80 bg-sky-50/60 text-sky-700 hover:border-sky-300 hover:bg-sky-100/80 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300 dark:hover:border-sky-800 dark:hover:bg-sky-950/50"
  },
  {
    id: "closed",
    label: "Cerrado",
    icon: Lock,
    status: "closed" as const,
    className:
      "border-emerald-200/80 bg-emerald-50/60 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100/80 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/50"
  },
  {
    id: "waiting",
    label: "Escalar",
    icon: ArrowUpRight,
    status: "waiting" as const,
    className:
      "border-amber-200/80 bg-amber-50/60 text-amber-800 hover:border-amber-300 hover:bg-amber-100/80 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:border-amber-800 dark:hover:bg-amber-950/50"
  }
] as const;

/**
 * Iconos de acción de ticket con estados pending y transiciones válidas.
 * @param props - Ticket, callbacks y estados de carga.
 * @returns Fila de botones de acción.
 */
export function TicketActions({
  ticket,
  onStatusChange,
  pendingStatus = null,
  onAssignClick,
  assignPending = false,
}: TicketActionsProps) {
  const hasPendingAction = pendingStatus != null || assignPending;
  const finalized = isTicketFinalized(ticket);
  const assignDisabled = finalized || !onAssignClick || (hasPendingAction && !assignPending);

  return (
    <div className="flex flex-nowrap items-center gap-1.5">
      {onAssignClick ? (
        <button
          type="button"
          disabled={assignDisabled}
          aria-label="Asignar"
          aria-busy={assignPending}
          title={
            finalized
              ? "No hay acciones disponibles para tickets resueltos o cerrados"
              : "Asignar"
          }
          onClick={onAssignClick}
          className={cn(
            "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors",
            "border-violet-200/80 bg-violet-50/60 text-violet-700 hover:border-violet-300 hover:bg-violet-100/80",
            "dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-300 dark:hover:border-violet-800 dark:hover:bg-violet-950/50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            "disabled:cursor-not-allowed disabled:opacity-40"
          )}
        >
          {assignPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </button>
      ) : null}
      {actions.map(({ id, label, icon: Icon, status, className }) => {
        const isPending = pendingStatus === status;
        const canTransition = canTransitionTicketStatus(ticket.status, status);
        const disabled =
          id === "waiting" ||
          finalized ||
          !onStatusChange ||
          !canTransition ||
          (hasPendingAction && !isPending);

        return (
          <button
            key={id}
            type="button"
            disabled={disabled}
            aria-label={label}
            aria-busy={isPending}
            title={
              finalized
                ? "No hay acciones disponibles para tickets resueltos o cerrados"
                : !canTransition
                  ? `No se puede cambiar a ${label.toLowerCase()} desde ${ticket.status}`
                  : label
            }
            onClick={() => onStatusChange?.(ticket.id, status)}
            className={cn(
              "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              "disabled:cursor-not-allowed disabled:opacity-40",
              className
            )}
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        );
      })}
    </div>
  );
}
