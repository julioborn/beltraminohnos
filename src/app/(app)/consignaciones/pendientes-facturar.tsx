"use client";

import { useState, useTransition } from "react";
import { marcarMovimientosFacturados } from "@/lib/actions/consignaciones";
import { formatArs } from "@/lib/format";
import { ScrollFade } from "@/components/scroll-fade";

export type PendienteSucursalProducto = {
  key: string;
  sucursalName: string;
  productName: string;
  bolsas: number;
  montoArs: number;
  ids: string[];
};

export type PendienteSucursalCliente = {
  key: string;
  sucursalName: string;
  clienteNombre: string;
  clienteCuit: string | null;
  montoArs: number;
  comisionArs: number;
  ids: string[];
};

function useSelection() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }
  return { selected, toggle, clear: () => setSelected(new Set()) };
}

export function PendientesPorProducto({ groups }: { groups: PendienteSucursalProducto[] }) {
  const { selected, toggle, clear } = useSelection();
  const [pending, startTransition] = useTransition();

  function marcarSeleccionados() {
    const ids = groups.filter((g) => selected.has(g.key)).flatMap((g) => g.ids);
    if (ids.length === 0) return;
    startTransition(async () => {
      await marcarMovimientosFacturados(ids);
      clear();
    });
  }

  if (groups.length === 0) {
    return (
      <p className="rounded-lg border border-black/10 p-4 text-sm text-btm-black/50">
        No hay ventas pendientes de facturar a sucursales.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ScrollFade>
        <div className="overflow-x-auto rounded-lg border border-black/10">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-black/[.03] text-left text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
              <tr>
                <th className="w-8 px-3 py-2.5" />
                <th className="px-3 py-2.5">Sucursal</th>
                <th className="px-3 py-2.5">Producto</th>
                <th className="px-3 py-2.5 text-right">Bolsas</th>
                <th className="px-3 py-2.5 text-right">A facturar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {groups.map((g) => (
                <tr key={g.key}>
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(g.key)}
                      onChange={() => toggle(g.key)}
                      className="h-4 w-4 accent-btm-navy"
                    />
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-btm-navy">{g.sucursalName}</td>
                  <td className="px-3 py-2.5">{g.productName}</td>
                  <td className="px-3 py-2.5 text-right">{g.bolsas}</td>
                  <td className="px-3 py-2.5 text-right font-semibold">{formatArs(g.montoArs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollFade>
      <button
        type="button"
        onClick={marcarSeleccionados}
        disabled={pending || selected.size === 0}
        className="self-start rounded-full bg-btm-navy px-5 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-btm-red disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Marcando..." : "Marcar seleccionados como facturados"}
      </button>
    </div>
  );
}

export function PendientesPorCliente({ groups }: { groups: PendienteSucursalCliente[] }) {
  const { selected, toggle, clear } = useSelection();
  const [pending, startTransition] = useTransition();

  function marcarSeleccionados() {
    const ids = groups.filter((g) => selected.has(g.key)).flatMap((g) => g.ids);
    if (ids.length === 0) return;
    startTransition(async () => {
      await marcarMovimientosFacturados(ids);
      clear();
    });
  }

  if (groups.length === 0) {
    return (
      <p className="rounded-lg border border-black/10 p-4 text-sm text-btm-black/50">
        No hay ventas directas pendientes de facturar.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ScrollFade>
        <div className="overflow-x-auto rounded-lg border border-black/10">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="bg-black/[.03] text-left text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
              <tr>
                <th className="w-8 px-3 py-2.5" />
                <th className="px-3 py-2.5">Sucursal</th>
                <th className="px-3 py-2.5">Cliente</th>
                <th className="px-3 py-2.5">CUIT</th>
                <th className="px-3 py-2.5 text-right">A facturar</th>
                <th className="px-3 py-2.5 text-right">Comisión sucursal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {groups.map((g) => (
                <tr key={g.key}>
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(g.key)}
                      onChange={() => toggle(g.key)}
                      className="h-4 w-4 accent-btm-navy"
                    />
                  </td>
                  <td className="px-3 py-2.5 font-semibold text-btm-navy">{g.sucursalName}</td>
                  <td className="px-3 py-2.5">{g.clienteNombre}</td>
                  <td className="px-3 py-2.5">{g.clienteCuit ?? "—"}</td>
                  <td className="px-3 py-2.5 text-right font-semibold">{formatArs(g.montoArs)}</td>
                  <td className="px-3 py-2.5 text-right">{formatArs(g.comisionArs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollFade>
      <button
        type="button"
        onClick={marcarSeleccionados}
        disabled={pending || selected.size === 0}
        className="self-start rounded-full bg-btm-navy px-5 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-btm-red disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Marcando..." : "Marcar seleccionados como facturados"}
      </button>
    </div>
  );
}
