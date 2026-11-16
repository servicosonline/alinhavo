"use client";

import { useEffect } from "react";

/**
 * Abre o `<details id>` quando o endereço chega com `#id` (ex.: "Nova coleção" pela folha Criar do celular)
 * e põe o cursor no primeiro campo.
 */
export function OpenOnHash({ id }: { id: string }) {
  useEffect(() => {
    const open = () => {
      if (location.hash !== `#${id}`) return;
      const el = document.getElementById(id);
      if (!(el instanceof HTMLDetailsElement)) return;
      el.open = true;
      el.querySelector<HTMLElement>("input, select, textarea")?.focus();
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, [id]);
  return null;
}
