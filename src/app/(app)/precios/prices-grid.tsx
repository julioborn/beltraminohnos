"use client";

import { useState, useTransition } from "react";
import { updatePrice } from "@/lib/actions/prices";
import { PRICEABLE_PACKAGING_TYPES, PACKAGING_LABELS, type PackagingType } from "@/lib/packaging";

type Product = { id: string; name: string };
type Zone = { id: string; code: string; name: string };
type PriceRow = {
  product_id: string;
  packaging_type: PackagingType;
  zone_id: string;
  price_usd: number | null;
};

function key(productId: string, packagingType: PackagingType, zoneId: string) {
  return `${productId}_${packagingType}_${zoneId}`;
}

const TAB_LABELS: Partial<Record<PackagingType, string>> = {
  GRANEL: "Granel y Big Bag",
};

export function PricesGrid({
  products,
  zones,
  prices,
}: {
  products: Product[];
  zones: Zone[];
  prices: PriceRow[];
}) {
  const [tab, setTab] = useState<PackagingType>("GRANEL");
  const [values, setValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const p of prices) {
      map[key(p.product_id, p.packaging_type, p.zone_id)] = p.price_usd?.toString() ?? "";
    }
    return map;
  });
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleBlur(productId: string, zoneId: string, raw: string) {
    const k = key(productId, tab, zoneId);
    const parsed = raw.trim() === "" ? null : Number(raw);
    if (parsed !== null && Number.isNaN(parsed)) return;

    setSavingKey(k);
    setErrorKey(null);
    startTransition(async () => {
      const result = await updatePrice(productId, tab, zoneId, parsed);
      setSavingKey(null);
      if (result.error) setErrorKey(k);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {PRICEABLE_PACKAGING_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 font-display text-xs font-bold uppercase tracking-wide transition-colors ${
              tab === t ? "bg-btm-navy text-white" : "border border-btm-navy text-btm-navy hover:bg-btm-navy/10"
            }`}
          >
            {TAB_LABELS[t] ?? PACKAGING_LABELS[t]}
          </button>
        ))}
      </div>

      <p className="text-xs text-btm-black/50 md:hidden">Deslizá hacia los costados para ver todas las zonas →</p>

      <div className="overflow-x-auto rounded-lg border border-black/10">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="bg-btm-navy text-left text-xs font-semibold uppercase tracking-wide text-white">
            <tr>
              <th className="sticky left-0 bg-btm-navy px-4 py-3">Producto</th>
              {zones.map((z) => (
                <th key={z.id} className="px-3 py-3">{z.name}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-black/[.02]">
                <td className="sticky left-0 bg-white px-4 py-2 font-medium">{product.name}</td>
                {zones.map((zone) => {
                  const k = key(product.id, tab, zone.id);
                  const value = values[k] ?? "";
                  return (
                    <td key={zone.id} className="px-2 py-1.5">
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={value}
                        onChange={(e) => setValues((prev) => ({ ...prev, [k]: e.target.value }))}
                        onBlur={(e) => handleBlur(product.id, zone.id, e.target.value)}
                        placeholder="—"
                        className={`w-24 rounded-md border px-2 py-1.5 text-sm ${
                          errorKey === k
                            ? "border-btm-red"
                            : savingKey === k
                              ? "border-btm-navy"
                              : "border-black/15"
                        }`}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
