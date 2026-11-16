// Informe por cliente: mismo criterio de "pendiente"/"entregado" que ya
// usa pending-by-day.ts (isRelevant) para Estadísticas y Productos
// pendientes — no se inventa una semántica nueva acá.

export type ClienteReportOrder = {
  cliente: string;
  fecha: string;
  items: {
    cantidad: number;
    precio_unitario: number;
    product_id: string | null;
    estado_produccion: "PENDIENTE" | "PARCIAL" | "FABRICADO";
    estado_logistica: "PENDIENTE" | "PARCIAL" | "ENTREGADO";
    product: { name: string } | null;
  }[];
};

type Metric = { cantidad: number; monto: number };

export type ClienteReportRow = {
  key: string;
  label: string;
  entregado: Metric;
  pendienteFabricar: Metric;
  pendienteEntregar: Metric;
  total: Metric;
};

type ClienteReportItem = ClienteReportOrder["items"][number] & { cliente: string };

function emptyRow(key: string, label: string): ClienteReportRow {
  return {
    key,
    label,
    entregado: { cantidad: 0, monto: 0 },
    pendienteFabricar: { cantidad: 0, monto: 0 },
    pendienteEntregar: { cantidad: 0, monto: 0 },
    total: { cantidad: 0, monto: 0 },
  };
}

function flattenItems(orders: ClienteReportOrder[]): ClienteReportItem[] {
  return orders.flatMap((o) => o.items.map((it) => ({ ...it, cliente: o.cliente })));
}

// Se agrega a nivel ítem, no de nota — una misma nota puede tener varios
// productos (o un mismo producto en distintos estados), y cada ítem tiene
// su propio estado_produccion/estado_logistica.
function aggregateItemsBy(
  items: ClienteReportItem[],
  getKeyAndLabel: (item: ClienteReportItem) => { key: string; label: string },
): ClienteReportRow[] {
  const map = new Map<string, ClienteReportRow>();

  for (const it of items) {
    const { key, label } = getKeyAndLabel(it);
    const row = map.get(key) ?? emptyRow(key, label);
    const monto = it.cantidad * it.precio_unitario;

    row.total.cantidad += it.cantidad;
    row.total.monto += monto;
    if (it.estado_logistica === "ENTREGADO") {
      row.entregado.cantidad += it.cantidad;
      row.entregado.monto += monto;
    }
    if (it.estado_produccion === "PENDIENTE") {
      row.pendienteFabricar.cantidad += it.cantidad;
      row.pendienteFabricar.monto += monto;
    }
    if (it.estado_logistica === "PENDIENTE") {
      row.pendienteEntregar.cantidad += it.cantidad;
      row.pendienteEntregar.monto += monto;
    }
    map.set(key, row);
  }

  return Array.from(map.values()).sort((a, b) => b.total.monto - a.total.monto);
}

// Vista de un cliente puntual: una fila por producto.
export function aggregateClienteProductos(orders: ClienteReportOrder[]): ClienteReportRow[] {
  return aggregateItemsBy(flattenItems(orders), (it) => ({
    key: it.product_id ?? "_",
    label: it.product?.name ?? "—",
  }));
}

// Vista "todos los clientes": una fila por cliente.
export function aggregateClientesResumen(orders: ClienteReportOrder[]): ClienteReportRow[] {
  return aggregateItemsBy(flattenItems(orders), (it) => ({ key: it.cliente, label: it.cliente }));
}

export type MesVolumen = { mes: number; label: string; toneladas: number };

// Siempre los 12 meses del año elegido (a diferencia de aggregateByMonth,
// que solo devuelve los meses con datos) — así el gráfico muestra huecos
// reales, no los esconde.
export function aggregateMensual(orders: ClienteReportOrder[], anio: number): MesVolumen[] {
  const toneladasPorMes = new Array(12).fill(0) as number[];
  for (const o of orders) {
    const [y, m] = o.fecha.split("-").map(Number);
    if (y !== anio) continue;
    const toneladas = o.items.reduce((sum, it) => sum + it.cantidad, 0);
    toneladasPorMes[m - 1] += toneladas;
  }

  return toneladasPorMes.map((toneladas, i) => ({
    mes: i + 1,
    label: new Date(anio, i, 1).toLocaleDateString("es-AR", { month: "short" }),
    toneladas,
  }));
}

// "YTD" (year-to-date): la curva acumulada mes a mes, para el segundo
// gráfico de la referencia de PowerBI.
export function acumularMensual(mensual: MesVolumen[]): MesVolumen[] {
  let acumulado = 0;
  return mensual.map((m) => {
    acumulado += m.toneladas;
    return { ...m, toneladas: acumulado };
  });
}
