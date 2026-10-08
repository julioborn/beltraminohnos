"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { crearTurno } from "@/lib/actions/produccion";
import { FormulaCombobox } from "./formula-combobox";

type Formula = { id: string; codigo: string; nombre: string; set_total_kg: number };
type Operador = { id: string; nombre: string };

type Empleado = { key: string; nombre: string; horaIngreso: string; horaSalida: string };
type Parada = { key: string; tipo: string; detalle: string; minutos: string };
type Reemplazo = { key: string; reemplazo: string; motivo: string; autorizo: string };
type Produccion = {
  key: string;
  formulaId: string;
  kgObjetivo: string;
  tipoEnvase: string;
  partida: string;
  tipoAlimento: string;
  ciclosCompletados: string;
  kgProducidoReal: string;
  granelKg: string;
  bolsasCantidad: string;
  rotuloBolsas: string;
  stockGranelKg: string;
  stockBolsasCantidad: string;
  reemplazos: Reemplazo[];
  mostrarMas: boolean;
};

const PARADA_LABELS: Record<string, string> = {
  ROTURA: "Rotura",
  CORTE_LUZ: "Corte de luz",
  FALTA_MATERIA_PRIMA: "Falta de materia prima",
  OTROS: "Otros",
};

function emptyEmpleado(): Empleado {
  return { key: crypto.randomUUID(), nombre: "", horaIngreso: "", horaSalida: "" };
}

function emptyParada(): Parada {
  return { key: crypto.randomUUID(), tipo: "ROTURA", detalle: "", minutos: "" };
}

function emptyReemplazo(): Reemplazo {
  return { key: crypto.randomUUID(), reemplazo: "", motivo: "", autorizo: "" };
}

function emptyProduccion(): Produccion {
  return {
    key: crypto.randomUUID(),
    formulaId: "",
    kgObjetivo: "",
    tipoEnvase: "BOLSA",
    partida: "",
    tipoAlimento: "",
    ciclosCompletados: "",
    kgProducidoReal: "",
    granelKg: "",
    bolsasCantidad: "",
    rotuloBolsas: "",
    stockGranelKg: "",
    stockBolsasCantidad: "",
    reemplazos: [],
    mostrarMas: false,
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="btm-card flex flex-col gap-4 p-4 sm:p-5">
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">{label}</label>
      {children}
    </div>
  );
}

const inputClass = "w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy";

function SubGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-t border-black/10 pt-3">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">{title}</span>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{children}</div>
    </div>
  );
}

const CICLOS = Array.from({ length: 80 }, (_, i) => i + 1);

