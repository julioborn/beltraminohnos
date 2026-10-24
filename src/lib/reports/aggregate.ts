export type ReportOrder = {
  id: string;
  cliente: string;
  fecha: string;
  estado_logistica: "PENDIENTE" | "PARCIAL" | "ENTREGADO";
  estado_produccion: "PENDIENTE" | "PARCIAL" | "FABRICADO";
  zona: { name: string } | null;
  vendedor: { name: string } | null;
  items: { cantidad: number; precio_unitario: number; product: { name: string } | null }[];
};

// Toneladas y monto son lo que le importa al dueño — la cantidad de notas
// no se usa para nada, por eso ningún aggregate la expone.
export type AggregateRow = { label: string; toneladas: number; total: number };
export type MonthRow = { label: string; total: number };

function orderTotal(order: ReportOrder) {
  return order.items.reduce((sum, it) => sum + it.cantidad * it.precio_unitario, 0);
}

function orderToneladas(order: ReportOrder) {
  return order.items.reduce((sum, it) => sum + it.cantidad, 0);
}

export function totalFacturado(orders: ReportOrder[]) {
  return orders.reduce((sum, o) => sum + orderTotal(o), 0);
}

export function totalToneladas(orders: ReportOrder[]) {
  return orders.reduce((sum, o) => sum + orderToneladas(o), 0);
}

function aggregateByLabel(orders: ReportOrder[], getLabel: (o: ReportOrder) => string): AggregateRow[] {
  const map = new Map<string, AggregateRow>();
  for (const o of orders) {
    const label = getLabel(o);
    const row = map.get(label) ?? { label, toneladas: 0, total: 0 };
    row.toneladas += orderToneladas(o);
    row.total += orderTotal(o);
    map.set(label, row);
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

export function aggregateByCliente(orders: ReportOrder[]): AggregateRow[] {
  return aggregateByLabel(orders, (o) => o.cliente);
}

export function aggregateByVendedor(orders: ReportOrder[]): AggregateRow[] {
  return aggregateByLabel(orders, (o) => o.vendedor?.name ?? "Sin asignar");
}

export function aggregateByZona(orders: ReportOrder[]): AggregateRow[] {
  return aggregateByLabel(orders, (o) => o.zona?.name ?? "Sin zona");
}

export function aggregateByProducto(orders: ReportOrder[]): AggregateRow[] {
  const map = new Map<string, AggregateRow>();
  for (const o of orders) {
    for (const it of o.items) {
      const label = it.product?.name ?? "—";
      const row = map.get(label) ?? { label, toneladas: 0, total: 0 };
      row.toneladas += it.cantidad;
      row.total += it.cantidad * it.precio_unitario;
      map.set(label, row);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

export type PendingItemOrder = {
  items: {
    cantidad: number;
    precio_unitario: number;
    estado_produccion: "PENDIENTE" | "PARCIAL" | "FABRICADO";
    estado_logistica: "PENDIENTE" | "PARCIAL" | "ENTREGADO";
    product: { name: string } | null;
  }[];
};

// Para las tarjetas de "pendientes de fabricación/entrega" de Estadísticas:
// agrega por producto solo los ítems que todavía están en PENDIENTE en el
// campo indicado, no toda la nota (una nota PARCIAL puede tener ítems ya
// resueltos que no deben contar acá).
export function aggregatePendingByProducto(
  orders: PendingItemOrder[],
  campo: "estado_produccion" | "estado_logistica",
): AggregateRow[] {
  const map = new Map<string, AggregateRow>();
  for (const o of orders) {
    for (const it of o.items) {
      if (it[campo] !== "PENDIENTE") continue;
      const label = it.product?.name ?? "—";
      const row = map.get(label) ?? { label, toneladas: 0, total: 0 };
      row.toneladas += it.cantidad;
      row.total += it.cantidad * it.precio_unitario;
      map.set(label, row);
    }
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

export function aggregateByMonth(orders: ReportOrder[]): MonthRow[] {
  const map = new Map<string, number>();
  for (const o of orders) {
    const key = o.fecha.slice(0, 7);
    map.set(key, (map.get(key) ?? 0) + orderTotal(o));
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, total]) => {
      const [y, m] = key.split("-").map(Number);
      const label = new Date(y, m - 1, 1).toLocaleDateString("es-AR", { month: "short", year: "2-digit" });
      return { label, total };
    });
}

export function estadoCounts(orders: ReportOrder[]) {
  const logistica = { PENDIENTE: 0, PARCIAL: 0, ENTREGADO: 0 };
  const produccion = { PENDIENTE: 0, PARCIAL: 0, FABRICADO: 0 };
  for (const o of orders) {
    logistica[o.estado_logistica] += 1;
    produccion[o.estado_produccion] += 1;
  }
  return { logistica, produccion };
}
