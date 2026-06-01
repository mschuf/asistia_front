export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function formatDateParts(
  value: string | null | undefined
): { date: string; time: string | null } {
  if (!value) return { date: "—", time: null };
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return { date: value, time: null };
  return {
    date: parsed.toLocaleString("es-PY", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }),
    time: parsed.toLocaleString("es-PY", {
      hour: "2-digit",
      minute: "2-digit"
    })
  };
}

export function formatNameParts(
  value: string | null | undefined
): { firstLine: string; secondLine: string | null } {
  const trimmed = value?.trim();
  if (!trimmed) return { firstLine: "—", secondLine: null };

  const words = trimmed.split(/\s+/);
  if (words.length <= 2) {
    return { firstLine: trimmed, secondLine: null };
  }

  return {
    firstLine: words.slice(0, 2).join(" "),
    secondLine: words.slice(2).join(" ")
  };
}