// Igual que la planilla de papel: se van tildando los casilleros de a 1.000kg
// en orden, no al azar — tocar un casillero marca todos los anteriores hasta
// ese punto (mucho más rápido que tipear un número y visualmente idéntico a
// cómo lo tildaban en planta).
function CiclosGrid({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const completados = Number(value) || 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
          Ciclos completados — {completados}/80 · {(completados * 1000).toLocaleString("es-AR")} kg
        </span>
        {completados > 0 && (
          <button
            type="button"
            onClick={() => onChange("0")}
            className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-btm-red hover:underline"
          >
            Reiniciar
          </button>
        )}
      </div>
      <div className="grid grid-cols-8 gap-1 sm:grid-cols-10">
        {CICLOS.map((n) => {
          const marcado = n <= completados;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(String(n === completados ? n - 1 : n))}
              className={`flex flex-col items-center justify-center rounded-md border px-1 py-1.5 leading-tight transition-colors ${
                marcado
                  ? "border-btm-navy bg-btm-navy text-white"
                  : "border-black/15 text-btm-black/60 hover:border-btm-navy/40"
              }`}
            >
              <span className="text-[11px] font-bold">{n}</span>
              <span className="text-[9px] opacity-80">{n}.000</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TurnoForm({ formulas, operadores }: { formulas: Formula[]; operadores: Operador[] }) {
  const [state, formAction, pending] = useActionState(crearTurno, undefined);
  const [formKey, setFormKey] = useState(0);
  const [success, setSuccess] = useState(false);
  const wasPending = useRef(false);

  const [operadorId, setOperadorId] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [horaIngreso, setHoraIngreso] = useState("");
  const [horaSalida, setHoraSalida] = useState("");
  const [estadoConosSilos, setEstadoConosSilos] = useState("");
  const [estadoLimpieza, setEstadoLimpieza] = useState("");
  const [operadorAnterior, setOperadorAnterior] = useState("");
  const [engraseRoloHs, setEngraseRoloHs] = useState("");
  const [engraseEjePrensaHs, setEngraseEjePrensaHs] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const [mostrarEstadoPlanta, setMostrarEstadoPlanta] = useState(false);
  const [mostrarObservaciones, setMostrarObservaciones] = useState(false);
  const [empleados, setEmpleados] = useState<Empleado[]>([emptyEmpleado()]);
  const [paradas, setParadas] = useState<Parada[]>([]);
  const [producciones, setProducciones] = useState<Produccion[]>([emptyProduccion()]);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      setFormKey((k) => k + 1);
      setOperadorId("");
      setFecha(new Date().toISOString().slice(0, 10));
      setHoraIngreso("");
      setHoraSalida("");
      setEstadoConosSilos("");
      setEstadoLimpieza("");
      setOperadorAnterior("");
      setEngraseRoloHs("");
      setEngraseEjePrensaHs("");
      setObservaciones("");
      setMostrarEstadoPlanta(false);
      setMostrarObservaciones(false);
      setEmpleados([emptyEmpleado()]);
      setParadas([]);
      setProducciones([emptyProduccion()]);
      setSuccess(true);
      const t = setTimeout(() => setSuccess(false), 5000);
      return () => clearTimeout(t);
    }
    wasPending.current = pending;
  }, [pending, state]);

  function updateEmpleado(key: string, patch: Partial<Empleado>) {
    setEmpleados((prev) => prev.map((e) => (e.key === key ? { ...e, ...patch } : e)));
  }
  function removeEmpleado(key: string) {
    setEmpleados((prev) => (prev.length > 1 ? prev.filter((e) => e.key !== key) : prev));
  }

  function updateParada(key: string, patch: Partial<Parada>) {
    setParadas((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  }
  function removeParada(key: string) {
    setParadas((prev) => prev.filter((p) => p.key !== key));
  }

  function updateProduccion(key: string, patch: Partial<Produccion>) {
    setProducciones((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  }
  function removeProduccion(key: string) {
    setProducciones((prev) => (prev.length > 1 ? prev.filter((p) => p.key !== key) : prev));
  }

  function addReemplazo(prodKey: string) {
    setProducciones((prev) =>
      prev.map((p) => (p.key === prodKey ? { ...p, reemplazos: [...p.reemplazos, emptyReemplazo()] } : p)),
    );
  }
  function updateReemplazo(prodKey: string, reKey: string, patch: Partial<Reemplazo>) {
    setProducciones((prev) =>
      prev.map((p) =>
        p.key === prodKey
          ? { ...p, reemplazos: p.reemplazos.map((r) => (r.key === reKey ? { ...r, ...patch } : r)) }
          : p,
      ),
    );
  }
  function removeReemplazo(prodKey: string, reKey: string) {
    setProducciones((prev) =>
      prev.map((p) => (p.key === prodKey ? { ...p, reemplazos: p.reemplazos.filter((r) => r.key !== reKey) } : p)),
    );
  }

  const empleadosPayload = JSON.stringify(
    empleados
      .filter((e) => e.nombre.trim())
      .map((e) => ({
        nombre: e.nombre,
        hora_ingreso: e.horaIngreso || null,
        hora_salida: e.horaSalida || null,
      })),
  );

  const paradasPayload = JSON.stringify(
    paradas.map((p) => ({ tipo: p.tipo, detalle: p.detalle || null, minutos: p.minutos ? Number(p.minutos) : null })),
  );

  const produccionesPayload = JSON.stringify(
    producciones
      .filter((p) => p.formulaId)
      .map((p) => ({
        formula_id: p.formulaId,
        kg_objetivo: p.kgObjetivo ? Number(p.kgObjetivo) : null,
        tipo_envase: p.tipoEnvase || null,
        partida: p.partida || null,
        tipo_alimento: p.tipoAlimento || null,
        ciclos_completados: p.ciclosCompletados ? Number(p.ciclosCompletados) : 0,
        kg_producido_real: p.kgProducidoReal ? Number(p.kgProducidoReal) : null,
        granel_kg: p.granelKg ? Number(p.granelKg) : null,
        bolsas_cantidad: p.bolsasCantidad ? Number(p.bolsasCantidad) : null,
        rotulo_bolsas: p.rotuloBolsas || null,
        stock_granel_kg: p.stockGranelKg ? Number(p.stockGranelKg) : null,
        stock_bolsas_cantidad: p.stockBolsasCantidad ? Number(p.stockBolsasCantidad) : null,
        reemplazos: p.reemplazos
          .filter((r) => r.reemplazo || r.motivo || r.autorizo)
          .map((r) => ({ reemplazo: r.reemplazo || null, motivo: r.motivo || null, autorizo: r.autorizo || null })),
      })),
  );

  const hayProduccionValida = producciones.some((p) => p.formulaId);

  return (
    <form key={formKey} action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="operador_id" value={operadorId} />
      <input type="hidden" name="fecha" value={fecha} />
      <input type="hidden" name="hora_ingreso" value={horaIngreso} />
      <input type="hidden" name="hora_salida" value={horaSalida} />
      <input type="hidden" name="estado_conos_silos" value={estadoConosSilos} />
      <input type="hidden" name="estado_limpieza" value={estadoLimpieza} />
      <input type="hidden" name="operador_anterior" value={operadorAnterior} />
      <input type="hidden" name="engrase_rolo_hs" value={engraseRoloHs} />
      <input type="hidden" name="engrase_eje_prensa_hs" value={engraseEjePrensaHs} />
      <input type="hidden" name="observaciones" value={observaciones} />
      <input type="hidden" name="empleados" value={empleadosPayload} />
      <input type="hidden" name="paradas" value={paradasPayload} />
      <input type="hidden" name="producciones" value={produccionesPayload} />

      <Section title="Datos del turno">
        <Field label="Operador">
          <select value={operadorId} onChange={(e) => setOperadorId(e.target.value)} className={inputClass}>
            <option value="">Seleccionar...</option>
            {operadores.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombre}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Fecha">
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Hora de ingreso">
            <input type="time" value={horaIngreso} onChange={(e) => setHoraIngreso(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Hora de salida">
            <input type="time" value={horaSalida} onChange={(e) => setHoraSalida(e.target.value)} className={inputClass} />
          </Field>
        </div>

        <div className="flex flex-col gap-2 border-t border-black/10 pt-3">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
          Empleados afectados al turno
        </span>
        <div className="flex flex-col gap-2">
          {empleados.map((e) => (
            <div key={e.key} className="flex flex-col gap-2 rounded-md border border-black/10 p-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Field label="Nombre">
                  <select
                    value={e.nombre}
                    onChange={(ev) => updateEmpleado(e.key, { nombre: ev.target.value })}
                    className={inputClass}
                  >
                    <option value="">Seleccionar...</option>
                    {operadores.map((o) => (
                      <option key={o.id} value={o.nombre}>
                        {o.nombre}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="w-full sm:w-32">
                <Field label="Ingreso">
                  <input
                    type="time"
                    value={e.horaIngreso}
                    onChange={(ev) => updateEmpleado(e.key, { horaIngreso: ev.target.value })}
                    className={inputClass}
                  />
                </Field>
              </div>
              <div className="w-full sm:w-32">
                <Field label="Salida">
                  <input
                    type="time"
                    value={e.horaSalida}
                    onChange={(ev) => updateEmpleado(e.key, { horaSalida: ev.target.value })}
                    className={inputClass}
                  />
                </Field>
              </div>
              <button
                type="button"
                onClick={() => removeEmpleado(e.key)}
                className="shrink-0 rounded-md px-2 py-1.5 text-xs font-semibold text-btm-red hover:bg-btm-red/10"
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setEmpleados((prev) => [...prev, emptyEmpleado()])}
          className="self-start rounded-full border border-btm-navy px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
        >
          + Agregar empleado
        </button>
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Section title="Paradas durante el turno">
        <div className="flex flex-col gap-2">
          {paradas.map((p) => (
            <div key={p.key} className="flex flex-col gap-2 rounded-md border border-black/10 p-3 sm:flex-row sm:items-end">
              <div className="w-full sm:w-48">
                <Field label="Tipo">
                  <select value={p.tipo} onChange={(ev) => updateParada(p.key, { tipo: ev.target.value })} className={inputClass}>
                    {Object.entries(PARADA_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="flex-1">
                <Field label="Detalle">
                  <input
                    type="text"
                    value={p.detalle}
                    onChange={(ev) => updateParada(p.key, { detalle: ev.target.value })}
                    className={inputClass}
                  />
                </Field>
              </div>
              <div className="w-full sm:w-28">
                <Field label="Minutos">
                  <input
                    type="number"
                    min="0"
                    value={p.minutos}
                    onChange={(ev) => updateParada(p.key, { minutos: ev.target.value })}
                    className={inputClass}
                  />
                </Field>
              </div>
              <button
                type="button"
                onClick={() => removeParada(p.key)}
                className="shrink-0 rounded-md px-2 py-1.5 text-xs font-semibold text-btm-red hover:bg-btm-red/10"
              >
                Quitar
              </button>
            </div>
          ))}
          {paradas.length === 0 && <p className="text-sm text-btm-black/50">Sin paradas cargadas.</p>}
        </div>
        <button
          type="button"
          onClick={() => setParadas((prev) => [...prev, emptyParada()])}
          className="self-start rounded-full border border-btm-navy px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
        >
          + Agregar
        </button>
      </Section>

      <Section title="Estado de planta">
        {mostrarEstadoPlanta ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Estado de conos y silos">
              <select value={estadoConosSilos} onChange={(e) => setEstadoConosSilos(e.target.value)} className={inputClass}>
                <option value="">Sin especificar</option>
                <option value="BIEN">Bien</option>
                <option value="GOLPEADOS">Golpeados</option>
              </select>
            </Field>
            <Field label="Estado de limpieza recibido">
              <select value={estadoLimpieza} onChange={(e) => setEstadoLimpieza(e.target.value)} className={inputClass}>
                <option value="">Sin especificar</option>
                <option value="B">Bueno</option>
                <option value="R">Regular</option>
                <option value="M">Malo</option>
              </select>
            </Field>
            <Field label="Operador anterior">
              <input type="text" value={operadorAnterior} onChange={(e) => setOperadorAnterior(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Engrase rolo (hs)">
              <input type="text" value={engraseRoloHs} onChange={(e) => setEngraseRoloHs(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Engrase eje prensa (hs)">
              <input type="text" value={engraseEjePrensaHs} onChange={(e) => setEngraseEjePrensaHs(e.target.value)} className={inputClass} />
            </Field>
          </div>
        ) : (
          <p className="text-sm text-btm-black/50">Sin estado cargado.</p>
        )}
        {!mostrarEstadoPlanta && (
          <button
            type="button"
            onClick={() => setMostrarEstadoPlanta(true)}
            className="self-start rounded-full border border-btm-navy px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
          >
            + Agregar
          </button>
        )}
      </Section>

      <Section title="Observaciones">
        {mostrarObservaciones ? (
          <textarea
            rows={2}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className={inputClass}
          />
        ) : (
          <>
            <p className="text-sm text-btm-black/50">Sin observaciones cargadas.</p>
            <button
              type="button"
              onClick={() => setMostrarObservaciones(true)}
              className="self-start rounded-full border border-btm-navy px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
            >
              + Agregar
            </button>
          </>
        )}
      </Section>
      </div>

      <Section title="Productos elaborados en el turno">
        <div className="flex flex-col gap-3">
          {producciones.map((p) => {
            const formula = formulas.find((f) => f.id === p.formulaId);
            return (
              <div key={p.key} className="flex flex-col gap-3 rounded-md border border-black/10 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <Field label="Fórmula">
                      <FormulaCombobox
                        formulas={formulas}
                        value={p.formulaId}
                        onChange={(id) => updateProduccion(p.key, { formulaId: id })}
                      />
                    </Field>
                    {formula && (
                      <p className="mt-1 text-xs text-btm-black/50">Set total: {formula.set_total_kg} kg</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeProduccion(p.key)}
                    className="shrink-0 rounded-md px-2 py-1.5 text-xs font-semibold text-btm-red hover:bg-btm-red/10"
                  >
                    Quitar
                  </button>
                </div>

                {formula && (
                <>
                <SubGroup title="Datos del producto">
                  <Field label="Kg objetivo">
                    <input
                      type="number"
                      min="0"
                      value={p.kgObjetivo}
                      onChange={(e) => updateProduccion(p.key, { kgObjetivo: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Envase">
                    <select
                      value={p.tipoEnvase}
                      onChange={(e) => updateProduccion(p.key, { tipoEnvase: e.target.value })}
                      className={inputClass}
                    >
                      <option value="BOLSA">Bolsa</option>
                      <option value="GRANEL">Granel</option>
                      <option value="BIG_BAG">Big bag</option>
                    </select>
                  </Field>
                  <Field label="Partida">
                    <input
                      type="text"
                      value={p.partida}
                      onChange={(e) => updateProduccion(p.key, { partida: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Tipo de alimento">
                    <input
                      type="text"
                      value={p.tipoAlimento}
                      onChange={(e) => updateProduccion(p.key, { tipoAlimento: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                </SubGroup>

                <div className="flex flex-col gap-2 border-t border-black/10 pt-3">
                  <CiclosGrid
                    value={p.ciclosCompletados}
                    onChange={(v) => updateProduccion(p.key, { ciclosCompletados: v })}
                  />
                </div>

                <div className="border-t border-black/10 pt-3">
                  <button
                    type="button"
                    onClick={() => updateProduccion(p.key, { mostrarMas: !p.mostrarMas })}
                    className="text-xs font-semibold uppercase tracking-wide text-btm-navy hover:underline"
                  >
                    {p.mostrarMas ? "− Ocultar más opciones" : "+ Más opciones"}
                  </button>
                </div>

                {p.mostrarMas && (
                <>
                <SubGroup title="Resultado del ciclo">
                  <Field label="Kg producción real">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={p.kgProducidoReal}
                      onChange={(e) => updateProduccion(p.key, { kgProducidoReal: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Granel (kg)">
                    <input
                      type="number"
                      min="0"
                      value={p.granelKg}
                      onChange={(e) => updateProduccion(p.key, { granelKg: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Bolsas (cantidad)">
                    <input
                      type="number"
                      min="0"
                      value={p.bolsasCantidad}
                      onChange={(e) => updateProduccion(p.key, { bolsasCantidad: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Rótulo bolsas">
                    <input
                      type="text"
                      value={p.rotuloBolsas}
                      onChange={(e) => updateProduccion(p.key, { rotuloBolsas: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                </SubGroup>

                <SubGroup title="Stock al cierre">
                  <Field label="Stock granel al cierre (kg)">
                    <input
                      type="number"
                      min="0"
                      value={p.stockGranelKg}
                      onChange={(e) => updateProduccion(p.key, { stockGranelKg: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Stock bolsas al cierre">
                    <input
                      type="number"
                      min="0"
                      value={p.stockBolsasCantidad}
                      onChange={(e) => updateProduccion(p.key, { stockBolsasCantidad: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                </SubGroup>

                <div className="flex flex-col gap-2 border-t border-black/10 pt-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
                    Reemplazos de materia prima
                  </span>
                  {p.reemplazos.map((r) => (
                    <div key={r.key} className="flex flex-col gap-2 rounded-md border border-black/10 p-2 sm:flex-row sm:items-end">
                      <div className="flex-1">
                        <Field label="Reemplazo">
                          <input
                            type="text"
                            value={r.reemplazo}
                            onChange={(e) => updateReemplazo(p.key, r.key, { reemplazo: e.target.value })}
                            className={inputClass}
                          />
                        </Field>
                      </div>
                      <div className="flex-1">
                        <Field label="Motivo">
                          <input
                            type="text"
                            value={r.motivo}
                            onChange={(e) => updateReemplazo(p.key, r.key, { motivo: e.target.value })}
                            className={inputClass}
                          />
                        </Field>
                      </div>
                      <div className="flex-1">
                        <Field label="Autorizó">
                          <input
                            type="text"
                            value={r.autorizo}
                            onChange={(e) => updateReemplazo(p.key, r.key, { autorizo: e.target.value })}
                            className={inputClass}
                          />
                        </Field>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeReemplazo(p.key, r.key)}
                        className="shrink-0 rounded-md px-2 py-1.5 text-xs font-semibold text-btm-red hover:bg-btm-red/10"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addReemplazo(p.key)}
                    className="self-start rounded-full border border-btm-navy px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
                  >
                    + Agregar reemplazo
                  </button>
                </div>
                </>
                )}
                </>
                )}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setProducciones((prev) => [...prev, emptyProduccion()])}
          className="self-start rounded-full border border-btm-navy px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
        >
          + Agregar producto
        </button>
      </Section>

      {state?.error && (
        <p role="alert" className="text-sm font-medium text-btm-red">
          {state.error}
        </p>
      )}
      {success && (
        <p className="rounded-lg border border-btm-entregado bg-btm-entregado-bg px-4 py-3 text-sm font-semibold text-green-950">
          Turno guardado correctamente.
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !hayProduccionValida || !operadorId}
        className="self-start rounded-full bg-btm-navy px-8 py-3 font-display text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-btm-red disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar turno"}
      </button>
    </form>
  );
}
