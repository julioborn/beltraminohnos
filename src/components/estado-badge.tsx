import type { Database } from "@/lib/supabase/database.types";

type Estado = Database["public"]["Enums"]["order_status"];

const ESTADO_CONFIG: Record<Estado, { label: string; bg: string; dot: string }> = {
  PENDIENTE: { label: "Pendiente", bg: "bg-btm-pendiente-bg text-amber-900", dot: "bg-btm-pendiente" },
  FABRICADO: { label: "Fabricado", bg: "bg-btm-fabricado-bg text-green-900", dot: "bg-btm-fabricado" },
  ENTREGADO: { label: "Entregado", bg: "bg-btm-entregado-bg text-green-950", dot: "bg-btm-entregado" },
};

export function EstadoBadge({ estado }: { estado: Estado }) {
  const config = ESTADO_CONFIG[estado];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${config.bg}`}
    >
      <span className={`h-2 w-2 rounded-full ${config.dot}`} aria-hidden />
      {config.label}
    </span>
  );
}

export const ESTADO_ORDER: Estado[] = ["PENDIENTE", "FABRICADO", "ENTREGADO"];
export const ESTADO_LABELS: Record<Estado, string> = {
  PENDIENTE: "Pendiente",
  FABRICADO: "Fabricado",
  ENTREGADO: "Entregado",
};
