"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { ui } from "./ui";

const KEY = "alinhavo:convite-teste-fechado";
const noSubscribe = () => () => {};

/**
 * Cartão discreto do /experimentar que convida para o teste de 15 dias. Fechado, some até o fim da aba
 * (sessionStorage). No servidor não aparece, para não piscar para quem já fechou.
 */
export function TrialNudge({ text }: { text: string }) {
  const closedBefore = useSyncExternalStore(
    noSubscribe,
    () => sessionStorage.getItem(KEY) === "1",
    () => true,
  );
  const [closed, setClosed] = useState(false);
  if (closedBefore || closed) return null;

  function close() {
    sessionStorage.setItem(KEY, "1");
    setClosed(true);
  }

  return (
    <aside
      aria-label="Teste grátis"
      className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-linha/30 bg-white px-4 py-3 sm:gap-y-3 sm:px-5 sm:py-4"
    >
      {/* basis de 16rem: abaixo disso os botões descem para a linha de baixo em vez de espremer o texto. */}
      <p className="min-w-0 grow basis-[16rem] text-sm sm:text-[15px]">
        <b className="font-display text-lg font-semibold">Gostou?</b> {text}
      </p>
      <div className="flex items-center gap-2">
        <Link href="/entrar?modo=criar" className={ui.buttonAccentSm}>
          Testar 15 dias grátis
        </Link>
        <button type="button" onClick={close} className={ui.buttonGhost} aria-label="Fechar o convite">
          Agora não
        </button>
      </div>
    </aside>
  );
}
