"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Un <tr> no es un elemento nativamente interactivo, así que ":active" de
// CSS no siempre dispara al tocar (quirk conocido de iOS Safari con
// elementos sin handler nativo). Se maneja el estado de "presionado" a mano
// con eventos de puntero, que sí son confiables en touch — para que la fila
// responda al instante en vez de esperar a que la navegación termine.
export function ClickableRow({
  href,
  className = "",
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pressed, setPressed] = useState(false);

  return (
    <tr
      onClick={() => router.push(href)}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      className={`cursor-pointer transition-colors duration-75 ${pressed ? "bg-black/[.05]" : "hover:bg-black/[.02]"} ${className}`}
    >
      {children}
    </tr>
  );
}
