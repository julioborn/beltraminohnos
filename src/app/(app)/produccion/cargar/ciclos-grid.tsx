"use client";

const CICLOS = Array.from({ length: 80 }, (_, i) => i + 1);

// Igual que la planilla de papel: se van tildando los casilleros de a 1.000kg
// en orden, no al azar — tocar un casillero marca todos los anteriores hasta
// ese punto (mucho más rápido que tipear un número y visualmente idéntico a
// cómo lo tildaban en planta).
export function CiclosGrid({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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
