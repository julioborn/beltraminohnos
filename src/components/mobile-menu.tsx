"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { logout } from "@/lib/actions/auth";

type NavLink = { href: string; label: string };

export function MobileMenu({ navLinks, fullName }: { navLinks: NavLink[]; fullName: string }) {
  const [open, setOpen] = useState(false);
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  function close() {
    setOpen(false);
    setConfirmingLogout(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        className="flex h-9 w-9 items-center justify-center text-white"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
          <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={close} />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-black/10 px-4 py-4">
              <Image
                src="/brand/btm-horizontal-tagline.png"
                alt="BTM Nutrición Animal"
                width={150}
                height={38}
                className="h-auto w-36"
              />
              <button
                type="button"
                onClick={close}
                aria-label="Cerrar menú"
                className="flex h-8 w-8 items-center justify-center text-btm-black/60"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 p-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={close}
                  className="rounded-md px-3 py-3 font-display text-sm font-bold uppercase tracking-wide text-btm-navy hover:bg-black/[.03]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="border-t border-black/10 p-4">
              <p className="mb-3 truncate text-xs text-btm-black/50">{fullName}</p>

              {!confirmingLogout ? (
                <button
                  type="button"
                  onClick={() => setConfirmingLogout(true)}
                  className="w-full rounded-full border border-btm-red px-4 py-2 text-xs font-semibold uppercase tracking-wide text-btm-red hover:bg-btm-red hover:text-white"
                >
                  Cerrar sesión
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-xs text-btm-black/70">¿Seguro que querés cerrar sesión?</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmingLogout(false)}
                      className="flex-1 rounded-full border border-black/15 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-btm-black/70 hover:bg-black/5"
                    >
                      Cancelar
                    </button>
                    <form action={logout} className="flex-1">
                      <button
                        type="submit"
                        className="w-full rounded-full bg-btm-red px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-btm-navy"
                      >
                        Sí, salir
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
