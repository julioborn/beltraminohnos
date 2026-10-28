import { formatArs, formatUsd } from "@/lib/format";

export type Currency = "ARS" | "USD";

export const CURRENCY_COOKIE = "btm-currency";

export function formatMonto(valueArs: number, currency: Currency, tipoCambio: number | null): string {
  if (currency === "USD" && tipoCambio) return formatUsd(valueArs / tipoCambio);
  return formatArs(valueArs);
}

// Igual que formatMonto pero sin el sufijo " ARS" — para usar dentro de
// los gráficos de barra, donde las columnas son angostas.
export function formatMontoCompact(valueArs: number, currency: Currency, tipoCambio: number | null): string {
  if (currency === "USD" && tipoCambio) return formatUsd(valueArs / tipoCambio);
  return `$${valueArs.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
