import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfileRole, hasFullAccess } from "@/lib/auth/role";
import {
  getSucursales,
  getSucursalMovimientos,
  getSucursalSaldos,
  getStockFisico,
  getStockFisicoSucursal,
  getVentasPorProducto,
  type ConsignacionFilters,
} from "@/lib/data/consignaciones";
import { getActiveProducts } from "@/lib/data/master-data";
import { formatUsd } from "@/lib/format";
import { formatMonto, formatMontoCompact } from "@/lib/currency";
import { getCurrencyContext } from "@/lib/currency-server";
import {
  Bar3DChart,
  StackedBar3DChart,
  BAR_COLORS,
  type StackedBar3DRow,
  type StackedBar3DLegendItem,
} from "@/components/bar-chart-3d";
import {
  PendientesPorProducto,
  PendientesPorCliente,
  type PendienteSucursalProducto,
  type PendienteSucursalCliente,
} from "../pendientes-facturar";
import { CargarMovimientoAdminForm } from "../cargar-movimiento-form";
import { MovimientosTable } from "../movimientos-table";
import { PanelSucursalSelect } from "../panel-sucursal-select";
import { VentasFilter } from "../ventas-filter";

type Tab = "cargar" | "saldo" | "ventas" | "pendientes-sucursal" | "pendientes-cliente" | "stock" | "movimientos";
const TABS: { key: Tab; label: string }[] = [
  { key: "cargar", label: "Cargar movimiento" },
  { key: "saldo", label: "Saldo por sucursal" },
  { key: "ventas", label: "Ventas por producto" },
  { key: "pendientes-sucursal", label: "Pendientes a la sucursal" },
  { key: "pendientes-cliente", label: "Pendientes directo al cliente" },
  { key: "stock", label: "Stock físico" },
  { key: "movimientos", label: "Movimientos" },
];

