import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getOrdersPendingSummary } from "@/lib/data/orders";
import { PendingByDayReport } from "./pending-by-day-report";

export default async function ProductosPendientesPage() {
  const supabase = await createClient();
  const [{ data: products }, orders] = await Promise.all([
    supabase.from("products").select("id, name").eq("active", true).order("name"),
    getOrdersPendingSummary(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-4">
        <Link
          href="/productos"
          className="flex w-fit items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-btm-black/50 hover:text-btm-navy"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden>
            <path d="M12.7 3.3a1 1 0 010 1.4L8.4 9h9.6a1 1 0 110 2H8.4l4.3 4.3a1 1 0 11-1.4 1.4l-6-6a1 1 0 010-1.4l6-6a1 1 0 011.4 0z" />
          </svg>
          Productos
        </Link>
        <div>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-btm-navy">
            Pendientes por producto
          </h1>
          <p className="text-sm text-btm-black/60">
            Toneladas pendientes de fabricación y de entrega, según las notas de pedido activas.
          </p>
        </div>
      </div>

      <PendingByDayReport products={products ?? []} orders={orders} />
    </div>
  );
}
