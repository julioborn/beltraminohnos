import type { Database } from "@/lib/supabase/database.types";

type LogisticaEstado = Database["public"]["Enums"]["logistica_status"];
type ProduccionEstado = Database["public"]["Enums"]["produccion_status"];

function Badge({ label, bg, dot }: { label: string; bg: string; dot: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-display text-[11px] font-bold uppercase tracking-wide ${bg}`}
    >
      <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden />
      {label}
    </span>
  );
}

const LOGISTICA_CONFIG: Record<LogisticaEstado, { label: string; bg: string; dot: string }> = {
  PENDIENTE: { label: "Pendiente", bg: "bg-btm-pendiente-bg text-amber-900", dot: "bg-btm-pendiente" },
  PARCIAL: { label: "Parcial", bg: "bg-btm-parcial-bg text-orange-900", dot: "bg-btm-parcial" },
  ENTREGADO: { label: "Entregado", bg: "bg-btm-entregado-bg text-green-950", dot: "bg-btm-entregado" },
};

const PRODUCCION_CONFIG: Record<ProduccionEstado, { label: string; bg: string; dot: string }> = {
  PENDIENTE: { label: "Pendiente", bg: "bg-btm-pendiente-bg text-amber-900", dot: "bg-btm-pendiente" },
  PARCIAL: { label: "Parcial", bg: "bg-btm-parcial-bg text-orange-900", dot: "bg-btm-parcial" },
  FABRICADO: { label: "Fabricado", bg: "bg-btm-fabricado-bg text-green-900", dot: "bg-btm-fabricado" },
};

export function LogisticaBadge({ estado }: { estado: LogisticaEstado }) {
  const config = LOGISTICA_CONFIG[estado];
  return <Badge label={config.label} bg={config.bg} dot={config.dot} />;
}

export function ProduccionBadge({ estado }: { estado: ProduccionEstado }) {
  const config = PRODUCCION_CONFIG[estado];
  return <Badge label={config.label} bg={config.bg} dot={config.dot} />;
}

export const LOGISTICA_LABELS: Record<LogisticaEstado, string> = {
  PENDIENTE: "Pendiente",
  PARCIAL: "Parcial",
  ENTREGADO: "Entregado",
};

export const PRODUCCION_LABELS: Record<ProduccionEstado, string> = {
  PENDIENTE: "Pendiente",
  PARCIAL: "Parcial",
  FABRICADO: "Fabricado",
};
