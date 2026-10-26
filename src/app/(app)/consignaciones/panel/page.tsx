import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfileRole, hasFullAccess } from "@/lib/auth/role";
import {
  getSucursales,
  getSucursalMovimientos,
  getSucursalSaldos,
  getStockFisico,
  getVentasPorProducto,
  type ConsignacionFilters,
} from "@/lib/data/consignaciones";
import { getActiveProducts } from "@/lib/data/master-data";
import { formatArs } from "@/lib/format";
import { ScrollFade } from "@/components/scroll-fade";
import {
  PendientesPorProducto,
  PendientesPorCliente,
  type PendienteSucursalProducto,
  type PendienteSucursalCliente,
} from "../pendientes-facturar";
import { CargarMovimientoAdminForm } from "../cargar-movimiento-form";
import { MovimientosTable } from "../movimientos-table";

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
  searchParams: Promise<ConsignacionFilters & { tab?: string; stockSucursal?: string; stockProducto?: string }>;
}) {
  const role = await getProfileRole();
  if (!hasFullAccess(role) && role !== "contable") {
    redirect("/inicio");
  }

  const params = await searchParams;
  const tab: Tab = TABS.some((t) => t.key === params.tab) ? (params.tab as Tab) : "cargar";
  const rangeFilters = { desde: params.desde, hasta: params.hasta };

  const [sucursales, movimientos, saldos, stockFisico, ventasPorProducto, pendientesVenta, pendientesDirecta, products] =
    await Promise.all([
      getSucursales(),
      getSucursalMovimientos(params),
      getSucursalSaldos(),
      getStockFisico(),
      getVentasPorProducto(rangeFilters),
      getSucursalMovimientos({ ...rangeFilters, sucursal: params.sucursal, tipo: "VENTA", estado: "PENDIENTE" }),
      getSucursalMovimientos({ ...rangeFilters, sucursal: params.sucursal, tipo: "DIRECTA_CLIENTE", estado: "PENDIENTE" }),
      getActiveProducts(),
    ]);

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

  const saldoChartRows = saldos.map((s) => ({ label: s.sucursalName, primary: s.saldo, secondary: s.totalVentas }));
  const ventasChartRows = ventasPorProducto.map((v) => ({ label: v.productName, primary: v.montoArs, secondary: v.toneladas }));
  const stockChartRows = aggregateToneladasBySucursal(stockFisicoFiltrado);
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
        <Kpi label="Total vendido" value={formatArs(totalVentas)} />
        <Kpi label="Pendiente de facturar" value={formatArs(totalPendienteFacturar)} />
        <Kpi label="Total pagado" value={formatArs(totalPagado)} />
        <Kpi label="Saldo pendiente de cobro" value={formatArs(totalSaldo)} />
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
                <HorizontalBarChart
                  rows={saldoChartRows}
                  primaryLabel="Saldo"
                  secondaryLabel="Vendido"
                  formatPrimary={formatArs}
                  formatSecondary={formatArs}
                />
              </div>
              <ScrollFade>
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
                        <td className="px-4 py-2.5 text-right">{formatArs(s.totalVentas)}</td>
                        <td className="px-4 py-2.5 text-right">{formatArs(s.totalPagado)}</td>
                        <td
                          className={`px-4 py-2.5 text-right font-semibold ${s.saldo > 0 ? "text-btm-red" : "text-btm-black/70"}`}
                        >
                          {formatArs(s.saldo)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </ScrollFade>
            </>
          )}
        </section>
      )}

      {tab === "ventas" && (
        <section className="flex flex-col gap-4 rounded-lg border border-black/10 p-4 sm:p-5">
          <HorizontalBarChart
            rows={ventasChartRows}
            primaryLabel="Monto"
            secondaryLabel="Toneladas"
            formatPrimary={formatArs}
            formatSecondary={formatTn}
          />
        </section>
      )}

      {tab === "pendientes-sucursal" && (
        <section className="flex flex-col gap-3">
          <SucursalFilterForm tab="pendientes-sucursal" sucursales={sucursales} selected={params.sucursal} hasFilter={hasSucursalFilter} />
          <PieChartGroup groups={pieGruposPorSucursalProducto} />
          <PendientesPorProducto groups={gruposPorProducto} />
        </section>
      )}

      {tab === "pendientes-cliente" && (
        <section className="flex flex-col gap-3">
          <SucursalFilterForm tab="pendientes-cliente" sucursales={sucursales} selected={params.sucursal} hasFilter={hasSucursalFilter} />
          <PieChartGroup groups={pieGruposPorSucursalCliente} />
          <PendientesPorCliente groups={gruposPorCliente} />
        </section>
      )}

      {tab === "stock" && (
        <>
          {stockChartRows.length > 0 && (
            <div className="rounded-lg border border-black/10 p-4 sm:p-5">
              <HorizontalBarChart rows={stockChartRows.map((r) => ({ label: r.label, primary: r.toneladas }))} primaryLabel="Toneladas" formatPrimary={formatTn} />
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
              <ScrollFade>
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
              </ScrollFade>
            )}
          </section>
        </>
      )}

      {tab === "movimientos" && (
        <>
          {movimientosChartRows.length > 0 && (
            <div className="rounded-lg border border-black/10 p-4 sm:p-5">
              <HorizontalBarChart
                rows={movimientosChartRows.map((r) => ({ label: r.label, primary: r.monto, secondary: r.toneladas }))}
                primaryLabel="Monto"
                secondaryLabel="Toneladas"
                formatPrimary={formatArs}
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
              <MovimientosTable movimientos={movimientos} products={products} />
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

function aggregateToneladasBySucursal(rows: { sucursalName: string; toneladas: number }[]) {
  const map = new Map<string, number>();
  for (const r of rows) map.set(r.sucursalName, (map.get(r.sucursalName) ?? 0) + r.toneladas);
  return Array.from(map.entries())
    .map(([label, toneladas]) => ({ label, toneladas }))
    .sort((a, b) => b.toneladas - a.toneladas);
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

const CHART_TOP_N = 10;

function HorizontalBarChart({
  rows,
  primaryLabel,
  secondaryLabel,
  formatPrimary,
  formatSecondary,
}: {
  rows: { label: string; primary: number; secondary?: number }[];
  primaryLabel: string;
  secondaryLabel?: string;
  formatPrimary: (value: number) => string;
  formatSecondary?: (value: number) => string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-btm-black/50">Sin datos para mostrar.</p>;
  }

  const top = rows.slice(0, CHART_TOP_N);
  const max = Math.max(...top.map((r) => r.primary), 1);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="w-28 shrink-0 sm:w-40" />
        <span className="flex-1" />
        <span className="w-24 shrink-0 text-right text-[11px] font-semibold uppercase tracking-wide text-btm-black/50">
          {primaryLabel}
        </span>
        {secondaryLabel && (
          <span className="w-20 shrink-0 text-right text-[11px] font-semibold uppercase tracking-wide text-btm-black/50">
            {secondaryLabel}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {top.map((row) => {
          const pct = Math.max((row.primary / max) * 100, row.primary > 0 ? 2 : 0);
          return (
            <div key={row.label} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-xs text-btm-black/70 sm:w-40" title={row.label}>
                {row.label}
              </span>
              <div className="h-4 flex-1 overflow-hidden rounded-full bg-black/[.04]">
                <div
                  className="h-full rounded-full bg-btm-navy"
                  style={{ width: `${pct}%` }}
                  role="img"
                  aria-label={`${row.label}: ${formatPrimary(row.primary)}${
                    secondaryLabel && formatSecondary ? `, ${formatSecondary(row.secondary ?? 0)}` : ""
                  }`}
                />
              </div>
              <span className="btm-fig w-24 shrink-0 text-right text-xs font-semibold text-btm-navy">
                {formatPrimary(row.primary)}
              </span>
              {secondaryLabel && formatSecondary && (
                <span className="btm-fig w-20 shrink-0 text-right text-xs font-semibold text-btm-navy">
                  {formatSecondary(row.secondary ?? 0)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const PIE_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#4a3aa7"];
const PIE_SLICE_CAP = 5;

function MiniPieChart({ title, slices }: { title: string; slices: { label: string; value: number }[] }) {
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
            <span className="btm-fig shrink-0 font-semibold text-btm-navy">{formatArs(d.value)}</span>
            <span className="w-9 shrink-0 text-right text-btm-black/40">{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PieChartGroup({ groups }: { groups: { sucursalName: string; slices: { label: string; value: number }[] }[] }) {
  if (groups.length === 0) return null;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((g) => (
        <MiniPieChart key={g.sucursalName} title={g.sucursalName} slices={g.slices} />
      ))}
    </div>
  );
}
