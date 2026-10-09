"use client";

import { useActionState, useState } from "react";
import { crearTurno } from "@/lib/actions/produccion";

type Operador = { id: string; nombre: string };

type Empleado = { key: string; nombre: string; horaIngreso: string; horaSalida: string };

function horaActual() {
  return new Date().toTimeString().slice(0, 5);
}

function emptyEmpleado(): Empleado {
  return { key: crypto.randomUUID(), nombre: "", horaIngreso: "", horaSalida: "" };
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

export function TurnoForm({ operadores }: { operadores: Operador[] }) {
  const [state, formAction, pending] = useActionState(crearTurno, undefined);

  const [operadorId, setOperadorId] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [horaIngreso, setHoraIngreso] = useState(horaActual);
  const [horaSalida, setHoraSalida] = useState(horaActual);
  const [empleados, setEmpleados] = useState<Empleado[]>([emptyEmpleado()]);

  function updateEmpleado(key: string, patch: Partial<Empleado>) {
    setEmpleados((prev) => prev.map((e) => (e.key === key ? { ...e, ...patch } : e)));
  }
  function removeEmpleado(key: string) {
    setEmpleados((prev) => (prev.length > 1 ? prev.filter((e) => e.key !== key) : prev));
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

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="operador_id" value={operadorId} />
      <input type="hidden" name="fecha" value={fecha} />
      <input type="hidden" name="hora_ingreso" value={horaIngreso} />
      <input type="hidden" name="hora_salida" value={horaSalida} />
      <input type="hidden" name="empleados" value={empleadosPayload} />

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

      {state?.error && (
        <p role="alert" className="text-sm font-medium text-btm-red">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !operadorId}
        className="self-start rounded-full bg-btm-navy px-8 py-3 font-display text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-btm-red disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Creando..." : "Crear turno y cargar productos"}
      </button>
    </form>
  );
}
