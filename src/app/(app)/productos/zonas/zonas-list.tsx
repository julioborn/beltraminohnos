"use client";

import { useState } from "react";
import { ZonaForm, type ZonaInicial } from "./zona-form";

export function ZonasList({ zonas }: { zonas: ZonaInicial[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (zonas.length === 0) {
    return <p className="rounded-lg border border-black/10 p-4 text-sm text-btm-black/50">Todavía no hay zonas cargadas.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-black/10">
      <table className="w-full min-w-[480px] text-sm">
        <thead className="bg-black/[.03] text-left text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
          <tr>
            <th className="px-3 py-2.5">Código</th>
            <th className="px-3 py-2.5">Nombre</th>
            <th className="px-3 py-2.5 text-right">Orden</th>
            <th className="px-3 py-2.5"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {zonas.map((z) =>
            editingId === z.id ? (
              <tr key={z.id}>
                <td colSpan={4} className="px-3 py-3">
                  <ZonaForm zona={z} onDone={() => setEditingId(null)} />
                </td>
              </tr>
            ) : (
              <tr key={z.id}>
                <td className="px-3 py-2.5 font-semibold text-btm-navy">{z.code}</td>
                <td className="px-3 py-2.5">{z.name}</td>
                <td className="px-3 py-2.5 text-right">{z.sort_order}</td>
                <td className="px-3 py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => setEditingId(z.id)}
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
  );
}
