"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { actualizarMovimientoSucursal } from "@/lib/actions/consignaciones";
import { formatArs, formatFecha } from "@/lib/format";
import { ScrollFade } from "@/components/scroll-fade";
import type { getSucursalMovimientos } from "@/lib/data/consignaciones";
import type { Database } from "@/lib/supabase/database.types";

type Movimiento = Awaited<ReturnType<typeof getSucursalMovimientos>>[number];
type Option = { id: string; name: string };
type TipoMovimiento = Database["public"]["Enums"]["tipo_movimiento_consignacion"];

const TIPO_LABELS: Record<string, string> = {
  INGRESO_STOCK: "Ingreso stock",
  VENTA: "Venta sucursal",
  DIRECTA_CLIENTE: "Directa cliente",
};

export function MovimientosTable({ movimientos, products }: { movimientos: Movimiento[]; products: Option[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <ScrollFade>
      <div className="overflow-x-auto rounded-lg border border-black/10">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-black/[.03] text-left text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
            <tr>
              <th className="px-3 py-2.5">Fecha</th>
              <th className="px-3 py-2.5">Sucursal</th>
              <th className="px-3 py-2.5">Producto</th>
              <th className="px-3 py-2.5">Tipo</th>
              <th className="px-3 py-2.5 text-right">Bolsas</th>
              <th className="px-3 py-2.5 text-right">Monto</th>
              <th className="px-3 py-2.5">Cliente</th>
              <th className="px-3 py-2.5">CUIT</th>
              <th className="px-3 py-2.5">Facturación</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {movimientos.map((m) =>
              editingId === m.id ? (
                <MovimientoEditRow key={m.id} movimiento={m} products={products} onDone={() => setEditingId(null)} />
              ) : (
                <tr key={m.id}>
                  <td className="px-3 py-2.5 whitespace-nowrap">{formatFecha(m.fecha)}</td>
                  <td className="px-3 py-2.5">{m.sucursal?.name ?? "—"}</td>
                  <td className="px-3 py-2.5">{m.product?.name ?? "—"}</td>
                  <td className="px-3 py-2.5">{TIPO_LABELS[m.tipo_movimiento] ?? m.tipo_movimiento}</td>
                  <td className="px-3 py-2.5 text-right">{m.cantidad_bolsas}</td>
                  <td className="px-3 py-2.5 text-right">{m.monto_ars != null ? formatArs(m.monto_ars) : "—"}</td>
                  <td className="px-3 py-2.5">{m.cliente_nombre ?? "—"}</td>
                  <td className="px-3 py-2.5">{m.cliente_cuit ?? "—"}</td>
                  <td className="px-3 py-2.5">
                    <FacturacionBadge estado={m.estado_facturacion} />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button
                      type="button"
                      onClick={() => setEditingId(m.id)}
                      className="rounded-md border border-black/15 px-3 py-1 text-xs font-semibold text-btm-black/70 hover:bg-black/5"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </ScrollFade>
  );
}

function MovimientoEditRow({
  movimiento,
  products,
  onDone,
}: {
  movimiento: Movimiento;
  products: Option[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(actualizarMovimientoSucursal, undefined);
  const [fecha, setFecha] = useState(movimiento.fecha);
  const [tipo, setTipo] = useState<TipoMovimiento>(movimiento.tipo_movimiento);
  const [productId, setProductId] = useState(movimiento.product?.id ?? "");
  const [cantidadBolsas, setCantidadBolsas] = useState(String(movimiento.cantidad_bolsas));
  const [clienteNombre, setClienteNombre] = useState(movimiento.cliente_nombre ?? "");
  const [clienteCuit, setClienteCuit] = useState(movimiento.cliente_cuit ?? "");
  const wasPending = useRef(false);

  function handleTipoChange(next: TipoMovimiento) {
    setTipo(next);
    if (next !== "DIRECTA_CLIENTE") {
      setClienteNombre("");
      setClienteCuit("");
    }
  }

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      onDone();
    }
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, state]);

  return (
    <tr className="bg-btm-navy/5">
      <td className="px-3 py-2.5">
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="w-36 rounded-md border border-black/15 px-2 py-1.5 text-sm"
        />
      </td>
      <td className="px-3 py-2.5">{movimiento.sucursal?.name ?? "—"}</td>
      <td className="px-3 py-2.5">
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="w-full min-w-[160px] rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm"
        >
          <option value="">Seleccionar...</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2.5">
        <select
          value={tipo}
          onChange={(e) => handleTipoChange(e.target.value as TipoMovimiento)}
          className="w-full min-w-[140px] rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm"
        >
          <option value="INGRESO_STOCK">Ingreso stock</option>
          <option value="VENTA">Venta sucursal</option>
          <option value="DIRECTA_CLIENTE">Directa cliente</option>
        </select>
      </td>
      <td className="px-3 py-2.5 text-right">
        <input
          type="number"
          min="1"
          step="1"
          value={cantidadBolsas}
          onChange={(e) => setCantidadBolsas(e.target.value)}
          className="w-20 rounded-md border border-black/15 px-2 py-1.5 text-right text-sm"
        />
      </td>
      <td className="px-3 py-2.5 text-right text-xs text-btm-black/50">
        {tipo !== "INGRESO_STOCK" ? "se recalcula" : "—"}
      </td>
      <td className="px-3 py-2.5">
        {tipo === "DIRECTA_CLIENTE" ? (
          <input
            type="text"
            value={clienteNombre}
            onChange={(e) => setClienteNombre(e.target.value)}
            placeholder="Cliente"
            className="w-full min-w-[120px] rounded-md border border-black/15 px-2 py-1.5 text-sm"
          />
        ) : (
          "—"
        )}
      </td>
      <td className="px-3 py-2.5">
        {tipo === "DIRECTA_CLIENTE" ? (
          <input
            type="text"
            value={clienteCuit}
            onChange={(e) => setClienteCuit(e.target.value)}
            placeholder="CUIT"
            className="w-full min-w-[100px] rounded-md border border-black/15 px-2 py-1.5 text-sm"
          />
        ) : (
          "—"
        )}
      </td>
      <td className="px-3 py-2.5">
        <FacturacionBadge estado={movimiento.estado_facturacion} />
      </td>
      <td className="px-3 py-2.5">
        <form action={formAction} className="flex flex-col items-end gap-1">
          <input type="hidden" name="id" value={movimiento.id} />
          <input type="hidden" name="fecha" value={fecha} />
          <input type="hidden" name="tipo_movimiento" value={tipo} />
          <input type="hidden" name="product_id" value={productId} />
          <input type="hidden" name="cantidad_bolsas" value={cantidadBolsas} />
          <input type="hidden" name="cliente_nombre" value={clienteNombre} />
          <input type="hidden" name="cliente_cuit" value={clienteCuit} />
          <div className="flex gap-1.5 whitespace-nowrap">
            <button
              type="button"
              onClick={onDone}
              className="rounded-md border border-black/15 px-3 py-1 text-xs font-semibold text-btm-black/70 hover:bg-black/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending || !productId || !cantidadBolsas || (tipo === "DIRECTA_CLIENTE" && !clienteNombre.trim())}
              className="rounded-md bg-btm-navy px-3 py-1 text-xs font-semibold text-white hover:bg-btm-red disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "..." : "Guardar"}
            </button>
          </div>
          {state?.error && <p className="max-w-[160px] text-right text-[11px] font-medium text-btm-red">{state.error}</p>}
        </form>
      </td>
    </tr>
  );
}

function FacturacionBadge({ estado }: { estado: "PENDIENTE" | "FACTURADO" }) {
  const config =
    estado === "FACTURADO"
      ? { label: "Facturado", bg: "bg-btm-entregado-bg text-green-950", dot: "bg-btm-entregado" }
      : { label: "Pendiente", bg: "bg-btm-pendiente-bg text-amber-900", dot: "bg-btm-pendiente" };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-display text-[11px] font-bold uppercase tracking-wide ${config.bg}`}
    >
      <span className={`h-2 w-2 rounded-full ${config.dot}`} aria-hidden />
      {config.label}
    </span>
  );
}
