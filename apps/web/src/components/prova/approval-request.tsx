"use client";

import { useState } from "react";
import { CopyLink } from "@/app/painel/[orgId]/copy-link";
import type { ApprovalResult } from "@/app/painel/[orgId]/moldes/[patternId]/prova/actions";
import { APPROVAL_DAYS, formatDate, type ApprovalSettings } from "@/lib/prova/approval";
import type { Capture } from "@/lib/prova/captures";
import { ui } from "../ui";

/** O que a página do painel oferece à Prova para pedir aprovação. */
export type ApprovalRequester = {
  request: (settings: ApprovalSettings, captures: Capture[], days: number) => Promise<ApprovalResult>;
  /** Motivo para não pedir agora (ex.: alterações não salvas); null = pode pedir. */
  blocked: string | null;
};

type Props = { requester: ApprovalRequester; settings: ApprovalSettings; captures: Capture[] };

/** Gera o link público de aprovação com as capturas e mostra para copiar. */
export function ApprovalRequest({ requester, settings, captures }: Props) {
  const [days, setDays] = useState<number>(14);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ApprovalResult | null>(null);

  const submit = async () => {
    setBusy(true);
    setResult(null);
    setResult(await requester.request(settings, captures, days));
    setBusy(false);
  };

  return (
    <div className="space-y-2 border-t border-tinta/10 pt-3" data-approval-request>
      <h3 className="text-xs font-medium">Pedir aprovação</h3>
      {requester.blocked ? (
        <p className="text-[11px] text-tinta-suave">{requester.blocked}</p>
      ) : (
        <>
          <p className="text-[11px] text-tinta-suave">
            Gera um link para o cliente ver as imagens e responder, sem precisar de conta.
          </p>
          <div className="flex items-end gap-2">
            <label className="block flex-1 text-xs">
              <span>Vale por</span>
              <select className={`${ui.input} text-sm`} value={days} onChange={(e) => setDays(Number(e.target.value))} data-approval-days>
                {APPROVAL_DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d} dias
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className={ui.buttonPrimary}
              onClick={submit}
              disabled={busy || captures.length === 0}
              data-approval-submit
            >
              {busy ? "Gerando…" : "Gerar link"}
            </button>
          </div>
          {captures.length === 0 && <p className="text-[11px] text-tinta-suave">Capture pelo menos uma imagem.</p>}
        </>
      )}
      {result?.ok === false && (
        <p className={`${ui.error} text-xs`} role="alert">
          {result.error}
        </p>
      )}
      {result?.ok && (
        <div className="space-y-1" role="status" data-approval-link>
          <p className="text-[11px]">Link pronto. Vale até {formatDate(result.expiresAt)}; mande para o cliente:</p>
          <CopyLink link={result.link} label="Link de aprovação" />
        </div>
      )}
    </div>
  );
}
