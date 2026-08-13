import { getMasterData, getPriceMap, getClientes } from "@/lib/data/master-data";
import { OrderForm } from "./order-form";

export default async function NuevaNotaPage() {
  const [masterData, priceMap, clientes] = await Promise.all([
    getMasterData(),
    getPriceMap(),
    getClientes(),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy">
        Nueva nota de pedido
      </h1>
      <OrderForm
        products={masterData.products}
        zones={masterData.zones}
        vendedores={masterData.vendedores}
        choferes={masterData.choferes}
        camiones={masterData.camiones}
        priceMap={priceMap}
        clientes={clientes}
      />
    </div>
  );
}
