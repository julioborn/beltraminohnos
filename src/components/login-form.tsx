"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions/auth";

export function LoginForm({ next, compact = false }: { next: string; compact?: boolean }) {
  const [state, action, pending] = useActionState(login, undefined);

  const fieldClass = compact
    ? "rounded border border-black/10 px-[clamp(0.35rem,1vw,0.6rem)] py-[clamp(0.2rem,0.7vw,0.45rem)] text-[clamp(0.55rem,1vw,0.8rem)] focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy"
    : "rounded-lg border border-black/10 px-3.5 py-2.5 text-sm focus:border-btm-navy focus:outline-none focus:ring-1 focus:ring-btm-navy";
  const labelClass = compact
    ? "text-[clamp(0.5rem,0.85vw,0.65rem)] font-semibold tracking-wide text-btm-black/70"
    : "text-xs font-semibold tracking-wide text-btm-black/70";

  return (
    <form action={action} className={compact ? "flex w-full flex-col gap-[clamp(0.35rem,1vw,0.6rem)]" : "flex w-full max-w-sm flex-col gap-4"}>
      <input type="hidden" name="next" value={next} />

      <div className="flex flex-col gap-0.5">
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className={fieldClass} />
      </div>

      <div className="flex flex-col gap-0.5">
        <label htmlFor="password" className={labelClass}>
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={fieldClass}
        />
      </div>

      {state?.error && (
        <p role="alert" className={compact ? "text-[clamp(0.5rem,0.85vw,0.7rem)] font-medium text-btm-red" : "text-sm font-medium text-btm-red"}>
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={
          compact
            ? "mt-1 w-full rounded bg-btm-navy px-3 py-[clamp(0.3rem,0.9vw,0.55rem)] font-display text-[clamp(0.55rem,1vw,0.8rem)] font-bold tracking-wide text-white transition-colors hover:bg-btm-red disabled:opacity-60"
            : "mt-2 w-full rounded-lg bg-btm-navy px-6 py-3 font-display text-sm font-bold tracking-wide text-white transition-colors hover:bg-btm-red disabled:opacity-60"
        }
      >
        {pending ? "Ingresando..." : "Ingresar"}
      </button>
    </form>
  );
}
