"use client";

import { useActionState, useState } from "react";
import { login } from "@/lib/actions/auth";

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      {off ? (
        <>
          <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-10-8-10-8a18.6 18.6 0 0 1 4.22-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 10 8 10 8a18.6 18.6 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24" />
          <path d="M1 1l22 22" />
        </>
      ) : (
        <>
          <path d="M1 12s3-8 11-8 11 8 11 8-3 8-11 8-11-8-11-8Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

export function LoginForm({ next, compact = false }: { next: string; compact?: boolean }) {
  const [state, action, pending] = useActionState(login, undefined);
  const [showPassword, setShowPassword] = useState(false);

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
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className={`${fieldClass} w-full pr-9`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute inset-y-0 right-0 flex cursor-pointer items-center px-2.5 text-btm-black/50 hover:text-btm-navy"
          >
            <EyeIcon off={showPassword} />
          </button>
        </div>
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
