import { getMasterData, getPriceMap, getClientes } from "@/lib/data/master-data";
import { createClient } from "@/lib/supabase/server";
import { QuoteForm } from "./quote-form";

export default async function CotizacionesPage() {
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
      <h1 className="mb-2 font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy">
        Cotizaciones
      </h1>
      <p className="mb-6 text-sm text-btm-black/60">
        Armá una cotización para un cliente y descargá el PDF. No queda guardada en el sistema.
      </p>
      <QuoteForm
        products={masterData.products}
        zones={masterData.zones}
        vendedores={masterData.vendedores}
        priceMap={priceMap}
        clientes={clientes}
        defaultVendedorId={defaultVendedorId}
      />
    </div>
  );
}
