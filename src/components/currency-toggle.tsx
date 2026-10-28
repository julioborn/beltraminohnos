"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CURRENCY_COOKIE, type Currency } from "@/lib/currency";

export function CurrencyToggle({ currency, rate }: { currency: Currency; rate: number | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next: Currency = currency === "ARS" ? "USD" : "ARS";
    document.cookie = `${CURRENCY_COOKIE}=${next}; path=/; max-age=31536000`;
    startTransition(() => router.refresh());
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      title="Cambiar entre pesos y dólares"
      className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full border border-btm-fabricado/40 bg-btm-fabricado/10 px-2.5 py-1.5 text-xs font-bold text-btm-fabricado transition-colors hover:bg-btm-fabricado/20 disabled:opacity-60 sm:gap-2 sm:px-3"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5 shrink-0">
        <path d="M7 7h11l-3-3M17 17H6l3 3" />
      </svg>
      <span className="btm-fig whitespace-nowrap">
        {currency}
        {rate ? ` · $${rate.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ""}
      </span>
    </button>
  );
}
