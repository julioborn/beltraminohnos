"use client";

import { useEffect } from "react";

// 100dvh y compañía pueden quedar cortos por unos píxeles en Safari/iOS según
// el estado de la barra de navegación o el teclado. window.innerHeight es el
// valor real que el navegador ya calculó — lo publicamos como variable CSS y
// lo mantenemos actualizado, así el contenedor que lo usa siempre estira al
// alto real de la pantalla, sin adivinar con unidades de viewport.
export function ViewportHeightFix() {
  useEffect(() => {
    function set() {
      document.documentElement.style.setProperty("--app-vh", `${window.innerHeight}px`);
    }
    set();
    window.addEventListener("resize", set);
    window.addEventListener("orientationchange", set);
    return () => {
      window.removeEventListener("resize", set);
      window.removeEventListener("orientationchange", set);
    };
  }, []);

  return null;
}
