import { ChevronDown } from "lucide-react";
import {
  USER_STATUS_SOURCE_LABELS,
  USER_STATUS_SOURCES,
  type UserStatusCountScope,
  type UserStatusSourceCounts,
} from "@/api/userStatus";
import { Select } from "@/components/ui/select";

interface Props {
  counts: UserStatusSourceCounts;
  scope: UserStatusCountScope;
  onScopeChange: (scope: UserStatusCountScope) => void;
}

export function UserStatusSourceCounters({ counts, scope, onScopeChange }: Props) {
  return (
    <div className="flex flex-wrap items-stretch justify-center gap-2" aria-label="Usuarios por fuente">
      <div className="relative flex shrink-0 self-stretch">
        <Select
          className="h-full min-h-[2.25rem] w-[7.25rem] appearance-none bg-card py-0 pl-2.5 pr-7 text-sm font-medium leading-none shadow-soft"
          value={scope}
          aria-label="Filtrar contadores por estado"
          onChange={(event) => onScopeChange(event.target.value as UserStatusCountScope)}
        >
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </Select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      </div>
      {USER_STATUS_SOURCES.map((source) => (
        <div
          key={source}
          className="flex min-w-[5.265rem] items-center gap-[0.5625rem] rounded-md border bg-card px-[0.9rem] py-[0.45rem] shadow-soft"
        >
          <span className="text-[1.35rem] font-semibold leading-none text-muted-foreground">{USER_STATUS_SOURCE_LABELS[source]}</span>
          <span className="text-[1.35rem] font-semibold tabular-nums leading-none">{counts[source]}</span>
        </div>
      ))}
    </div>
  );
}
