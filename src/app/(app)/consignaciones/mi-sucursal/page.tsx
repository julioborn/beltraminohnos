import Link from "next/link";
import { redirect } from "next/navigation";
import { hasFullAccess, getProfileRole, getAuthUser } from "@/lib/auth/role";
import {
  getSucursalByProfileId,
  getSucursalMovimientos,
  getSucursalMovimientosCount,
  getSucursalSaldos,
  getStockFisicoSucursal,
  MOVIMIENTOS_PAGE_SIZE,
} from "@/lib/data/consignaciones";
import { getActiveProducts } from "@/lib/data/master-data";
import { MiSucursalForm } from "./mi-sucursal-form";
import { formatArs, formatFecha } from "@/lib/format";

const TIPO_LABELS: Record<string, string> = {
  INGRESO_STOCK: "Ingreso stock",
  VENTA: "Venta sucursal",
  DIRECTA_CLIENTE: "Directa cliente",
};

export default async function MiSucursalPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const user = await getAuthUser();

  if (!user) redirect("/inicio");

  const role = await getProfileRole();
  const sucursal = await getSucursalByProfileId(user.id);

  if (!sucursal && !hasFullAccess(role)) {
    redirect("/inicio");
  }

  if (!sucursal) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <p className="rounded-lg border border-black/10 p-4 text-sm text-btm-black/50">
          Tu cuenta no está vinculada a ninguna sucursal.
        </p>
      </div>
    );
  }

  const [products, movimientos, movimientosCount, saldos, stockFisico] = await Promise.all([
    getActiveProducts(),
    getSucursalMovimientos({ sucursal: sucursal.id }, { page, pageSize: MOVIMIENTOS_PAGE_SIZE }),
    getSucursalMovimientosCount({ sucursal: sucursal.id }),
    getSucursalSaldos(),
    getStockFisicoSucursal(sucursal.id),
  ]);

  const totalPages = Math.max(1, Math.ceil(movimientosCount / MOVIMIENTOS_PAGE_SIZE));
  const miSaldo = saldos.find((s) => s.sucursalId === sucursal.id);

  function pageHref(targetPage: number) {
    return `/consignaciones/mi-sucursal${targetPage > 1 ? `?page=${targetPage}` : ""}`;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <div>
        <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy">
          {sucursal.name}
        </h1>
        <p className="text-sm text-btm-black/60">Zona comercial: {sucursal.zona?.name ?? "—"}</p>
      </div>

      {miSaldo && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <MiniKpi label="Total vendido" value={formatArs(miSaldo.totalVentas)} />
          <MiniKpi label="Pagado" value={formatArs(miSaldo.totalPagado)} />
          <MiniKpi label="Saldo" value={formatArs(miSaldo.saldo)} />
        </div>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">
          Stock físico
        </h2>
        {stockFisico.length === 0 ? (
          <p className="rounded-lg border border-black/10 p-4 text-sm text-btm-black/50">
            Todavía no hay stock cargado.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-black/10 rounded-lg border border-black/10 bg-white">
            {stockFisico.map((s) => (
              <div key={s.productId} className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm">
                <span className="font-semibold text-btm-navy">{s.productName}</span>
                <span className="text-btm-black/70">{s.bolsas} bolsas</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <MiSucursalForm products={products} />

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-btm-navy">
          Mis movimientos
        </h2>
        {movimientos.length === 0 ? (
          <p className="rounded-lg border border-black/10 p-4 text-sm text-btm-black/50">
            Todavía no cargaste ningún movimiento.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-black/10 rounded-lg border border-black/10 bg-white">
            {movimientos.map((m) => (
              <div key={m.id} className="flex flex-col gap-1 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-btm-navy">{m.product?.name}</span>
                  <span className="text-xs text-btm-black/50">{formatFecha(m.fecha)}</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-btm-black/70">
                  <span>
                    {TIPO_LABELS[m.tipo_movimiento] ?? m.tipo_movimiento} · {m.cantidad_bolsas} bolsas
                    {m.cliente_nombre ? ` · ${m.cliente_nombre}` : ""}
                  </span>
                  {m.monto_ars != null && <span className="font-semibold">{formatArs(m.monto_ars)}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {movimientosCount > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-btm-black/50">
              Página {page} de {totalPages} · {movimientosCount} movimiento{movimientosCount === 1 ? "" : "s"}
            </p>
            <div className="flex items-center gap-2">
              {page > 1 ? (
                <Link
                  href={pageHref(page - 1)}
                  className="rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-btm-black/70 hover:bg-black/5"
                >
                  Anterior
                </Link>
              ) : (
                <span className="cursor-not-allowed rounded-md border border-black/10 px-4 py-2 text-sm font-semibold text-btm-black/30">
                  Anterior
                </span>
              )}
              {page < totalPages ? (
                <Link
                  href={pageHref(page + 1)}
                  className="rounded-md border border-black/15 px-4 py-2 text-sm font-semibold text-btm-black/70 hover:bg-black/5"
                >
                  Siguiente
                </Link>
              ) : (
                <span className="cursor-not-allowed rounded-md border border-black/10 px-4 py-2 text-sm font-semibold text-btm-black/30">
                  Siguiente
                </span>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function MiniKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-black/10 bg-white p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-btm-black/50">{label}</p>
      <p className="font-display text-base font-extrabold text-btm-navy">{value}</p>
    </div>
  );
}
