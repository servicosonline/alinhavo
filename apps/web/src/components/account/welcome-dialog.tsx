"use client";

import { useEffect, useRef } from "react";
import { markWelcomeSeen } from "@/app/painel/conta/actions";
import { BrandSymbol } from "../brand-mark";
import { ui } from "../ui";

/**
 * Boas-vindas do primeiro acesso: aparece uma vez (o perfil guarda `welcome_seen_at`) e aponta para os
 * primeiros passos. Usa o <dialog> nativo: foco preso, Esc fecha, volta o foco ao sair.
 */
export function WelcomeDialog({ name }: { name: string }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="boas-vindas-titulo"
      onClose={() => void markWelcomeSeen()}
      className="m-auto w-[min(92vw,30rem)] rounded-2xl border border-tinta/10 bg-papel p-0 text-tinta shadow-[0_40px_80px_-30px_rgb(29_27_24/0.6)] backdrop:bg-tinta/50"
    >
      <div className="p-7 sm:p-8">
        <BrandSymbol className="size-12" />
        <p className={`${ui.eyebrow} mt-6`}>Primeiro acesso</p>
        <h2 id="boas-vindas-titulo" className="mt-2 font-display text-3xl leading-tight font-semibold tracking-[-0.02em]">
          Boas-vindas, {name}.
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-tinta-suave">
          Sua organização tem <b className="text-tinta">15 dias com tudo liberado</b>. Em poucos minutos você vê um molde vestido no corpo:
        </p>
        <ol className="mt-5 grid gap-3 text-[15px]">
          {[
            ["Abra um molde", "comece de uma saia, calça ou conjunto de exemplo."],
            ["Prove em 3D", "veja onde aperta e onde sobra no corpo da sua tabela."],
            ["Mande para a cliente", "ela aprova pelo link, sem criar conta."],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-3">
              <span className="mt-0.5 font-mono text-sm text-linha">0{i + 1}</span>
              <span>
                <b className="font-medium">{t}:</b> <span className="text-tinta-suave">{d}</span>
              </span>
            </li>
          ))}
        </ol>
        <span className="alinhavo mt-6 w-28" aria-hidden="true" />
        <form method="dialog" className="mt-6 flex justify-end">
          <button type="submit" className={ui.buttonPrimary} autoFocus>
            Começar
          </button>
        </form>
      </div>
    </dialog>
  );
}
