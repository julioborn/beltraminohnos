"use client";

import { useState } from "react";
import { FormulaForm, type FormulaInicial } from "./formula-form";

export function FormulasList({
  formulas,
  plataformas,
  productos,
}: {
  formulas: FormulaInicial[];
  plataformas: string[];
  productos: string[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (formulas.length === 0) {
    return <p className="rounded-lg border border-black/10 p-4 text-sm text-btm-black/50">Todavía no hay fórmulas cargadas.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {formulas.map((f) => (
        <div key={f.id} className="btm-card flex flex-col gap-4 p-4 sm:p-5">
          {editingId === f.id ? (
            <FormulaForm formula={f} plataformas={plataformas} productos={productos} onDone={() => setEditingId(null)} />
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-sm font-bold text-btm-navy">
                      {f.codigo} · {f.nombre}
                    </h3>
                    {!f.active && (
                      <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-btm-black/50">
                        Inactiva
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-btm-black/50">Set total: {f.set_total_kg.toLocaleString("es-AR")} kg</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingId(f.id)}
                  className="rounded-md border border-black/15 px-3 py-1.5 text-xs font-semibold text-btm-black/70 hover:bg-black/5"
                >
                  Editar
                </button>
              </div>

              {f.formula_ingredientes.length === 0 ? (
                <p className="text-sm text-btm-black/50">Sin ingredientes cargados.</p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-black/10">
                  <table className="w-full min-w-[420px] text-sm">
                    <thead className="bg-black/[.03] text-left text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
                      <tr>
                        <th className="px-3 py-2">Plataforma</th>
                        <th className="px-3 py-2">Producto</th>
                        <th className="px-3 py-2 text-right">Kg (set)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {f.formula_ingredientes.map((ing, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2">{ing.plataforma}</td>
                          <td className="px-3 py-2">{ing.producto}</td>
                          <td className="px-3 py-2 text-right">{ing.set_kg.toLocaleString("es-AR")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
