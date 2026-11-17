"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Menu suspenso num `<details>` (abre sem JavaScript e com teclado) que recolhe sozinho: ao escolher um
 * link ou botão de dentro, ao tocar fora, com Esc e quando a página troca. Sem isso o menu da barra ficava
 * aberto por cima da página nova, porque a barra não remonta na navegação.
 */
export function DropdownDetails({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (ref.current) ref.current.open = false;
  }, [pathname]);

  useEffect(() => {
    const details = ref.current;
    if (!details) return;
    const close = () => {
      details.open = false;
    };
    const onPointerDown = (e: PointerEvent) => {
      if (details.open && !details.contains(e.target as Node)) close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !details.open) return;
      close();
      details.querySelector("summary")?.focus();
    };
    // Escolher um item: link ou botão do menu (o próprio <summary> fica de fora, ele abre e fecha).
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element;
      if (target.closest("summary")) return;
      if (target.closest("a[href], button[type='submit']")) close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    details.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      details.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <details ref={ref} className={className}>
      {children}
    </details>
  );
}
