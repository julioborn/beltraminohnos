"use client";

import { useEffect, useMemo, useState } from "react";
import { PACKAGING_TYPES, PACKAGING_LABELS, pricingPackagingType, type PackagingType } from "@/lib/packaging";
import { ClienteAutocomplete } from "../pedidos/nuevo/cliente-autocomplete";

const DOLAR_FORMATTER = new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

type Option = { id: string; name: string };
type Zone = { id: string; code: string; name: string };
type Cliente = { id: string; name: string };

type Item = {
  key: string;
  productId: string;
  tipoEnvase: PackagingType;
  cantidad: string;
};

function emptyItem(): Item {
  return { key: crypto.randomUUID(), productId: "", tipoEnvase: "BOLSA", cantidad: "" };
}

const COMBINING_MARKS = new RegExp(String.fromCharCode(91, 768, 45, 879, 93), "g");

function slugify(value: string) {
  const withoutAccents = value.normalize("NFD").replace(COMBINING_MARKS, "");
  const slug = withoutAccents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return slug || "cliente";
}

function Section({
  number,
  title,
  twoCol,
  children,
}: {
  number: number;
  title: string;
  twoCol?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="btm-card flex flex-col gap-4 p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-btm-navy font-display text-[11px] font-bold text-white">
          {number}
        </span>
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">{title}</h2>
      </div>
      <div className={twoCol ? "grid grid-cols-1 gap-4 sm:grid-cols-2" : "flex flex-col gap-4"}>{children}</div>
    </section>
  );
}