export default async function ConsignacionesPanelPage({
  searchParams,
}: {
  searchParams: Promise<
    ConsignacionFilters & {
      tab?: string;
      stockSucursal?: string;
      stockProducto?: string;
      stockChartSucursal?: string;
      saldoChartSucursal?: string;
      ventasSucursal?: string;
      ventasMes?: string;
    }
  >;
}) {
  const role = await getProfileRole();
  if (!hasFullAccess(role) && role !== "contable") {
    redirect("/inicio");
  }

  const params = await searchParams;
  const tab: Tab = TABS.some((t) => t.key === params.tab) ? (params.tab as Tab) : "cargar";
  const rangeFilters = { desde: params.desde, hasta: params.hasta };
  const ventasRange = monthRange(params.ventasMes);

  const [sucursales, movimientos, saldos, stockFisico, ventasPorProducto, pendientesVenta, pendientesDirecta, products, { currency, tipoCambio }] =
    await Promise.all([
      getSucursales(),
      getSucursalMovimientos(params),
      getSucursalSaldos(),
      getStockFisico(),
      getVentasPorProducto({ ...ventasRange, sucursal: params.ventasSucursal }),
      getSucursalMovimientos({ ...rangeFilters, sucursal: params.sucursal, tipo: "VENTA", estado: "PENDIENTE" }),
      getSucursalMovimientos({ ...rangeFilters, sucursal: params.sucursal, tipo: "DIRECTA_CLIENTE", estado: "PENDIENTE" }),
      getActiveProducts(),
      getCurrencyContext(),
    ]);

  const fmtMonto = (value: number) => formatMonto(value, currency, tipoCambio);
  const fmtMontoCompact = (value: number) => formatMontoCompact(value, currency, tipoCambio);

  const stockChartSucursalId = sucursales.some((s) => s.id === params.stockChartSucursal)
    ? params.stockChartSucursal!
    : sucursales[0]?.id;
  const stockChartSucursal = sucursales.find((s) => s.id === stockChartSucursalId);
  const stockPorProductoSucursal = stockChartSucursal
    ? await getStockFisicoSucursal(stockChartSucursal.id, stockChartSucursal.zona_id)
    : [];

  const saldoChartSucursalId = saldos.some((s) => s.sucursalId === params.saldoChartSucursal)
    ? params.saldoChartSucursal!
    : saldos[0]?.sucursalId;
  const saldoChartSucursal = saldos.find((s) => s.sucursalId === saldoChartSucursalId);

  // Orden fijo de productos (de mayor a menor saldo total) para que el color
  // y la posición de cada segmento sea consistente entre todas las barras.
  const productoSaldoTotales = new Map<string, { productName: string; total: number }>();
  for (const s of saldos) {
    for (const p of s.productos) {
      const entry = productoSaldoTotales.get(p.productId) ?? { productName: p.productName, total: 0 };
      entry.total += p.saldoArs;
      productoSaldoTotales.set(p.productId, entry);
    }
  }
  const productoOrder = Array.from(productoSaldoTotales.entries())
    .map(([productId, v]) => ({ productId, ...v }))
    .sort((a, b) => b.total - a.total);
  const productoColor = new Map(productoOrder.map((p, i) => [p.productId, BAR_COLORS[i % BAR_COLORS.length]]));
  const saldoLegend: StackedBar3DLegendItem[] = productoOrder.map((p) => ({
    key: p.productId,
    label: p.productName,
    color: productoColor.get(p.productId)!,
  }));
  const saldoStackedRows: StackedBar3DRow[] = saldos.map((s) => ({
    label: s.sucursalName,
    total: s.saldo,
    segments: s.productos.map((p) => ({
      key: p.productId,
      label: p.productName,
      value: p.saldoArs,
      color: productoColor.get(p.productId) ?? "#2a78d6",
    })),
  }));

  const hasFilter = Boolean(params.desde || params.hasta || params.sucursal || params.tipo || params.estado);
  const hasSucursalFilter = Boolean(params.sucursal);
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();

  const totalVentas = saldos.reduce((sum, s) => sum + s.totalVentas, 0);
  const totalPendienteFacturar = saldos.reduce((sum, s) => sum + s.totalPendienteFacturar, 0);
  const totalPagado = saldos.reduce((sum, s) => sum + s.totalPagado, 0);
  const totalSaldo = saldos.reduce((sum, s) => sum + s.saldo, 0);

  const gruposPorProducto = groupPorProducto(pendientesVenta);
  const gruposPorCliente = groupPorCliente(pendientesDirecta);

  const hasStockFilter = Boolean(params.stockSucursal || params.stockProducto);
  const stockFisicoFiltrado = stockFisico.filter(
    (r) =>
      (!params.stockSucursal || r.sucursalId === params.stockSucursal) &&
      (!params.stockProducto || r.productId === params.stockProducto),
  );

  const ventasChartRows = ventasPorProducto.map((v) => ({ label: v.productName, primary: v.montoArs, secondary: v.toneladas }));
  const stockChartRows = aggregateToneladasBySucursal(stockFisicoFiltrado);
  const stockPorProductoChartRows = stockPorProductoSucursal.map((r) => ({
    label: r.productName,
    primary: r.montoUsd,
    secondary: r.toneladas,
  }));
  const movimientosChartRows = aggregateMovimientosBySucursal(movimientos);
  const pieGruposPorSucursalProducto = toPieGroups(gruposPorProducto, (g) => g.productName);
  const pieGruposPorSucursalCliente = toPieGroups(gruposPorCliente, (g) => g.clienteNombre);

  function tabHref(targetTab: Tab) {
    return `/consignaciones/panel${targetTab !== "cargar" ? `?tab=${targetTab}` : ""}`;
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/consignaciones"
            className="mb-1 flex w-fit items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-btm-black/50 hover:text-btm-navy"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
              <path d="M12.7 3.3a1 1 0 010 1.4L8.4 9h9.6a1 1 0 110 2H8.4l4.3 4.3a1 1 0 11-1.4 1.4l-6-6a1 1 0 010-1.4l6-6a1 1 0 011.4 0z" />
            </svg>
            Resumen
          </Link>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy">
            Consignaciones
          </h1>
          <p className="text-sm text-btm-black/60">Mercadería en consignación por sucursal</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Total vendido" value={fmtMonto(totalVentas)} />
        <Kpi label="Pendiente de facturar" value={fmtMonto(totalPendienteFacturar)} />
        <Kpi label="Total pagado" value={fmtMonto(totalPagado)} />
        <Kpi label="Saldo pendiente de cobro" value={fmtMonto(totalSaldo)} />
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={tabHref(t.key)}
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
              tab === t.key ? "border-btm-navy bg-btm-navy text-white" : "border-btm-navy text-btm-navy hover:bg-btm-navy/10"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "cargar" && <CargarMovimientoAdminForm sucursales={sucursales} products={products} />}

      {tab === "saldo" && (
        <section className="flex flex-col gap-3">
          {saldos.length === 0 ? (
            <p className="rounded-lg border border-black/10 p-4 text-sm text-btm-black/50">
              Todavía no hay sucursales cargadas.
            </p>
          ) : (
            <>
              <div className="rounded-lg border border-black/10 p-4 sm:p-5">
                <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">
                  Composición del saldo por producto y sucursal
                </h2>
                <p className="mb-3 text-xs text-btm-black/50">Importe facturado y no cobrado (solo ventas minoristas)</p>
                <StackedBar3DChart
                  rows={saldoStackedRows}
                  formatTotal={fmtMontoCompact}
                  formatSegment={fmtMontoCompact}
                  legend={saldoLegend}
                />
              </div>

              {saldoChartSucursal && (
                <div className="rounded-lg border border-black/10 p-4 sm:p-5">
                  <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                    <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">
                      Detalle del saldo por producto · {saldoChartSucursal.sucursalName}
                    </h2>
                    <PanelSucursalSelect
                      sucursales={sucursales}
                      selected={saldoChartSucursal.sucursalId}
                      paramName="saldoChartSucursal"
                    />
                  </div>
                  {saldoChartSucursal.productos.length === 0 ? (
                    <p className="text-sm text-btm-black/50">{saldoChartSucursal.sucursalName} no tiene saldo pendiente.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-black/10">
                      <table className="w-full min-w-[420px] text-sm">
                        <thead className="bg-black/[.03] text-left text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
                          <tr>
                            <th className="px-4 py-2.5">Producto</th>
                            <th className="px-4 py-2.5 text-right">Importe</th>
                            <th className="px-4 py-2.5 text-right">% del saldo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                          {saldoChartSucursal.productos.map((p) => (
                            <tr key={p.productId}>
                              <td className="px-4 py-2.5">
                                <span className="inline-flex items-center gap-1.5">
                                  <span
                                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                                    style={{ backgroundColor: productoColor.get(p.productId) ?? "#2a78d6" }}
                                    aria-hidden
                                  />
                                  {p.productName}
                                </span>
                              </td>
                              <td className="px-4 py-2.5 text-right">{fmtMonto(p.saldoArs)}</td>
                              <td className="px-4 py-2.5 text-right">
                                {saldoChartSucursal.saldo !== 0
                                  ? `${Math.round((p.saldoArs / saldoChartSucursal.saldo) * 100)}%`
                                  : "—"}
                              </td>
                            </tr>
                          ))}
                          <tr className="font-semibold">
                            <td className="px-4 py-2.5">Total</td>
                            <td className="px-4 py-2.5 text-right">{fmtMonto(saldoChartSucursal.saldo)}</td>
                            <td className="px-4 py-2.5 text-right">100%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              <div className="overflow-x-auto rounded-lg border border-black/10">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="bg-black/[.03] text-left text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
                    <tr>
                      <th className="px-4 py-2.5">Sucursal</th>
                      <th className="px-4 py-2.5 text-right">Total vendido</th>
                      <th className="px-4 py-2.5 text-right">Pagado</th>
                      <th className="px-4 py-2.5 text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {saldos.map((s) => (
                      <tr key={s.sucursalId}>
                        <td className="px-4 py-2.5 font-semibold text-btm-navy">{s.sucursalName}</td>
                        <td className="px-4 py-2.5 text-right">{fmtMonto(s.totalVentas)}</td>
                        <td className="px-4 py-2.5 text-right">{fmtMonto(s.totalPagado)}</td>
                        <td
                          className={`px-4 py-2.5 text-right font-semibold ${s.saldo > 0 ? "text-btm-red" : "text-btm-black/70"}`}
                        >
                          {fmtMonto(s.saldo)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}

      {tab === "ventas" && (
        <section className="flex flex-col gap-4 rounded-lg border border-black/10 p-4 sm:p-5">
          <VentasFilter
            sucursales={sucursales}
            selectedSucursal={params.ventasSucursal ?? ""}
            selectedMes={params.ventasMes ?? ""}
          />
          <Bar3DChart rows={ventasChartRows} formatPrimary={fmtMontoCompact} formatSecondary={formatTn} />
        </section>
      )}

      {tab === "pendientes-sucursal" && (
        <section className="flex flex-col gap-3">
          <SucursalFilterForm tab="pendientes-sucursal" sucursales={sucursales} selected={params.sucursal} hasFilter={hasSucursalFilter} />
          <PieChartGroup groups={pieGruposPorSucursalProducto} formatValue={fmtMonto} />
          <PendientesPorProducto groups={gruposPorProducto} currency={currency} tipoCambio={tipoCambio} />
        </section>
      )}

      {tab === "pendientes-cliente" && (
        <section className="flex flex-col gap-3">
          <SucursalFilterForm tab="pendientes-cliente" sucursales={sucursales} selected={params.sucursal} hasFilter={hasSucursalFilter} />
          <PieChartGroup groups={pieGruposPorSucursalCliente} formatValue={fmtMonto} />
          <PendientesPorCliente groups={gruposPorCliente} currency={currency} tipoCambio={tipoCambio} />
        </section>
      )}

      {tab === "stock" && (
        <>
          {stockChartRows.length > 0 && (
            <div className="rounded-lg border border-black/10 p-4 sm:p-5">
              <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-btm-navy">
                Stock físico por sucursal
              </h2>
              <Bar3DChart
                rows={stockChartRows.map((r) => ({ label: r.label, primary: r.montoUsd, secondary: r.toneladas }))}
                formatPrimary={formatUsd}
                formatSecondary={formatTn}
              />
            </div>
          )}

          {stockChartSucursal && (
            <div className="rounded-lg border border-black/10 p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">
                  Stock físico por producto · {stockChartSucursal.name}
                </h2>
                <PanelSucursalSelect sucursales={sucursales} selected={stockChartSucursal.id} paramName="stockChartSucursal" />
              </div>
              {stockPorProductoChartRows.length === 0 ? (
                <p className="text-sm text-btm-black/50">{stockChartSucursal.name} no tiene stock cargado.</p>
              ) : (
                <Bar3DChart rows={stockPorProductoChartRows} formatPrimary={formatUsd} formatSecondary={formatTn} />
              )}
            </div>
          )}

          <form
            method="get"
            className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 sm:flex-row sm:flex-wrap sm:items-end"
          >
            <input type="hidden" name="tab" value="stock" />
            <div className="flex flex-col gap-1">
              <label htmlFor="stockSucursal" className="text-xs font-semibold uppercase tracking-wide text-btm-black/60">
                Sucursal
              </label>
              <select
                id="stockSucursal"
                name="stockSucursal"
                defaultValue={params.stockSucursal ?? ""}
                className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm"
              >
                <option value="">Todas</option>
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="stockProducto" className="text-xs font-semibold uppercase tracking-wide text-btm-black/60">
                Producto
              </label>
              <select
                id="stockProducto"
                name="stockProducto"
                defaultValue={params.stockProducto ?? ""}
                className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm"
              >
                <option value="">Todos</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="rounded-md bg-btm-navy px-5 py-2 text-sm font-semibold text-white hover:bg-btm-red">
                Filtrar
              </button>
              {hasStockFilter && (
                <Link
                  href="/consignaciones/panel?tab=stock"
                  className="flex items-center justify-center rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-btm-black/70 hover:bg-black/5"
                >
                  Limpiar
                </Link>
              )}
            </div>
          </form>

          <section className="flex flex-col gap-3">
            {stockFisicoFiltrado.length === 0 ? (
              <p className="rounded-lg border border-black/10 p-4 text-sm text-btm-black/50">
                {stockFisico.length === 0 ? "Todavía no hay stock cargado." : "No hay stock para este filtro."}
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-black/10">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="bg-black/[.03] text-left text-[11px] font-semibold uppercase tracking-wide text-btm-black/60">
                    <tr>
                      <th className="px-3 py-2.5">Sucursal</th>
                      <th className="px-3 py-2.5">Producto</th>
                      <th className="px-3 py-2.5 text-right">Bolsas en stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {stockFisicoFiltrado.map((r) => (
                      <tr key={`${r.sucursalId}_${r.productId}`}>
                        <td className="px-3 py-2.5 font-semibold text-btm-navy">{r.sucursalName}</td>
                        <td className="px-3 py-2.5">{r.productName}</td>
                        <td className="px-3 py-2.5 text-right">{r.bolsas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {tab === "movimientos" && (
        <>
          {movimientosChartRows.length > 0 && (
            <div className="rounded-lg border border-black/10 p-4 sm:p-5">
              <Bar3DChart
                rows={movimientosChartRows.map((r) => ({ label: r.label, primary: r.monto, secondary: r.toneladas }))}
                formatPrimary={fmtMontoCompact}
                formatSecondary={formatTn}
              />
            </div>
          )}
          <form
            method="get"
            className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 sm:flex-row sm:flex-wrap sm:items-end"
          >
            <input type="hidden" name="tab" value="movimientos" />
            <div className="flex flex-col gap-1">
              <label htmlFor="desde" className="text-xs font-semibold uppercase tracking-wide text-btm-black/60">
                Desde
              </label>
              <input id="desde" type="date" name="desde" defaultValue={params.desde} className="rounded-md border border-black/15 px-3 py-2 text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="hasta" className="text-xs font-semibold uppercase tracking-wide text-btm-black/60">
                Hasta
              </label>
              <input id="hasta" type="date" name="hasta" defaultValue={params.hasta} className="rounded-md border border-black/15 px-3 py-2 text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="sucursal" className="text-xs font-semibold uppercase tracking-wide text-btm-black/60">
                Sucursal
              </label>
              <select id="sucursal" name="sucursal" defaultValue={params.sucursal ?? ""} className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm">
                <option value="">Todas</option>
                {sucursales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="tipo" className="text-xs font-semibold uppercase tracking-wide text-btm-black/60">
                Tipo de movimiento
              </label>
              <select id="tipo" name="tipo" defaultValue={params.tipo ?? ""} className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm">
                <option value="">Todos</option>
                <option value="INGRESO_STOCK">Ingreso stock</option>
                <option value="VENTA">Venta sucursal</option>
                <option value="DIRECTA_CLIENTE">Directa cliente</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="estado" className="text-xs font-semibold uppercase tracking-wide text-btm-black/60">
                Facturación
              </label>
              <select id="estado" name="estado" defaultValue={params.estado ?? ""} className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm">
                <option value="">Todas</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="FACTURADO">Facturado</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="rounded-md bg-btm-navy px-5 py-2 text-sm font-semibold text-white hover:bg-btm-red">
                Filtrar
              </button>
              {hasFilter && (
                <Link
                  href="/consignaciones/panel?tab=movimientos"
                  className="flex items-center justify-center rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-btm-black/70 hover:bg-black/5"
                >
                  Limpiar
                </Link>
              )}
            </div>
          </form>

          <section className="flex flex-col gap-3">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">
              Movimientos {qs && "(filtrados)"}
            </h2>
            {movimientos.length === 0 ? (
              <p className="rounded-lg border border-black/10 p-4 text-sm text-btm-black/50">
                No hay movimientos cargados todavía.
              </p>
            ) : (
              <MovimientosTable movimientos={movimientos} products={products} currency={currency} tipoCambio={tipoCambio} />
            )}
          </section>
        </>
      )}
    </div>
  );
}

type MovimientoRow = Awaited<ReturnType<typeof getSucursalMovimientos>>[number];

function movimientoToneladas(m: MovimientoRow) {
  return (m.cantidad_bolsas * (m.product?.kg_por_bolsa ?? 30)) / 1000;
}

function groupPorProducto(rows: MovimientoRow[]): PendienteSucursalProducto[] {
  const map = new Map<string, PendienteSucursalProducto>();
  for (const m of rows) {
    if (!m.sucursal || !m.product) continue;
    const key = `${m.sucursal.id}_${m.product.id}`;
    const group = map.get(key) ?? {
      key,
      sucursalName: m.sucursal.name,
      productName: m.product.name,
      bolsas: 0,
      toneladas: 0,
      montoArs: 0,
      ids: [] as string[],
    };
    group.bolsas += m.cantidad_bolsas;
    group.toneladas += movimientoToneladas(m);
    group.montoArs += m.monto_ars ?? 0;
    group.ids.push(m.id);
    map.set(key, group);
  }
  return Array.from(map.values()).sort((a, b) => b.montoArs - a.montoArs);
}

function groupPorCliente(rows: MovimientoRow[]): PendienteSucursalCliente[] {
  const map = new Map<string, PendienteSucursalCliente>();
  for (const m of rows) {
    if (!m.sucursal) continue;
    const clienteNombre = m.cliente_nombre ?? "Sin especificar";
    const key = `${m.sucursal.id}_${clienteNombre}_${m.cliente_cuit ?? ""}`;
    const group = map.get(key) ?? {
      key,
      sucursalName: m.sucursal.name,
      clienteNombre,
      clienteCuit: m.cliente_cuit,
      bolsas: 0,
      toneladas: 0,
      montoArs: 0,
      comisionArs: 0,
      ids: [] as string[],
    };
    group.bolsas += m.cantidad_bolsas;
    group.toneladas += movimientoToneladas(m);
    group.montoArs += m.monto_ars ?? 0;
    group.comisionArs += m.comision_ars ?? 0;
    group.ids.push(m.id);
    map.set(key, group);
  }
  return Array.from(map.values()).sort((a, b) => b.montoArs - a.montoArs);
}

function SucursalFilterForm({
  tab,
  sucursales,
  selected,
  hasFilter,
}: {
  tab: Tab;
  sucursales: { id: string; name: string }[];
  selected?: string;
  hasFilter: boolean;
}) {
  return (
    <form method="get" className="flex flex-wrap items-end gap-3 rounded-lg border border-black/10 p-4">
      <input type="hidden" name="tab" value={tab} />
      <div className="flex flex-col gap-1">
        <label htmlFor="sucursal" className="text-xs font-semibold uppercase tracking-wide text-btm-black/60">
          Sucursal
        </label>
        <select
          id="sucursal"
          name="sucursal"
          defaultValue={selected ?? ""}
          className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm"
        >
          <option value="">Todas</option>
          {sucursales.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="rounded-md bg-btm-navy px-5 py-2 text-sm font-semibold text-white hover:bg-btm-red">
          Filtrar
        </button>
        {hasFilter && (
          <Link
            href={`/consignaciones/panel?tab=${tab}`}
            className="flex items-center justify-center rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-btm-black/70 hover:bg-black/5"
          >
            Limpiar
          </Link>
        )}
      </div>
    </form>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-black/10 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-btm-black/50">{label}</p>
      <p className="font-display text-xl font-extrabold text-btm-navy sm:text-2xl">{value}</p>
    </div>
  );
}

function formatTn(value: number) {
  return `${value.toLocaleString("es-AR", { maximumFractionDigits: 2 })} tn`;
}

// "2026-10" (de un <input type="month">) -> primer y último día de ese mes.
function monthRange(mes?: string): { desde?: string; hasta?: string } {
  if (!mes) return {};
  const [y, m] = mes.split("-").map(Number);
  if (!y || !m) return {};
  const lastDay = new Date(y, m, 0).getDate();
  return { desde: `${mes}-01`, hasta: `${mes}-${String(lastDay).padStart(2, "0")}` };
}

function aggregateToneladasBySucursal(rows: { sucursalName: string; toneladas: number; montoUsd: number }[]) {
  const map = new Map<string, { toneladas: number; montoUsd: number }>();
  for (const r of rows) {
    const row = map.get(r.sucursalName) ?? { toneladas: 0, montoUsd: 0 };
    row.toneladas += r.toneladas;
    row.montoUsd += r.montoUsd;
    map.set(r.sucursalName, row);
  }
  return Array.from(map.entries())
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => b.montoUsd - a.montoUsd);
}

function aggregateMovimientosBySucursal(rows: MovimientoRow[]) {
  const map = new Map<string, { monto: number; toneladas: number }>();
  for (const m of rows) {
    if (!m.sucursal) continue;
    const row = map.get(m.sucursal.name) ?? { monto: 0, toneladas: 0 };
    row.monto += m.monto_ars ?? 0;
    row.toneladas += movimientoToneladas(m);
    map.set(m.sucursal.name, row);
  }
  return Array.from(map.entries())
    .map(([label, v]) => ({ label, ...v }))
    .sort((a, b) => b.monto - a.monto);
}

function toPieGroups<T extends { sucursalName: string; montoArs: number }>(
  groups: T[],
  getLabel: (g: T) => string,
): { sucursalName: string; slices: { label: string; value: number }[] }[] {
  const map = new Map<string, { label: string; value: number }[]>();
  for (const g of groups) {
    const slices = map.get(g.sucursalName) ?? [];
    slices.push({ label: getLabel(g), value: g.montoArs });
    map.set(g.sucursalName, slices);
  }
  return Array.from(map.entries()).map(([sucursalName, slices]) => ({ sucursalName, slices }));
}

const PIE_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#4a3aa7"];
const PIE_SLICE_CAP = 5;

function MiniPieChart({
  title,
  slices,
  formatValue,
}: {
  title: string;
  slices: { label: string; value: number }[];
  formatValue: (value: number) => string;
}) {
  const sorted = [...slices].filter((s) => s.value > 0).sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, PIE_SLICE_CAP);
  const restTotal = sorted.slice(PIE_SLICE_CAP).reduce((sum, s) => sum + s.value, 0);
  const display = restTotal > 0 ? [...top, { label: "Otros", value: restTotal }] : top;
  const total = display.reduce((sum, d) => sum + d.value, 0);

  if (total <= 0) return null;

  const boundaries = display.reduce<{ start: number; end: number }[]>((acc, d) => {
    const prevEnd = acc.length > 0 ? acc[acc.length - 1].end : 0;
    return [...acc, { start: prevEnd, end: prevEnd + (d.value / total) * 360 }];
  }, []);
  const stops = display
    .map((d, i) => `${PIE_COLORS[i % PIE_COLORS.length]} ${boundaries[i].start}deg ${boundaries[i].end}deg`)
    .join(", ");

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-black/10 p-4">
      <h3 className="font-display text-xs font-bold uppercase tracking-wide text-btm-navy">{title}</h3>
      <div
        className="h-28 w-28 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${stops})` }}
        role="img"
        aria-label={`${title}: ${display.map((d) => `${d.label} ${Math.round((d.value / total) * 100)}%`).join(", ")}`}
      />
      <div className="flex w-full flex-col gap-1">
        {display.map((d, i) => (
          <div key={d.label} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
              aria-hidden
            />
            <span className="flex-1 truncate text-btm-black/70" title={d.label}>
              {d.label}
            </span>
            <span className="btm-fig shrink-0 font-semibold text-btm-navy">{formatValue(d.value)}</span>
            <span className="w-9 shrink-0 text-right text-btm-black/40">{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PieChartGroup({
  groups,
  formatValue,
}: {
  groups: { sucursalName: string; slices: { label: string; value: number }[] }[];
  formatValue: (value: number) => string;
}) {
  if (groups.length === 0) return null;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((g) => (
        <MiniPieChart key={g.sucursalName} title={g.sucursalName} slices={g.slices} formatValue={formatValue} />
      ))}
    </div>
  );
}
