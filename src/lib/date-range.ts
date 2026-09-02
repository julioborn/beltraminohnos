export function toISODate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function parseISODate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function eachDateInRange(startIso: string, endIso: string): string[] {
  const start = parseISODate(startIso);
  const end = parseISODate(endIso);
  const days: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    days.push(toISODate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

// Suma días hábiles (excluye sábado y domingo) a partir de una fecha ISO,
// sin contar la fecha de partida como día 1 (ej: miércoles + 4 hábiles = martes).
export function addBusinessDays(startIso: string, days: number): string {
  const date = parseISODate(startIso);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const weekday = date.getDay();
    if (weekday !== 0 && weekday !== 6) added++;
  }
  return toISODate(date);
}
