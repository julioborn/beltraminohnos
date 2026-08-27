"use client";

import { useState, useTransition } from "react";
import { LogisticaBadge, ProduccionBadge } from "@/components/estado-badge";
import {
  marcarItemFabricado,
  marcarItemEntregado,
  revertirItemFabricado,
  revertirItemEntregado,
} from "@/lib/actions/order-notes";

type ItemStatus = {
  id: string;
  estado_produccion: "PENDIENTE" | "PARCIAL" | "FABRICADO";
  estado_logistica: "PENDIENTE" | "PARCIAL" | "ENTREGADO";
};

type ActionKind = "fabricar" | "entregar" | "revertirProduccion" | "revertirEntrega";

const BUTTON_BASE =
  "cursor-pointer rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide disabled:cursor-wait disabled:opacity-50";
const BUTTON_PRIMARY = `${BUTTON_BASE} border-btm-navy text-btm-navy hover:bg-btm-navy hover:text-white`;
const BUTTON_GHOST = `${BUTTON_BASE} border-black/20 text-btm-black/60 hover:border-btm-red hover:text-btm-red`;

export function ItemStatusCell({ orderId, item }: { orderId: string; item: ItemStatus }) {
  const [pending, startTransition] = useTransition();
  const [pendingKind, setPendingKind] = useState<ActionKind | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run(kind: ActionKind, action: () => Promise<void>) {
    setError(null);
    setPendingKind(kind);
    startTransition(async () => {
      try {
        await action();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo actualizar el estado.");
      } finally {
        setPendingKind(null);
      }
    });
  }

  const canFabricar = item.estado_produccion === "PENDIENTE";
  const canEntregar = item.estado_logistica === "PENDIENTE" && item.estado_produccion === "FABRICADO";
  const canRevertirProduccion = item.estado_produccion === "FABRICADO" && item.estado_logistica !== "ENTREGADO";
  const canRevertirEntrega = item.estado_logistica === "ENTREGADO";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <ProduccionBadge estado={item.estado_produccion} />
        <LogisticaBadge estado={item.estado_logistica} />
        {canFabricar && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run("fabricar", () => marcarItemFabricado(orderId, item.id))}
            className={BUTTON_PRIMARY}
          >
            {pendingKind === "fabricar" ? "Marcando…" : "Fabricar"}
          </button>
        )}
        {canEntregar && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run("entregar", () => marcarItemEntregado(orderId, item.id))}
            className={BUTTON_PRIMARY}
          >
            {pendingKind === "entregar" ? "Marcando…" : "Entregar"}
          </button>
        )}
        {canRevertirEntrega && (
          <button
            type="button"
            disabled={pending}
            title="Revertir entrega a pendiente"
            onClick={() => run("revertirEntrega", () => revertirItemEntregado(orderId, item.id))}
            className={BUTTON_GHOST}
          >
            {pendingKind === "revertirEntrega" ? "Revirtiendo…" : "↺ Entrega"}
          </button>
        )}
        {canRevertirProduccion && (
          <button
            type="button"
            disabled={pending}
            title="Revertir producción a pendiente"
            onClick={() => run("revertirProduccion", () => revertirItemFabricado(orderId, item.id))}
            className={BUTTON_GHOST}
          >
            {pendingKind === "revertirProduccion" ? "Revirtiendo…" : "↺ Producción"}
          </button>
        )}
      </div>
      {error && <p className="text-[10px] text-btm-red">{error}</p>}
    </div>
  );
}
