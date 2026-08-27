import { eachDateInRange } from "@/lib/date-range";

export type PendingDayOrder = {
  id: string;
  numero: string;
  cliente: string;
  fecha_entrega: string | null;
  items: {
    cantidad: number;
    product_id: string;
    estado_produccion: "PENDIENTE" | "PARCIAL" | "FABRICADO";
    estado_logistica: "PENDIENTE" | "PARCIAL" | "ENTREGADO";
  }[];
};

export type PendingDayMode = "fabricacion" | "entrega";

export type PendingProductNoteRef = {
  id: string;
  numero: string;
  cliente: string;
  fecha_entrega: string | null;
  cantidad: number;
};

export type PendingDayRow = {
  productId: string;
  productName: string;
  byDay: Record<string, number>;
  total: number;
};

export type PendingDayMatrix = {
  days: string[];
  rows: PendingDayRow[];
};

export function buildPendingDayMatrix(
  products: { id: string; name: string }[],
  orders: PendingDayOrder[],
  start: string,
  end: string,
  mode: PendingDayMode,
): PendingDayMatrix {
  const days = eachDateInRange(start, end);
  const dayIndex = new Set(days);

  const rowsByProduct = new Map<string, { productName: string; byDay: Record<string, number> }>();
  for (const p of products) {
    rowsByProduct.set(p.id, { productName: p.name, byDay: Object.fromEntries(days.map((d) => [d, 0])) });
  }

  for (const o of orders) {
    if (!o.fecha_entrega || !dayIndex.has(o.fecha_entrega)) continue;

    for (const it of o.items) {
      if (!it.product_id) continue;
      const relevant = mode === "fabricacion" ? it.estado_produccion === "PENDIENTE" : it.estado_logistica === "PENDIENTE";
      if (!relevant) continue;

      let row = rowsByProduct.get(it.product_id);
      if (!row) {
        row = { productName: "—", byDay: Object.fromEntries(days.map((d) => [d, 0])) };
        rowsByProduct.set(it.product_id, row);
      }
      row.byDay[o.fecha_entrega] = (row.byDay[o.fecha_entrega] ?? 0) + it.cantidad;
    }
  }

  const rows: PendingDayRow[] = Array.from(rowsByProduct.entries()).map(([productId, row]) => ({
    productId,
    productName: row.productName,
    byDay: row.byDay,
    total: days.reduce((sum, d) => sum + (row.byDay[d] ?? 0), 0),
  }));

  return { days, rows };
}

export function notesForProduct(
  orders: PendingDayOrder[],
  productId: string,
  mode: PendingDayMode,
  range?: { start: string; end: string },
): PendingProductNoteRef[] {
  const refs: PendingProductNoteRef[] = [];

  for (const o of orders) {
    if (range) {
      if (!o.fecha_entrega || o.fecha_entrega < range.start || o.fecha_entrega > range.end) continue;
    }

    for (const it of o.items) {
      if (it.product_id !== productId) continue;
      const relevant = mode === "fabricacion" ? it.estado_produccion === "PENDIENTE" : it.estado_logistica === "PENDIENTE";
      if (!relevant) continue;
      refs.push({ id: o.id, numero: o.numero, cliente: o.cliente, fecha_entrega: o.fecha_entrega, cantidad: it.cantidad });
    }
  }

  return refs.sort((a, b) => (a.fecha_entrega ?? "").localeCompare(b.fecha_entrega ?? ""));
}
