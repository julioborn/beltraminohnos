"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Formula = { id: string; codigo: string; nombre: string; set_total_kg: number };

function normalize(s: string) {
  return s
    .toUpperCase()
    .replace(/[ÁÀÄÂ]/g, "A")
    .replace(/[ÉÈËÊ]/g, "E")
    .replace(/[ÍÌÏÎ]/g, "I")
    .replace(/[ÓÒÖÔ]/g, "O")
    .replace(/[ÚÙÜÛ]/g, "U")
    .replace(/Ñ/g, "N")
    .trim();
}

function formulaLabel(f: Formula) {
  return `${f.codigo} · ${f.nombre}`;
}

export function FormulaCombobox({
  formulas,
  value,
  onChange,
}: {
  formulas: Formula[];
  value: string;
  onChange: (id: string) => void;
}) {
  const selected = formulas.find((f) => f.id === value) ?? null;
  const [query, setQuery] = useState(selected ? formulaLabel(selected) : "");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // El valor puede cambiar desde afuera (ej. "Quitar" en otro item no toca
  // este, pero un reset del formulario sí) — en vez de un efecto, se ajusta
  // el estado durante el render cuando `value` difiere de lo último visto.
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setQuery(selected ? formulaLabel(selected) : "");
  }

  const suggestions = useMemo(() => {
    const q = normalize(query);
    if (!q) return formulas.slice(0, 20);
    return formulas.filter((f) => normalize(formulaLabel(f)).includes(q)).slice(0, 20);
  }, [query, formulas]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        const f = formulas.find((x) => x.id === value) ?? null;
        setQuery(f ? formulaLabel(f) : "");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, formulas]);

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      <input
        type="text"
        autoComplete="off"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (value) onChange("");
        }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar por código o nombre..."
        className="w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
      />
      {open && (
        <div className="absolute top-full left-0 z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-black/15 bg-white shadow-lg">
          {suggestions.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                onChange(f.id);
                setQuery(formulaLabel(f));
                setOpen(false);
              }}
              className="block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-btm-navy/5"
            >
              {formulaLabel(f)}
            </button>
          ))}
          {suggestions.length === 0 && (
            <p className="px-3 py-2 text-xs text-btm-black/50">Sin resultados.</p>
          )}
        </div>
      )}
    </div>
  );
}
