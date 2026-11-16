import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfileRole, hasFullAccess } from "@/lib/auth/role";
import { getClienteNames, getOrderYearsRange, getOrdersForClienteReport } from "@/lib/data/orders";
import { getActiveProducts } from "@/lib/data/master-data";
import { getCurrencyContext } from "@/lib/currency-server";
import { formatArs, formatUsd } from "@/lib/format";
import {
  acumularMensual,
  aggregateClienteProductos,
  aggregateClientesResumen,
  aggregateMensual,
} from "@/lib/reports/cliente-report";
import { ClienteReportFilters } from "./filters";
import { ClienteReportTable } from "./cliente-report-table";
import { ClienteVolumeChart } from "./cliente-volume-chart";

const MES_LABELS = Array.from({ length: 12 }, (_, i) =>
  new Date(2000, i, 1).toLocaleDateString("es-AR", { month: "long" }),
);

export default async function ClienteReportPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string; anio?: string; mes?: string; productos?: string }>;
}) {
  if (!hasFullAccess(await getProfileRole())) {
    redirect("/inicio");
  }

  const params = await searchParams;
  const productos = params.productos ? params.productos.split(",").filter(Boolean) : [];
  const mes = params.mes ? Number(params.mes) : undefined;

  const years = await getOrderYearsRange();
  const currentYear = new Date().getFullYear();
  const anio = params.anio ? Number(params.anio) : years.includes(currentYear) ? currentYear : (years.at(-1) ?? currentYear);

  const [clientes, products, orders, { currency, tipoCambio }] = await Promise.all([
    getClienteNames(),
    getActiveProducts(),
    getOrdersForClienteReport({ cliente: params.cliente, productos, anio: String(anio) }),
    getCurrencyContext(),
  ]);

  // A diferencia de Consignaciones, acá el monto ya está en USD (como el
  // resto de Reportes/Estadísticas) — así que la conversión es al revés:
  // a ARS se multiplica por el tipo de cambio en vez de dividir.
  const fmtMonto = (valueUsd: number) =>
    currency === "ARS" && tipoCambio ? formatArs(valueUsd * tipoCambio) : formatUsd(valueUsd);

  // Los gráficos siempre muestran el año completo (los 12 meses); el
  // filtro de "mes" solo acota la tabla/export a ese mes puntual — filtrar
  // acá en JS, no en la consulta, evita pedirle los datos dos veces.
  const ordersDelMes = mes ? orders.filter((o) => Number(o.fecha.slice(5, 7)) === mes) : orders;

  const mode = params.cliente ? "productos" : "clientes";
  const rows = mode === "productos" ? aggregateClienteProductos(ordersDelMes) : aggregateClientesResumen(ordersDelMes);
  const mensual = aggregateMensual(orders, anio);
  const acumulado = acumularMensual(mensual);

  const contexto = `${params.cliente ?? "Todos los clientes"} · ${anio}${mes ? ` · ${MES_LABELS[mes - 1]}` : ""}`;

  // Preserva año/mes/productos al armar los links de drill-down y de
  // export — nunca el cliente (eso lo pone cada link específico).
  const linkQuery = new URLSearchParams();
  linkQuery.set("anio", String(anio));
  if (mes) linkQuery.set("mes", String(mes));
  if (productos.length) linkQuery.set("productos", productos.join(","));

  const exportParams = new URLSearchParams(linkQuery);
  if (params.cliente) exportParams.set("cliente", params.cliente);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/reportes"
            className="mb-1 flex w-fit items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-btm-black/50 hover:text-btm-navy"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
              <path d="M12.7 3.3a1 1 0 010 1.4L8.4 9h9.6a1 1 0 110 2H8.4l4.3 4.3a1 1 0 11-1.4 1.4l-6-6a1 1 0 010-1.4l6-6a1 1 0 011.4 0z" />
            </svg>
            Reportes
          </Link>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy">
            Informe por cliente
          </h1>
          {params.cliente ? (
            <p className="text-sm text-btm-black/60">
              {params.cliente} ·{" "}
              <Link href={`/reportes/clientes?${linkQuery.toString()}`} className="font-semibold text-btm-navy hover:text-btm-red">
                Ver todos los clientes
              </Link>
            </p>
          ) : (
            <p className="text-sm text-btm-black/60">Entregado, pendiente de fabricar/entregar y total por cliente</p>
          )}
        </div>
        <a
          href={`/reportes/clientes/export/excel?${exportParams.toString()}`}
          className="rounded-full border border-btm-navy px-4 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-btm-navy hover:bg-btm-navy hover:text-white"
        >
          Exportar Excel
        </a>
      </div>

      <ClienteReportFilters
        clientes={clientes}
        years={years}
        products={products}
        selectedCliente={params.cliente}
        selectedAnio={anio}
        selectedMes={mes}
        selectedProductos={productos}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-black/10 p-4 sm:p-5">
          <ClienteVolumeChart data={mensual} titulo="Cant. (en tn) por mes y año" subtitulo={contexto} />
        </div>
        <div className="rounded-lg border border-black/10 p-4 sm:p-5">
          <ClienteVolumeChart data={acumulado} titulo="Acumulado del año (en tn)" subtitulo={contexto} />
        </div>
      </div>

      <ClienteReportTable rows={rows} mode={mode} linkQuery={linkQuery.toString()} fmtMonto={fmtMonto} />
    </div>
  );
}
