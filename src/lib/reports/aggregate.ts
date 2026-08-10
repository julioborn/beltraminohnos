export type ReportOrder = {
  id: string;
  cliente: string;
  fecha: string;
  estado_logistica: "PENDIENTE" | "ENTREGADO";
  estado_produccion: "PENDIENTE" | "FABRICADO";
  zona: { name: string } | null;
  vendedor: { name: string } | null;
  items: { cantidad: number; precio_unitario: number; product: { name: string } | null }[];
};

export type AggregateRow = { label: string; count: number; total: number };
export type ProductAggregateRow = { label: string; cantidad: number; total: number };
export type MonthRow = { label: string; total: number };

function orderTotal(order: ReportOrder) {
  return order.items.reduce((sum, it) => sum + it.cantidad * it.precio_unitario, 0);
}

export function totalFacturado(orders: ReportOrder[]) {
  return orders.reduce((sum, o) => sum + orderTotal(o), 0);
}

function aggregateByLabel(orders: ReportOrder[], getLabel: (o: ReportOrder) => string): AggregateRow[] {
  const map = new Map<string, AggregateRow>();
  for (const o of orders) {
    const label = getLabel(o);
    const row = map.get(label) ?? { label, count: 0, total: 0 };
    row.count += 1;
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

export function aggregateByProducto(orders: ReportOrder[]): ProductAggregateRow[] {
  const map = new Map<string, ProductAggregateRow>();
  for (const o of orders) {
    for (const it of o.items) {
      const label = it.product?.name ?? "—";
      const row = map.get(label) ?? { label, cantidad: 0, total: 0 };
      row.cantidad += it.cantidad;
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
  const logistica = { PENDIENTE: 0, ENTREGADO: 0 };
  const produccion = { PENDIENTE: 0, FABRICADO: 0 };
  for (const o of orders) {
    logistica[o.estado_logistica] += 1;
    produccion[o.estado_produccion] += 1;
  }
  return { logistica, produccion };
}
