import { AlertTriangle, CheckCircle2, Clock3, ListChecks, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { isTicketClosed, isTicketOpen, isTicketOverdue } from "@/lib/tickets";
import type { AsistiaTicket } from "@/types/asistia";

interface TiMetricsProps {
  tickets: AsistiaTicket[];
}

function countPriority(tickets: AsistiaTicket[]) {
  const high = tickets.filter((ticket) => ticket.urgency === "4" || ticket.urgency === "high");
  const low = tickets.filter((ticket) => ticket.urgency === "2" || ticket.urgency === "low");

  return {
    high: high.length,
    low: low.length
  };
}

export function TiMetrics({ tickets }: TiMetricsProps) {
  const priority = countPriority(tickets);
  const cards = [
    {
      label: "Abiertos",
      value: tickets.filter(isTicketOpen).length,
      icon: Clock3,
      className: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200"
    },
    {
      label: "Cerrados",
      value: tickets.filter(isTicketClosed).length,
      icon: CheckCircle2,
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"
    },
    {
      label: "Asignados a mi",
      value: tickets.length,
      icon: UserCheck,
      className:
        "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-200"
    },
    {
      label: "Vencidos",
      value: tickets.filter((ticket) => isTicketOverdue(ticket)).length,
      icon: AlertTriangle,
      className: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
    }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div key={card.label} className={`rounded-md border p-4 ${card.className}`}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">{card.label}</span>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="mt-3 text-2xl font-semibold">{card.value}</p>
          </div>
        );
      })}

      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium">Por prioridad</span>
          <ListChecks className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="danger">Alta {priority.high}</Badge>
          <Badge variant="success">Baja {priority.low}</Badge>
        </div>
      </div>
    </div>
  );
}