export function QuoteForm({
  products,
  zones,
  vendedores,
  priceMap,
  clientes,
  defaultVendedorId,
}: {
  products: Option[];
  zones: Zone[];
  vendedores: Option[];
  priceMap: Record<string, number | null>;
  clientes: Cliente[];
  defaultVendedorId?: string;
}) {
  const [zonaId, setZonaId] = useState("");
  const [items, setItems] = useState<Item[]>([emptyItem()]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dolar, setDolar] = useState("");
  const [dolarFecha, setDolarFecha] = useState<string | null>(null);
  const [dolarLoading, setDolarLoading] = useState(false);
  const [dolarError, setDolarError] = useState(false);

  function fetchDolar() {
    setDolarLoading(true);
    setDolarError(false);
    fetch("/api/dolar/oficial")
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.venta === "number") {
          setDolar(String(data.venta));
          setDolarFecha(data.fecha ?? null);
        } else {
          setDolarError(true);
        }
      })
      .catch(() => setDolarError(true))
      .finally(() => setDolarLoading(false));
  }

  useEffect(() => {
    fetchDolar();
  }, []);

  function updateItem(key: string, patch: Partial<Item>) {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }

  function removeItem(key: string) {
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.key !== key) : prev));
  }

  function priceFor(item: Item) {
    if (!item.productId || !zonaId) return null;
    const packagingType = pricingPackagingType(item.tipoEnvase);
    return priceMap[`${item.productId}_${packagingType}_${zonaId}`] ?? null;
  }

  const linedUpItems = useMemo(() => items.filter((it) => it.productId), [items]);
  const computableItems = useMemo(
    () => linedUpItems.filter((it) => it.cantidad && priceFor(it) !== null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [linedUpItems, zonaId],
  );
  const total = computableItems.reduce((sum, it) => sum + Number(it.cantidad) * (priceFor(it) ?? 0), 0);
  const hasExcludedItems = linedUpItems.length > computableItems.length;
  const dolarValue = Number(dolar) || null;
  const totalArs = dolarValue ? total * dolarValue : null;

  async function handleGenerar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const cliente = String(formData.get("cliente") ?? "").trim();
    const vendedorId = String(formData.get("vendedor_id") ?? "");
    const vendedorName = vendedores.find((v) => v.id === vendedorId)?.name ?? null;
    const zonaName = zones.find((z) => z.id === zonaId)?.name ?? "";
    const fecha = String(formData.get("fecha") ?? "");
    const validoHasta = String(formData.get("valido_hasta") ?? "").trim() || null;
    const observaciones = String(formData.get("observaciones") ?? "").trim() || null;

    const itemsPayload = linedUpItems.map((it) => ({
      producto: products.find((p) => p.id === it.productId)?.name ?? "",
      tipoEnvase: it.tipoEnvase,
      cantidad: it.cantidad ? Number(it.cantidad) : null,
      precioUnitario: priceFor(it),
    }));

    setGenerating(true);
    try {
      const res = await fetch("/cotizaciones/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente,
          zona: zonaName,
          vendedor: vendedorName,
          fecha,
          validoHasta,
          observaciones,
          items: itemsPayload,
          dolar: dolarValue,
        }),
      });
      if (!res.ok) throw new Error("request failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cotizacion-${slugify(cliente)}-${fecha}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("No se pudo generar la cotización. Intentá de nuevo.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <form onSubmit={handleGenerar} className="flex flex-col gap-4">
      <Section number={1} title="Cliente">
        <ClienteAutocomplete clientes={clientes} />
      </Section>

      <Section number={2} title="Vendedor y zona comercial" twoCol>
        <div className="flex flex-col gap-1">
          <label htmlFor="vendedor_id" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
            Vendedor
          </label>
          <select
            id="vendedor_id"
            name="vendedor_id"
            defaultValue={defaultVendedorId || ""}
            className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
          >
            <option value="">Sin asignar</option>
            {vendedores.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="zona_id" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
            Zona comercial
          </label>
          <select
            id="zona_id"
            name="zona_id"
            required
            value={zonaId}
            onChange={(e) => setZonaId(e.target.value)}
            className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
          >
            <option value="">Seleccionar...</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>
      </Section>

      <Section number={3} title="Cotización del dólar">
        <div className="flex flex-col gap-1 sm:w-56">
          <label htmlFor="dolar" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
            Dólar oficial (ARS)
          </label>
          <div className="flex items-center gap-2">
            <input
              id="dolar"
              name="dolar"
              type="number"
              min="0"
              step="0.01"
              value={dolar}
              onChange={(e) => setDolar(e.target.value)}
              placeholder={dolarLoading ? "Cargando..." : "0.00"}
              className="w-full rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
            />
            <button
              type="button"
              onClick={fetchDolar}
              disabled={dolarLoading}
              title="Actualizar desde el banco"
              className="shrink-0 cursor-pointer rounded-md border border-black/15 p-2 text-btm-black/60 hover:border-btm-navy hover:text-btm-navy disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshIcon spinning={dolarLoading} />
            </button>
          </div>
          <p className="text-xs text-btm-black/50">
            {dolarError
              ? "No se pudo obtener el valor del banco. Podés cargarlo a mano."
              : dolarFecha
                ? `Oficial del banco · ${DOLAR_FORMATTER.format(new Date(dolarFecha))}`
                : "Se completa con el valor oficial del día — se puede modificar."}
          </p>
        </div>
      </Section>

      <Section number={4} title="Fecha y validez" twoCol>
        <div className="flex flex-col gap-1">
          <label htmlFor="fecha" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
            Fecha
          </label>
          <input
            id="fecha"
            name="fecha"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="valido_hasta" className="text-xs font-semibold uppercase tracking-wide text-btm-black/70">
            Válido hasta
          </label>
          <input
            id="valido_hasta"
            name="valido_hasta"
            type="date"
            className="rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
          />
        </div>
      </Section>

      <Section number={5} title="Observaciones">
        <textarea
          id="observaciones"
          name="observaciones"
          rows={2}
          className="rounded-md border border-black/15 px-3 py-2 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
        />
      </Section>

      <Section number={6} title="Productos">
        <div className="flex items-center justify-between">
          <span />
          <button
            type="button"
            onClick={() => setItems((prev) => [...prev, emptyItem()])}
            className="rounded-full border border-btm-navy px-3 py-1 text-xs font-semibold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
          >
            + Agregar producto
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const price = priceFor(item);
            const cantidad = Number(item.cantidad) || 0;
            return (
              <div key={item.key} className="flex flex-col gap-2 rounded-md border border-black/10 p-3">
                <div className="flex items-end gap-2">
                  <div className="flex flex-1 flex-col gap-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
                      Producto
                    </label>
                    <select
                      value={item.productId}
                      onChange={(e) => updateItem(item.key, { productId: e.target.value })}
                      className="w-full rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm"
                    >
                      <option value="">Seleccionar...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex w-32 shrink-0 flex-col gap-1 sm:w-40">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
                      Envase
                    </label>
                    <select
                      value={item.tipoEnvase}
                      onChange={(e) => updateItem(item.key, { tipoEnvase: e.target.value as PackagingType })}
                      className="w-full rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm"
                    >
                      {PACKAGING_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {PACKAGING_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.key)}
                    className="shrink-0 rounded-md px-2 py-1.5 text-xs font-semibold text-btm-red hover:bg-btm-red/10"
                  >
                    Quitar
                  </button>
                </div>

                <div className="flex items-end gap-2">
                  <div className="flex w-28 shrink-0 flex-col gap-1 sm:w-32">
                    <label className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
                      Cantidad (tn)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Opcional"
                      value={item.cantidad}
                      onChange={(e) => updateItem(item.key, { cantidad: e.target.value })}
                      className="w-full rounded-md border border-black/15 px-2 py-1.5 text-sm"
                    />
                  </div>

                  <div className="flex flex-1 flex-col gap-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
                      Precio USD/tn
                    </span>
                    <span className="px-2 py-1.5 text-sm">
                      {price === null ? (
                        <span className="text-btm-red">Sin precio</span>
                      ) : cantidad > 0 ? (
                        `$${price.toFixed(3)} · $${(price * cantidad).toFixed(2)}`
                      ) : (
                        `$${price.toFixed(3)} /tn`
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col items-end gap-1">
          <p className="text-right font-display text-sm font-bold text-btm-navy">
            Total: ${total.toFixed(2)}
          </p>
          {totalArs !== null && (
            <p className="text-right text-sm text-btm-black/60">
              Aprox. ${totalArs.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ARS
            </p>
          )}
          {hasExcludedItems && (
            <p className="text-right text-xs text-btm-black/50">
              * No incluye líneas sin cantidad y/o precio cargados.
            </p>
          )}
        </div>
      </Section>

      {error && (
        <p role="alert" className="text-sm font-medium text-btm-red">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={generating}
        className="self-start rounded-full bg-btm-navy px-8 py-3 font-display text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-btm-red disabled:opacity-60"
      >
        {generating ? "Generando..." : "Generar PDF"}
      </button>
    </form>
  );
}

function RefreshIcon({ spinning }: { spinning?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`}
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 4v5h-5" />
    </svg>
  );
}
