import type { ReactNode } from "react";
import { DropdownDetails } from "@/components/dropdown-details";

/** Classe de um item do menu (link ou botão). */
export const menuItem =
  "block w-full rounded-lg px-3 py-2 text-left text-sm text-tinta hover:bg-papel-escuro focus-visible:bg-papel-escuro focus-visible:outline-none";

/**
 * Menu "⋯" das ações secundárias (editar, arquivar, mudar estágio…). Recolhe ao escolher, ao tocar fora e
 * com Esc (DropdownDetails). `label` é o nome para leitor de tela ("Ações de Calça reta").
 */
export function MoreMenu({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <DropdownDetails className="relative">
      <summary
        aria-label={label}
        title={label}
        className="flex size-9 cursor-pointer list-none items-center justify-center rounded-full border border-tinta/15 bg-white text-tinta-suave transition hover:border-tinta/40 hover:text-tinta [&::-webkit-details-marker]:hidden"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </summary>
      <div
        className={`absolute right-0 z-30 mt-2 rounded-2xl border border-tinta/10 bg-white p-1.5 shadow-[0_24px_50px_-28px_rgb(29_27_24/0.55)] ${wide ? "w-[min(92vw,22rem)]" : "w-56"}`}
      >
        {children}
      </div>
    </DropdownDetails>
  );
}
