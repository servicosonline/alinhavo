"use client";

import { useActionState, useRef } from "react";
import { createTrackingLink, revokeTrackingLink } from "@/app/painel/[orgId]/acompanhamento-actions";
import { CopyLink } from "@/app/painel/[orgId]/copy-link";
import { ActionForm } from "./action-form";
import { SubmitButton } from "./submit-button";
import { ui } from "./ui";
import { TRACKING_DEFAULT, TRACKING_OPTIONS, TRACKING_VALIDITY, whatsappUrl, type TrackingShow } from "@/lib/tracking";

export interface ExistingLink {
  id: string;
  url: string;
  show: TrackingShow;
  expiresAt: string | null;
  lastOpenedAt: string | null;
  /** "há 2 h", calculado no servidor (a hora atual não entra na renderização do navegador). */
  openedLabel: string | null;
  openCount: number;
}

const dia = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

/**
 * "Enviar acompanhamento": abre um diálogo para escolher o que a cliente vê e a validade, cria o link
 * (copiar ou mandar pelo WhatsApp) e lista os links ativos, com quando a cliente abriu e o botão de cancelar.
 */
export function TrackingShare({
  orgId,
  kind,
  targetId,
  title,
  orgName,
  back,
  links,
}: {
  orgId: string;
  kind: "produto" | "colecao";
  targetId: string;
  title: string;
  orgName: string;
  back: string;
  links: ExistingLink[];
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState(createTrackingLink.bind(null, orgId, kind, targetId, back), undefined);

  return (
    <>
      <button type="button" className={ui.buttonSecondary} onClick={() => ref.current?.showModal()} data-acompanhamento>
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" strokeLinecap="round" />
        </svg>
        Enviar acompanhamento
        {links.length > 0 && <span className={ui.tag}>{links.length}</span>}
      </button>
      <dialog
        ref={ref}
        aria-labelledby="acompanhamento-titulo"
        className="m-auto w-[min(94vw,36rem)] rounded-2xl border border-tinta/10 bg-papel p-0 text-tinta shadow-[0_40px_80px_-30px_rgb(29_27_24/0.6)] backdrop:bg-tinta/50"
      >
        <div className="max-h-[85vh] space-y-6 overflow-y-auto p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={ui.eyebrow}>Acompanhamento da cliente</p>
              <h2 id="acompanhamento-titulo" className="mt-1 font-display text-2xl font-semibold">
                {title}
              </h2>
              <p className="mt-1 text-sm text-tinta-suave">A cliente abre sem criar conta e vê só o que você marcar.</p>
            </div>
            <form method="dialog">
              <button type="submit" className="rounded-md px-2 py-1 text-xl leading-none text-tinta-suave hover:text-tinta" aria-label="Fechar">
                ×
              </button>
            </form>
          </div>

          <ActionForm action={action} state={state} pending={pending} resetOnOk={false} className="space-y-4">
            <fieldset className="space-y-2">
              <legend className={ui.label}>O que a cliente vê</legend>
              {TRACKING_OPTIONS.map((o) => (
                <label key={o.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-tinta/10 bg-white px-3.5 py-2.5 has-[:checked]:border-tinta/40">
                  <input type="checkbox" name={o.id} defaultChecked={TRACKING_DEFAULT[o.id]} className="mt-1 accent-linha" />
                  <span>
                    <span className="block text-sm font-medium">{o.label}</span>
                    <span className="block text-xs text-tinta-suave">{o.hint}</span>
                  </span>
                </label>
              ))}
            </fieldset>
            <label className="block max-w-xs">
              <span className={ui.label}>Validade do link</span>
              <select name="dias" defaultValue="30" className={ui.input}>
                {TRACKING_VALIDITY.map((v) => (
                  <option key={v.label} value={v.days ?? "sem"}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
            <SubmitButton variant="accent" pendingText="Criando…">
              Criar link
            </SubmitButton>
            {state?.error && (
              <p className={ui.error} role="alert">
                {state.error}
              </p>
            )}
            {state?.ok && state.link && (
              <div className="space-y-2" role="status">
                <p className={ui.success}>{state.ok}</p>
                <CopyLink link={state.link} label="Link de acompanhamento" />
                <a href={whatsappUrl(state.link, title, orgName)} target="_blank" rel="noreferrer" className={`${ui.buttonGhost} w-full`}>
                  Mandar pelo WhatsApp
                </a>
              </div>
            )}
          </ActionForm>

          {links.length > 0 && (
            <section aria-labelledby="links-ativos" className="space-y-2 border-t border-tinta/10 pt-5">
              <h3 id="links-ativos" className={ui.eyebrow}>
                Links ativos
              </h3>
              <ul className="space-y-2">
                {links.map((l) => (
                  <li key={l.id} className="space-y-2 rounded-xl border border-tinta/10 bg-white p-3.5 text-sm">
                    <p className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-tinta-suave">
                        {TRACKING_OPTIONS.filter((o) => l.show[o.id])
                          .map((o) => o.label)
                          .join(" · ")}
                      </span>
                      <span className="font-mono text-[11px] text-tinta-suave">{l.expiresAt ? `vence ${dia.format(new Date(l.expiresAt))}` : "sem prazo"}</span>
                    </p>
                    <p className="text-xs">
                      {l.lastOpenedAt ? (
                        <>
                          A cliente abriu {l.openedLabel} ({l.openCount} {l.openCount === 1 ? "vez" : "vezes"})
                        </>
                      ) : (
                        <span className="text-tinta-suave">Ainda não foi aberto</span>
                      )}
                    </p>
                    <CopyLink link={l.url} label="Link de acompanhamento" />
                    <form action={revokeTrackingLink}>
                      <input type="hidden" name="linkId" value={l.id} />
                      <input type="hidden" name="back" value={back} />
                      <button type="submit" className="text-xs text-linha underline underline-offset-4">
                        Cancelar este link
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </dialog>
    </>
  );
}
