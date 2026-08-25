"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogisticaBadge, ProduccionBadge } from "@/components/estado-badge";
import { RowLink } from "@/components/row-link";
import { PACKAGING_LABELS, type PackagingType } from "@/lib/packaging";
import { formatFecha } from "@/lib/format";
import { CrearRepartoModal } from "./crear-reparto-modal";

type Chofer = { id: string; name: string };
type Camion = {
  id: string;
  dominio: string;
  tipo: string;
  marca_modelo: string | null;
  anio: number | null;
  empresa: string | null;
  chofer_id: string | null;
};

export type NearbyOrder = {
  id: string;
  numero: string;
  cliente: string;
  fecha: string;
  provincia: string | null;
  localidad: string | null;
  estado_logistica: "PENDIENTE" | "ENTREGADO";
  estado_produccion: "PENDIENTE" | "FABRICADO";
  zona: { name: string } | null;
  vendedor: { name: string } | null;
  chofer: { name: string } | null;
  items: { id: string; cantidad: number; tipo_envase: string; precio_unitario: number; product: { name: string } | null }[];
  distancia_km: number | null;
};

export function NearbyResults({
  results,
  choferes,
  camiones,
}: {
  results: NearbyOrder[];
  choferes: Chofer[];
  camiones: Camion[];
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<NearbyOrder | null>(null);

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function goToNote(order: NearbyOrder) {
    if (selectedIds.size > 0) {
      setPendingOrder(order);
      return;
    }
    router.push(`/pedidos/${order.id}`);
  }

  const selectedOrders = results.filter((r) => selectedIds.has(r.id));

  return (
    <>
      {/* Mobile: cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {results.map((order) => (
          <Link
            key={order.id}
            href={`/pedidos/${order.id}`}
            onClick={(e) => {
              if (selectedIds.size > 0) {
                e.preventDefault();
                goToNote(order);
              }
            }}
            className="flex flex-col gap-2 rounded-lg border border-black/10 p-4 active:bg-black/[.02]"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={selectedIds.has(order.id)}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => toggle(order.id)}
                  className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-btm-navy"
                />
                <div>
                  <p className="font-display text-sm font-bold text-btm-navy">{order.numero}</p>
                  <p className="text-xs text-btm-black/50">{formatFecha(order.fecha)}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {order.distancia_km !== null && (
                  <span className="rounded-full bg-btm-navy/10 px-2.5 py-1 text-xs font-semibold text-btm-navy">
                    {Math.round(order.distancia_km)} km
                  </span>
                )}
                <LogisticaBadge estado={order.estado_logistica} />
              </div>
            </div>
            <p className="text-sm font-medium">{order.cliente}</p>
            <p className="text-xs text-btm-black/60">
              {order.localidad} ({order.provincia})
              {order.vendedor?.name ? ` · Vend. ${order.vendedor.name}` : ""}
            </p>
            <p className="text-xs text-btm-black/60">
              {order.items
                .map((it) => `${it.product?.name} (${PACKAGING_LABELS[it.tipo_envase as PackagingType]} x${it.cantidad})`)
                .join(", ")}
            </p>
          </Link>
        ))}
        {results.length === 0 && (
          <p className="rounded-lg border border-black/10 px-4 py-8 text-center text-btm-black/50">
            No hay notas de pedido para mostrar.
          </p>
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-x-auto rounded-lg border border-black/10 md:block">
        <table className="w-full min-w-[950px] text-sm">
          <thead className="bg-btm-navy text-left text-xs font-semibold uppercase tracking-wide text-white">
            <tr>
              <th className="w-10 px-4 py-3" />
              <th className="px-4 py-3">N°</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Localidad</th>
              <th className="px-4 py-3">Distancia</th>
              <th className="px-4 py-3">Productos</th>
              <th className="px-4 py-3">Vendedor</th>
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Producción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {results.map((order) => (
              <tr
                key={order.id}
                onClick={() => goToNote(order)}
                className="cursor-pointer hover:bg-black/[.02]"
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(order.id)}
                    onChange={() => toggle(order.id)}
                    className="h-4 w-4 cursor-pointer accent-btm-navy"
                  />
                </td>
                <td className="px-4 py-3">
                  <RowLink href={`/pedidos/${order.id}`} className="font-semibold text-btm-navy hover:text-btm-red">
                    {order.numero}
                  </RowLink>
                </td>
                <td className="px-4 py-3 text-btm-black/70">{formatFecha(order.fecha)}</td>
                <td className="px-4 py-3">{order.cliente}</td>
                <td className="px-4 py-3 text-btm-black/70">
                  {order.localidad} ({order.provincia})
                </td>
                <td className="px-4 py-3">
                  {order.distancia_km !== null ? (
                    <span className="rounded-full bg-btm-navy/10 px-2.5 py-1 text-xs font-semibold text-btm-navy">
                      {Math.round(order.distancia_km)} km
                    </span>
                  ) : (
                    <span className="text-btm-black/40">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-btm-black/70">
                  {order.items
                    .map((it) => `${it.product?.name} (${PACKAGING_LABELS[it.tipo_envase as PackagingType]} x${it.cantidad})`)
                    .join(", ")}
                </td>
                <td className="px-4 py-3 text-btm-black/70">{order.vendedor?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <LogisticaBadge estado={order.estado_logistica} />
                </td>
                <td className="px-4 py-3">
                  <ProduccionBadge estado={order.estado_produccion} />
                </td>
              </tr>
            ))}
            {results.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-btm-black/50">
                  No hay notas de pedido para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-white p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-btm-navy">
              {selectedIds.size} nota{selectedIds.size === 1 ? "" : "s"} seleccionada{selectedIds.size === 1 ? "" : "s"}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="cursor-pointer rounded-full border border-black/15 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-btm-black/70 hover:bg-black/5"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="cursor-pointer rounded-full bg-btm-navy px-5 py-2 font-display text-xs font-bold uppercase tracking-wide text-white hover:bg-btm-red"
              >
                Crear reparto
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <CrearRepartoModal
          orders={selectedOrders}
          choferes={choferes}
          camiones={camiones}
          onClose={() => setModalOpen(false)}
        />
      )}

      {pendingOrder && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPendingOrder(null);
          }}
        >
          <div className="btm-card flex w-full max-w-sm flex-col gap-4 p-5">
            <div>
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">¿Ver esta nota?</h2>
              <p className="mt-1 text-sm text-btm-black/70">
                Vas a salir de Pedidos cercanos y perder{" "}
                {selectedIds.size === 1 ? "la nota marcada" : `las ${selectedIds.size} notas marcadas`}.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => router.push(`/pedidos/${pendingOrder.id}`)}
                className="flex-1 cursor-pointer rounded-full bg-btm-navy px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-btm-red"
              >
                Ver {pendingOrder.numero}
              </button>
              <button
                type="button"
                onClick={() => setPendingOrder(null)}
                className="flex-1 cursor-pointer rounded-full border border-black/15 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-btm-black/70 hover:bg-black/5"
              >
                Seguir acá
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
