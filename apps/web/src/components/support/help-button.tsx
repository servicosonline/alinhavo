"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActionState, useEffect, useId, useState } from "react";
import { openSupport } from "@/app/painel/suporte/actions";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { ui } from "@/components/ui";
import { isUuid } from "@/lib/ids";
import { FULL_SCREEN } from "@/lib/mobile-nav";
import { searchFaq } from "@/lib/support-faq";

/**
 * Botão "Ajuda" do painel: primeiro as perguntas frequentes (a busca acha sem acento); não resolveu, a pessoa
 * escreve para o suporte e cai na conversa. A organização vem do endereço (`/painel/<org>/…`).
 * Some nas telas de tela cheia (`FULL_SCREEN`: editor, Prova, encaixe, scan), onde cobriria as ferramentas.
 */
export function HelpButton() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"faq" | "form">("faq");
  const [query, setQuery] = useState("");
  const [state, action, pending] = useActionState(openSupport, undefined);
  const panelId = useId();
  const segment = path.split("/")[2];
  const orgId = isUuid(segment) ? segment : "";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (FULL_SCREEN.test(path)) return null;
  const results = searchFaq(query);

  return (
    <div className="fixed right-4 bottom-4 z-40 sm:right-6 sm:bottom-6" data-ajuda>
      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Ajuda"
          className="mb-3 flex max-h-[min(36rem,calc(100dvh-7rem))] w-[min(92vw,24rem)] flex-col overflow-hidden rounded-2xl border border-tinta/10 bg-white shadow-[0_24px_50px_-24px_rgb(29_27_24/0.5)]"
        >
          <div className="flex items-center justify-between border-b border-tinta/10 px-4 py-3">
            <p className="font-display text-lg font-semibold">{mode === "faq" ? "Como podemos ajudar?" : "Falar com o suporte"}</p>
            <button type="button" onClick={() => setOpen(false)} className="text-sm text-tinta-suave hover:text-tinta" aria-label="Fechar a ajuda">
              ✕
            </button>
          </div>

          {mode === "faq" ? (
            <>
              <div className="px-4 pt-3">
                <label className="sr-only" htmlFor={`${panelId}-q`}>
                  Procurar nas perguntas
                </label>
                <input
                  id={`${panelId}-q`}
                  type="search"
                  autoFocus
                  placeholder="Procurar: prova, plotter, senha…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className={ui.input}
                />
              </div>
              <ul className="min-h-0 flex-1 divide-y divide-tinta/10 overflow-y-auto px-4 py-2">
                {results.map((f) => (
                  <li key={f.q}>
                    <details className="group py-2.5">
                      <summary className="cursor-pointer list-none text-sm font-medium [&::-webkit-details-marker]:hidden">
                        <span className="mr-1.5 inline-block text-tinta-suave transition group-open:rotate-90">›</span>
                        {f.q}
                      </summary>
                      <p className="mt-1.5 pl-4 text-sm text-tinta-suave">{f.a}</p>
                    </details>
                  </li>
                ))}
                {results.length === 0 && <li className="py-4 text-sm text-tinta-suave">Nenhuma pergunta com isso. Escreva para o suporte.</li>}
              </ul>
              <div className="space-y-2 border-t border-tinta/10 bg-papel/50 px-4 py-3">
                <button type="button" className={`${ui.buttonPrimary} w-full`} onClick={() => setMode("form")}>
                  Não achei: falar com o suporte
                </button>
                <Link href="/painel/suporte" className="block text-center text-xs text-tinta-suave underline underline-offset-4 hover:text-tinta" onClick={() => setOpen(false)}>
                  Minhas conversas
                </Link>
              </div>
            </>
          ) : (
            <ActionForm action={action} state={state} pending={pending} className="space-y-3 overflow-y-auto px-4 py-3">
              <input type="hidden" name="orgId" value={orgId} />
              <label className={ui.label}>
                Assunto
                <input name="subject" required maxLength={120} defaultValue={query} className={ui.input} placeholder="Ex.: o encaixe não salva" />
              </label>
              <label className={ui.label}>
                O que aconteceu?
                <textarea name="body" required maxLength={4000} rows={5} className={ui.input} placeholder="Conte o que fez e o que apareceu na tela." />
              </label>
              <p className={ui.muted}>A resposta chega no sino e em Minhas conversas.</p>
              {state?.error && (
                <p className={ui.error} role="alert">
                  {state.error}
                </p>
              )}
              <div className="flex items-center justify-between gap-3">
                <button type="button" className="text-sm text-tinta-suave underline underline-offset-4" onClick={() => setMode("faq")}>
                  Voltar às perguntas
                </button>
                <SubmitButton pendingText="Enviando…">Enviar</SubmitButton>
              </div>
            </ActionForm>
          )}
        </div>
      )}
      <div className="flex justify-end">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-2 rounded-full bg-tinta px-4 py-2.5 text-sm font-medium text-papel shadow-[0_12px_30px_-14px_rgb(29_27_24/0.7)] transition hover:bg-black"
        >
          <span aria-hidden="true" className="grid size-5 place-items-center rounded-full border border-papel/60 font-mono text-[11px]">
            ?
          </span>
          Ajuda
        </button>
      </div>
    </div>
  );
}
