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
          )}
        </section>
      )}

      {tab === "ventas" && (
        <section className="flex flex-col gap-4 rounded-lg border border-black/10 p-4 sm:p-5">
          <VentasPorProductoChart data={ventasPorProducto} />
        </section>
      )}

      {tab === "pendientes-sucursal" && (
        <section className="flex flex-col gap-3">
          <SucursalFilterForm tab="pendientes-sucursal" sucursales={sucursales} selected={params.sucursal} hasFilter={hasSucursalFilter} />
          <PendientesPorProducto groups={gruposPorProducto} />
        </section>
      )}

      {tab === "pendientes-cliente" && (
        <section className="flex flex-col gap-3">
          <SucursalFilterForm tab="pendientes-cliente" sucursales={sucursales} selected={params.sucursal} hasFilter={hasSucursalFilter} />
          <PendientesPorCliente groups={gruposPorCliente} />
        </section>
      )}

      {tab === "stock" && (
        <>
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
      montoArs: 0,
      ids: [] as string[],
    };
    group.bolsas += m.cantidad_bolsas;
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
      montoArs: 0,
      comisionArs: 0,
      ids: [] as string[],
    };
    group.bolsas += m.cantidad_bolsas;
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

function VentasPorProductoChart({ data }: { data: { productName: string; montoArs: number }[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-btm-black/50">Sin ventas en el período.</p>;
  }

  const top = data.slice(0, 10);
  const max = Math.max(...top.map((d) => d.montoArs), 1);

  return (
    <div className="flex items-end gap-3 overflow-x-auto pb-1">
      {top.map((d) => (
        <div key={d.productName} className="flex min-w-[64px] flex-1 flex-col items-center gap-1.5">
          <div className="flex h-32 w-full items-end">
            <div
              className="w-full rounded-t-md bg-btm-navy"
              style={{ height: `${Math.max((d.montoArs / max) * 100, d.montoArs > 0 ? 4 : 0)}%` }}
              title={formatArs(d.montoArs)}
            />
          </div>
          <span className="text-center text-[10px] leading-tight font-semibold uppercase tracking-wide text-btm-black/50">
            {d.productName}
          </span>
        </div>
      ))}
    </div>
  );
}
