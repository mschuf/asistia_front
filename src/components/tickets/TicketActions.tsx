/**
 * @file TicketActions.tsx
 * @description Botones de acción inline sobre un ticket (asignar, resolver, cerrar, escalar).
 */
import { ArrowUpRight, Check, Loader2, Lock, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { canTransitionTicketStatus, isTicketClosed, isTicketFinalized } from "@/lib/tickets";
import type { AsistiaTicket, AsistiaTicketStatus } from "@/types/asistia";

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

type TicketStatusActionId = (typeof actions)[number]["id"];

interface TicketActionsProps {
  ticket: AsistiaTicket;
  onStatusChange?: (ticketId: number, status: AsistiaTicketStatus) => void;
  pendingStatus?: AsistiaTicketStatus | null;
  onAssignClick?: () => void;
  onEscalate?: () => void;
  assignPending?: boolean;
  /** Si se define, limita qué botones de estado se muestran (p. ej. solo `closed` para solicitantes). */
  statusActionIds?: TicketStatusActionId[];
}

const actionButtonClass =
  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors";
const actionIconClass = "h-4 w-4";

/**
 * Iconos de acción de ticket con estados pending y transiciones válidas.
 * @param props - Ticket, callbacks y estados de carga.
 * @returns Botones en fila en escritorio y cuadrícula 2×2 en móvil.
 */
export function TicketActions({
  ticket,
  onStatusChange,
  pendingStatus = null,
  onAssignClick,
  onEscalate,
  assignPending = false,
  statusActionIds,
}: TicketActionsProps) {
  const hasPendingAction = pendingStatus != null || assignPending;
  const finalized = isTicketFinalized(ticket);
  const closed = isTicketClosed(ticket);
  const assignDisabled = finalized || !onAssignClick || (hasPendingAction && !assignPending);
  const filteredStatusActions = statusActionIds
    ? actions.filter((action) => statusActionIds.includes(action.id))
    : actions;
  const waitingAction = actions.find((action) => action.id === "waiting");
  const visibleStatusActions =
    onEscalate && waitingAction && !filteredStatusActions.some((action) => action.id === "waiting")
      ? [...filteredStatusActions, waitingAction]
      : filteredStatusActions;

  return (
    <div className="grid w-fit grid-cols-2 gap-3 md:flex md:flex-nowrap md:items-center">
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
            actionButtonClass,
            "border-violet-200/80 bg-violet-50/60 text-violet-700 hover:border-violet-300 hover:bg-violet-100/80",
            "dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-300 dark:hover:border-violet-800 dark:hover:bg-violet-950/50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            "disabled:cursor-not-allowed disabled:opacity-40"
          )}
        >
          {assignPending ? (
            <Loader2 className={cn(actionIconClass, "animate-spin")} aria-hidden="true" />
          ) : (
            <UserPlus className={actionIconClass} aria-hidden="true" />
          )}
        </button>
      ) : null}
      {visibleStatusActions.map(({ id, label, icon: Icon, status, className }) => {
        const isPending = pendingStatus === status;
        const canTransition = canTransitionTicketStatus(ticket.status, status);
        const actionBlocked = id === "closed" ? closed : finalized;
        if (id === "waiting") {
          const disabled = finalized || !onEscalate || hasPendingAction;
          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              aria-label={label}
              title={
                finalized
                  ? "No hay acciones disponibles para tickets resueltos o cerrados"
                  : label
              }
              onClick={onEscalate}
              className={cn(
                actionButtonClass,
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                "disabled:cursor-not-allowed disabled:opacity-40",
                className
              )}
            >
              <Icon className={actionIconClass} aria-hidden="true" />
            </button>
          );
        }
        const disabled =
          actionBlocked ||
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
              actionBlocked
                ? id === "closed"
                  ? "El ticket ya está cerrado"
                  : "No hay acciones disponibles para tickets resueltos o cerrados"
                : !canTransition
                  ? `No se puede cambiar a ${label.toLowerCase()} desde ${ticket.status}`
                  : label
            }
            onClick={() => onStatusChange?.(ticket.id, status)}
            className={cn(
              actionButtonClass,
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              "disabled:cursor-not-allowed disabled:opacity-40",
              className
            )}
          >
            {isPending ? (
              <Loader2 className={cn(actionIconClass, "animate-spin")} aria-hidden="true" />
            ) : (
              <Icon className={actionIconClass} aria-hidden="true" />
            )}
          </button>
        );
      })}
    </div>
  );
}
