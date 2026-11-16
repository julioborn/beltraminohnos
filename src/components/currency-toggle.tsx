"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CURRENCY_COOKIE, type Currency } from "@/lib/currency";

function setCurrencyCookie(next: Currency) {
  document.cookie = `${CURRENCY_COOKIE}=${next}; path=/; max-age=31536000`;
}

// Switch de dos lados (no un botón que alterna "a ciegas"): cada lado dice
// su moneda y se puede tocar directamente, el lado activo queda resaltado.
export function CurrencyToggle({ currency, rate }: { currency: Currency; rate: number | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function select(next: Currency) {
    if (next === currency || pending) return;
    setCurrencyCookie(next);
    startTransition(() => router.refresh());
  }

  return (
    <div className="ml-auto flex shrink-0 items-center gap-2">
      {rate !== null && (
        <span className="btm-fig hidden whitespace-nowrap text-[11px] font-semibold text-white/60 sm:inline">
          ${rate.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )}
      <div
        role="group"
        aria-label="Moneda"
        className="flex items-center rounded-full border border-white/25 bg-white/10 p-0.5 text-[11px] font-bold disabled:opacity-60"
      >
        {(["ARS", "USD"] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            aria-pressed={currency === opt}
            onClick={() => select(opt)}
            disabled={pending}
            className={`rounded-full px-2.5 py-1 transition-colors disabled:cursor-wait ${
              currency === opt ? "bg-white text-btm-navy" : "text-white/60 hover:text-white"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
