// Server Component a propósito: acá se formatea el importe (fmtMonto,
// función que cruza libremente entre Server Components) y solo se manda un
// id — un string plano — al botón de borrar, que sí necesita ser
// "use client" por el estado de confirmación. Ver sucursal-pagos.tsx.

import { BorrarPagoButton } from "./sucursal-pagos";
import { formatFecha } from "@/lib/format";
import type { getSucursalPagos } from "@/lib/data/consignaciones";

type Pago = Awaited<ReturnType<typeof getSucursalPagos>>[number];

export function PagosTable({ pagos, fmtMonto }: { pagos: Pago[]; fmtMonto: (value: number) => string }) {
  if (pagos.length === 0) {
    return (
      <p className="rounded-lg border border-black/10 p-4 text-sm text-btm-black/50">
        Todavía no se cargó ningún pago.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-black/10">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-black/[.03] text-left text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
          <tr>
            <th className="px-3 py-2.5">Fecha</th>
            <th className="px-3 py-2.5">Sucursal</th>
            <th className="px-3 py-2.5 text-right">Importe</th>
            <th className="px-3 py-2.5">Formato</th>
            <th className="px-3 py-2.5">Comprobante</th>
            <th className="px-3 py-2.5">Observaciones</th>
            <th className="px-3 py-2.5"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {pagos.map((p) => (
            <tr key={p.id}>
              <td className="px-3 py-2.5 whitespace-nowrap">{formatFecha(p.fecha)}</td>
              <td className="px-3 py-2.5 font-semibold text-btm-navy">{p.sucursal?.name ?? "—"}</td>
              <td className="px-3 py-2.5 text-right">{fmtMonto(p.importe_ars)}</td>
              <td className="px-3 py-2.5">{p.formato_pago ?? "—"}</td>
              <td className="px-3 py-2.5">{p.comprobante ?? "—"}</td>
              <td className="px-3 py-2.5">{p.observaciones ?? "—"}</td>
              <td className="px-3 py-2.5 text-right">
                <BorrarPagoButton id={p.id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
