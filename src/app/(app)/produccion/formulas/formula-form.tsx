"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { crearFormula, actualizarFormula } from "@/lib/actions/produccion";

type Ingrediente = { key: string; plataforma: string; producto: string; set_kg: string };

function emptyIngrediente(): Ingrediente {
  return { key: crypto.randomUUID(), plataforma: "", producto: "", set_kg: "" };
}

export type FormulaInicial = {
  id: string;
  codigo: string;
  nombre: string;
  set_total_kg: number;
  active: boolean;
  formula_ingredientes: { plataforma: string; producto: string; set_kg: number }[];
};

const inputClass = "w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy";

export function FormulaForm({
  formula,
  plataformas,
  productos,
  onDone,
}: {
  formula?: FormulaInicial;
  plataformas: string[];
  productos: string[];
  onDone?: () => void;
}) {
  const action = formula ? actualizarFormula : crearFormula;
  const [state, formAction, pending] = useActionState(action, undefined);
  const [codigo, setCodigo] = useState(formula?.codigo ?? "");
  const [nombre, setNombre] = useState(formula?.nombre ?? "");
  const [setTotalKg, setSetTotalKg] = useState(formula ? String(formula.set_total_kg) : "");
  const [active, setActive] = useState(formula?.active ?? true);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>(() =>
    formula && formula.formula_ingredientes.length > 0
      ? formula.formula_ingredientes.map((i) => ({
          key: crypto.randomUUID(),
          plataforma: i.plataforma,
          producto: i.producto,
          set_kg: String(i.set_kg),
        }))
      : [emptyIngrediente()],
  );
  const [success, setSuccess] = useState(false);
  const wasPending = useRef(false);
  const datalistId = useId();

  // Al crear, el formulario queda montado y se limpia para cargar la
  // siguiente fórmula. Al editar, onDone desmonta este componente de una
  // (vuelve a la vista de solo lectura en FormulasList), así que limpiar
  // estos campos acá también en ese caso no se llega a ver — no hace falta
  // una rama separada para cada modo.
  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setSuccess(true);
      const t = setTimeout(() => setSuccess(false), 4000);
      setCodigo("");
      setNombre("");
      setSetTotalKg("");
      setIngredientes([emptyIngrediente()]);
      onDone?.();
      return () => clearTimeout(t);
    }
    wasPending.current = pending;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, state]);

  function updateIngrediente(key: string, patch: Partial<Ingrediente>) {
    setIngredientes((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }

  const sumaIngredientes = ingredientes.reduce((sum, i) => sum + (Number(i.set_kg) || 0), 0);
  const setTotalNum = Number(setTotalKg) || 0;
  const noCierra = setTotalNum > 0 && Math.abs(sumaIngredientes - setTotalNum) > 0.01;

  const payload = JSON.stringify(
    ingredientes
      .filter((i) => i.plataforma && i.producto && i.set_kg)
      .map((i) => ({ plataforma: i.plataforma, producto: i.producto, set_kg: Number(i.set_kg) })),
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {formula && <input type="hidden" name="id" value={formula.id} />}
      <input type="hidden" name="ingredientes" value={payload} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">Código</label>
          <input name="codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">Nombre</label>
          <input name="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClass} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">Set total (kg)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            name="set_total_kg"
            value={setTotalKg}
            onChange={(e) => setSetTotalKg(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {formula && (
        <label className="flex w-fit items-center gap-2 text-sm font-semibold text-btm-black/70">
          <input type="checkbox" name="active" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-btm-navy" />
          Fórmula activa (aparece para elegir al cargar producción)
        </label>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">Ingredientes (por set)</span>
          <button
            type="button"
            onClick={() => setIngredientes((prev) => [...prev, emptyIngrediente()])}
            className="rounded-full border border-btm-navy px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
          >
            + Agregar ingrediente
          </button>
        </div>

        {ingredientes.map((ing) => (
          <div key={ing.key} className="flex flex-col gap-2 rounded-md border border-black/10 p-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">Plataforma</label>
              <input
                list={`${datalistId}-plataformas`}
                value={ing.plataforma}
                onChange={(e) => updateIngrediente(ing.key, { plataforma: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="flex-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">Producto</label>
              <input
                list={`${datalistId}-productos`}
                value={ing.producto}
                onChange={(e) => updateIngrediente(ing.key, { producto: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="w-full sm:w-32">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">Kg (set)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={ing.set_kg}
                onChange={(e) => updateIngrediente(ing.key, { set_kg: e.target.value })}
                className={inputClass}
              />
            </div>
            <button
              type="button"
              onClick={() => setIngredientes((prev) => (prev.length > 1 ? prev.filter((i) => i.key !== ing.key) : prev))}
              className="shrink-0 rounded-md px-2 py-1.5 text-xs font-semibold text-btm-red hover:bg-btm-red/10"
            >
              Quitar
            </button>
          </div>
        ))}

        {noCierra && (
          <p className="text-xs font-semibold text-btm-pendiente">
            Los ingredientes suman {sumaIngredientes.toLocaleString("es-AR", { maximumFractionDigits: 2 })} kg, pero el set total
            dice {setTotalNum.toLocaleString("es-AR", { maximumFractionDigits: 2 })} kg.
          </p>
        )}
      </div>

      <datalist id={`${datalistId}-plataformas`}>
        {plataformas.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      <datalist id={`${datalistId}-productos`}>
        {productos.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>

      {state?.error && <p className="text-sm font-medium text-btm-red">{state.error}</p>}
      {success && (
        <p className="rounded-lg border border-btm-entregado bg-btm-entregado-bg px-3 py-2 text-xs font-semibold text-green-950">
          Fórmula guardada.
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-full bg-btm-navy px-6 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-white hover:bg-btm-red disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Guardando..." : formula ? "Guardar cambios" : "Crear fórmula"}
        </button>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="rounded-full border border-black/15 px-6 py-2.5 text-xs font-semibold uppercase tracking-wide text-btm-black/70 hover:bg-black/5"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
