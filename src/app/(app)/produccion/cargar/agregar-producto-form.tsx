"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { agregarProduccionATurno } from "@/lib/actions/produccion";
import { FormulaCombobox } from "./formula-combobox";
import { CiclosGrid } from "./ciclos-grid";

type Formula = { id: string; codigo: string; nombre: string; set_total_kg: number };
type Reemplazo = { key: string; reemplazo: string; motivo: string; autorizo: string };

function emptyReemplazo(): Reemplazo {
  return { key: crypto.randomUUID(), reemplazo: "", motivo: "", autorizo: "" };
}

const inputClass = "w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">{label}</label>
      {children}
    </div>
  );
}

function SubGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-t border-black/10 pt-3">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">{title}</span>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{children}</div>
    </div>
  );
}

export function AgregarProductoForm({ turnoId, formulas }: { turnoId: string; formulas: Formula[] }) {
  const [state, formAction, pending] = useActionState(agregarProduccionATurno, undefined);
  const [formKey, setFormKey] = useState(0);
  const [success, setSuccess] = useState(false);
  const wasPending = useRef(false);

  const [formulaId, setFormulaId] = useState("");
  const [kgObjetivo, setKgObjetivo] = useState("");
  const [tipoEnvase, setTipoEnvase] = useState("BOLSA");
  const [ciclosCompletados, setCiclosCompletados] = useState("");
  const [granelKg, setGranelKg] = useState("");
  const [bolsasCantidad, setBolsasCantidad] = useState("");
  const [rotuloBolsas, setRotuloBolsas] = useState("");
  const [stockGranelKg, setStockGranelKg] = useState("");
  const [stockBolsasCantidad, setStockBolsasCantidad] = useState("");
  const [reemplazos, setReemplazos] = useState<Reemplazo[]>([]);
  const [mostrarMas, setMostrarMas] = useState(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setFormKey((k) => k + 1);
      setFormulaId("");
      setKgObjetivo("");
      setTipoEnvase("BOLSA");
      setCiclosCompletados("");
      setGranelKg("");
      setBolsasCantidad("");
      setRotuloBolsas("");
      setStockGranelKg("");
      setStockBolsasCantidad("");
      setReemplazos([]);
      setMostrarMas(false);
      setSuccess(true);
      const t = setTimeout(() => setSuccess(false), 4000);
      return () => clearTimeout(t);
    }
    wasPending.current = pending;
  }, [pending, state]);

  const formula = formulas.find((f) => f.id === formulaId);
  const reemplazosPayload = JSON.stringify(
    reemplazos
      .filter((r) => r.reemplazo || r.motivo || r.autorizo)
      .map((r) => ({ reemplazo: r.reemplazo || null, motivo: r.motivo || null, autorizo: r.autorizo || null })),
  );

  return (
    <form key={formKey} action={formAction} className="flex flex-col gap-3 rounded-md border border-black/10 p-3">
      <input type="hidden" name="turno_id" value={turnoId} />
      <input type="hidden" name="formula_id" value={formulaId} />
      <input type="hidden" name="kg_objetivo" value={kgObjetivo} />
      <input type="hidden" name="tipo_envase" value={tipoEnvase} />
      <input type="hidden" name="ciclos_completados" value={ciclosCompletados} />
      <input type="hidden" name="granel_kg" value={granelKg} />
      <input type="hidden" name="bolsas_cantidad" value={bolsasCantidad} />
      <input type="hidden" name="rotulo_bolsas" value={rotuloBolsas} />
      <input type="hidden" name="stock_granel_kg" value={stockGranelKg} />
      <input type="hidden" name="stock_bolsas_cantidad" value={stockBolsasCantidad} />
      <input type="hidden" name="reemplazos" value={reemplazosPayload} />

      <Field label="Fórmula">
        <FormulaCombobox formulas={formulas} value={formulaId} onChange={setFormulaId} />
      </Field>
      {formula && <p className="text-xs text-btm-black/50">Set total: {formula.set_total_kg} kg</p>}

      {formula && (
        <>
          <SubGroup title="Detalle">
            <Field label="Kg. Ciclos">
              <input type="number" min="0" value={kgObjetivo} onChange={(e) => setKgObjetivo(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Envase">
              <select value={tipoEnvase} onChange={(e) => setTipoEnvase(e.target.value)} className={inputClass}>
                <option value="BOLSA">Bolsa</option>
                <option value="GRANEL">Granel</option>
                <option value="BIG_BAG">Big bag</option>
              </select>
            </Field>
          </SubGroup>

          <div className="flex flex-col gap-2 border-t border-black/10 pt-3">
            <CiclosGrid value={ciclosCompletados} onChange={setCiclosCompletados} />
          </div>

          <SubGroup title="Kilogramos producción">
            <Field label="Granel (kg)">
              <input type="number" min="0" value={granelKg} onChange={(e) => setGranelKg(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Bolsas (cantidad)">
              <input type="number" min="0" value={bolsasCantidad} onChange={(e) => setBolsasCantidad(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Rótulo bolsas realizadas">
              <input type="text" value={rotuloBolsas} onChange={(e) => setRotuloBolsas(e.target.value)} className={inputClass} />
            </Field>
          </SubGroup>

          <div className="border-t border-black/10 pt-3">
            <button
              type="button"
              onClick={() => setMostrarMas((v) => !v)}
              className="text-xs font-semibold uppercase tracking-wide text-btm-navy hover:underline"
            >
              {mostrarMas ? "− Ocultar más opciones" : "+ Más opciones"}
            </button>
          </div>

          {mostrarMas && (
            <>
              <SubGroup title="Stock al cierre">
                <Field label="Stock granel al cierre (kg)">
                  <input type="number" min="0" value={stockGranelKg} onChange={(e) => setStockGranelKg(e.target.value)} className={inputClass} />
                </Field>
                <Field label="Stock bolsas al cierre">
                  <input type="number" min="0" value={stockBolsasCantidad} onChange={(e) => setStockBolsasCantidad(e.target.value)} className={inputClass} />
                </Field>
              </SubGroup>

              <div className="flex flex-col gap-2 border-t border-black/10 pt-3">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
                  Reemplazos de materia prima
                </span>
                {reemplazos.map((r) => (
                  <div key={r.key} className="flex flex-col gap-2 rounded-md border border-black/10 p-2 sm:flex-row sm:items-end">
                    <div className="flex-1">
                      <Field label="Reemplazo">
                        <input
                          type="text"
                          value={r.reemplazo}
                          onChange={(e) =>
                            setReemplazos((prev) => prev.map((x) => (x.key === r.key ? { ...x, reemplazo: e.target.value } : x)))
                          }
                          className={inputClass}
                        />
                      </Field>
                    </div>
                    <div className="flex-1">
                      <Field label="Motivo">
                        <input
                          type="text"
                          value={r.motivo}
                          onChange={(e) =>
                            setReemplazos((prev) => prev.map((x) => (x.key === r.key ? { ...x, motivo: e.target.value } : x)))
                          }
                          className={inputClass}
                        />
                      </Field>
                    </div>
                    <div className="flex-1">
                      <Field label="Autorizó">
                        <input
                          type="text"
                          value={r.autorizo}
                          onChange={(e) =>
                            setReemplazos((prev) => prev.map((x) => (x.key === r.key ? { ...x, autorizo: e.target.value } : x)))
                          }
                          className={inputClass}
                        />
                      </Field>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReemplazos((prev) => prev.filter((x) => x.key !== r.key))}
                      className="shrink-0 rounded-md px-2 py-1.5 text-xs font-semibold text-btm-red hover:bg-btm-red/10"
                    >
                      Quitar
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setReemplazos((prev) => [...prev, emptyReemplazo()])}
                  className="self-start rounded-full border border-btm-navy px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
                >
                  + Agregar reemplazo
                </button>
              </div>
            </>
          )}
        </>
      )}

      {state?.error && <p className="text-sm font-medium text-btm-red">{state.error}</p>}
      {success && (
        <p className="rounded-lg border border-btm-entregado bg-btm-entregado-bg px-3 py-2 text-xs font-semibold text-green-950">
          Producto agregado al turno.
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !formulaId}
        className="self-start rounded-full bg-btm-navy px-6 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-btm-red disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Agregar producto"}
      </button>
    </form>
  );
}
