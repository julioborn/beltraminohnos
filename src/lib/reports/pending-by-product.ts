export type PendingSummaryOrder = {
  id: string;
  numero: string;
  cliente: string;
  fecha: string;
  fecha_entrega: string | null;
  estado_logistica: "PENDIENTE" | "ENTREGADO";
  estado_produccion: "PENDIENTE" | "FABRICADO";
  items: { cantidad: number; product_id: string; product: { name: string } | null }[];
};

export type PendingNoteRef = { id: string; numero: string; cliente: string; fecha: string; cantidad: number };

export type PendingProductRow = {
  productId: string;
  productName: string;
  fabricacionTotal: number;
  fabricacionNotes: PendingNoteRef[];
  entregaTotal: number;
  entregaNotes: PendingNoteRef[];
};

export function aggregatePendingByProduct(
  products: { id: string; name: string }[],
  orders: PendingSummaryOrder[],
): PendingProductRow[] {
  const map = new Map<string, PendingProductRow>();

  for (const p of products) {
    map.set(p.id, {
      productId: p.id,
      productName: p.name,
      fabricacionTotal: 0,
      fabricacionNotes: [],
      entregaTotal: 0,
      entregaNotes: [],
    });
  }

  for (const o of orders) {
    for (const it of o.items) {
      if (!it.product_id) continue;
      let row = map.get(it.product_id);
      if (!row) {
        row = {
          productId: it.product_id,
          productName: it.product?.name ?? "—",
          fabricacionTotal: 0,
          fabricacionNotes: [],
          entregaTotal: 0,
          entregaNotes: [],
        };
        map.set(it.product_id, row);
      }

      const ref: PendingNoteRef = { id: o.id, numero: o.numero, cliente: o.cliente, fecha: o.fecha, cantidad: it.cantidad };

      if (o.estado_produccion === "PENDIENTE") {
        row.fabricacionTotal += it.cantidad;
        row.fabricacionNotes.push(ref);
      }
      if (o.estado_logistica === "PENDIENTE") {
        row.entregaTotal += it.cantidad;
        row.entregaNotes.push(ref);
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const diff = b.fabricacionTotal + b.entregaTotal - (a.fabricacionTotal + a.entregaTotal);
    return diff !== 0 ? diff : a.productName.localeCompare(b.productName);
  });
}
