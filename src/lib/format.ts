export function formatUsd(value: number) {
  return `$${value.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// "2026-05-06" -> "06/05/26"
export function formatFecha(fecha: string) {
  const [year, month, day] = fecha.split("-");
  return `${day}/${month}/${year.slice(2)}`;
}

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("es-AR", { weekday: "long" });

export function formatDiaEntrega(fechaEntrega: string | null) {
  if (!fechaEntrega) return null;
  const date = new Date(`${fechaEntrega}T00:00:00`);
  const weekday = WEEKDAY_FORMATTER.format(date);
  const capitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1);
  return `${capitalized} ${date.getDate()}/${date.getMonth() + 1}`;
}
