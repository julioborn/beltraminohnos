import { cookies } from "next/headers";
import { getDolarOficial } from "@/lib/dolar";
import { CURRENCY_COOKIE, type Currency } from "@/lib/currency";

export async function getCurrencyPreference(): Promise<Currency> {
  const store = await cookies();
  return store.get(CURRENCY_COOKIE)?.value === "USD" ? "USD" : "ARS";
}

// El switch de moneda arranca en Consignaciones — currency es la
// preferencia guardada en cookie, tipoCambio es el dólar oficial (mismo
// que ya se mostraba en el header) usado para convertir cualquier monto en
// ARS a USD "al vuelo". Si no hay cotización disponible, se queda en ARS
// aunque el usuario haya elegido USD (mejor mostrar el número real que uno
// inventado).
export async function getCurrencyContext(): Promise<{ currency: Currency; tipoCambio: number | null }> {
  const [currency, dolar] = await Promise.all([getCurrencyPreference(), getDolarOficial()]);
  return { currency, tipoCambio: dolar.venta };
}
