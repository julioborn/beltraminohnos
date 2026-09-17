import { getMasterData, getPriceMap, getClientes } from "@/lib/data/master-data";
import { createClient } from "@/lib/supabase/server";
import { OrderForm } from "./order-form";

export default async function NuevaNotaPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const { created } = await searchParams;
  const [masterData, priceMap, clientes] = await Promise.all([
    getMasterData(),
    getPriceMap(),
    getClientes(),
  ]);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const defaultVendedorId = masterData.vendedores.find((v) => v.profile_id === user?.id)?.id ?? "";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy">
        Nueva nota de pedido
      </h1>
      {created === "1" && (
        <p className="mb-6 rounded-lg border border-btm-entregado bg-btm-entregado-bg px-4 py-3 text-sm font-semibold text-green-950">
          Nota creada correctamente.
        </p>
      )}
      <OrderForm
        products={masterData.products}
        zones={masterData.zones}
        vendedores={masterData.vendedores}
        choferes={masterData.choferes}
        camiones={masterData.camiones}
        priceMap={priceMap}
        clientes={clientes}
        defaultVendedorId={defaultVendedorId}
      />
    </div>
  );
}
