"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Cliente = { id: string; name: string };

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

export function ClienteAutocomplete({ clientes }: { clientes: Cliente[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const q = normalize(query);
    if (!q) return clientes.slice(0, 8);
    return clientes.filter((c) => normalize(c.name).includes(q)).slice(0, 8);
  }, [query, clientes]);

  const exactMatch = useMemo(
    () => clientes.some((c) => normalize(c.name) === normalize(query)),
    [clientes, query],
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      <label htmlFor="cliente" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
        Cliente
      </label>
      <input
        id="cliente"
        name="cliente"
        required
        autoComplete="off"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar cliente..."
        className="rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
      />
      {open && (
        <div className="absolute top-full left-0 z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-black/15 bg-white shadow-lg">
          {suggestions.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                setQuery(c.name);
                setOpen(false);
              }}
              className="block w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-btm-navy/5"
            >
              {c.name}
            </button>
          ))}
          {suggestions.length === 0 && !query.trim() && (
            <p className="px-3 py-2 text-xs text-btm-black/50">Empezá a escribir para buscar...</p>
          )}
          {!exactMatch && query.trim() && (
            <p className="border-t border-black/10 px-3 py-2 text-xs text-btm-black/50">
              + Se creará <span className="font-semibold text-btm-navy">&ldquo;{query.trim().toUpperCase()}&rdquo;</span> como cliente nuevo
            </p>
          )}
        </div>
      )}
    </div>
  );
}
