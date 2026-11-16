import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfileRole, hasFullAccess } from "@/lib/auth/role";
import { getClienteNames, getOrderYearsRange, getOrdersForClienteReport } from "@/lib/data/orders";
import { getActiveProducts } from "@/lib/data/master-data";
import { aggregateClienteProductos, aggregateClientesResumen, aggregateMensual } from "@/lib/reports/cliente-report";
import { ClienteReportFilters } from "./filters";
import { ClienteReportTable } from "./cliente-report-table";
import { ClienteVolumeChart } from "./cliente-volume-chart";

export default async function ClienteReportPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string; anio?: string; productos?: string }>;
}) {
  if (!hasFullAccess(await getProfileRole())) {
    redirect("/inicio");
  }

  const params = await searchParams;
  const productos = params.productos ? params.productos.split(",").filter(Boolean) : [];

  const years = await getOrderYearsRange();
  const currentYear = new Date().getFullYear();
  const anio = params.anio ? Number(params.anio) : years.includes(currentYear) ? currentYear : (years.at(-1) ?? currentYear);

  const [clientes, products, orders] = await Promise.all([
    getClienteNames(),
    getActiveProducts(),
    getOrdersForClienteReport({ cliente: params.cliente, productos, anio: String(anio) }),
  ]);

  const mode = params.cliente ? "productos" : "clientes";
  const rows = mode === "productos" ? aggregateClienteProductos(orders) : aggregateClientesResumen(orders);
  const mensual = aggregateMensual(orders, anio);

  // Preserva año/productos al armar los links de drill-down y de export —
  // nunca el cliente (eso lo pone cada link específico).
  const linkQuery = new URLSearchParams();
  linkQuery.set("anio", String(anio));
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
        selectedProductos={productos}
      />

      <div className="rounded-lg border border-black/10 p-4 sm:p-5">
        <ClienteVolumeChart
          data={mensual}
          titulo={`Toneladas por mes · ${params.cliente ?? "Todos los clientes"} · ${anio}`}
        />
      </div>

      <ClienteReportTable rows={rows} mode={mode} linkQuery={linkQuery.toString()} />
    </div>
  );
}
