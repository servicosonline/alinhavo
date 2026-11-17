"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { ROLE_LABEL, ui } from "@/components/ui";
import type { SubscriptionStatus } from "@/lib/account";
import { inviteQuote, rolePriceCents, type TeamRole } from "@/lib/invite-price";
import { formatMoney } from "@/lib/money";
import { createInvite } from "./actions";
import { CopyLink } from "./copy-link";

const ROLES = ["modelista", "estilista", "leitura", "admin"] as const;

/**
 * Convidar pessoa: e-mail, papel (com o preço do assento ao lado), se ela pode criar organizações próprias
 * (começa desmarcado) e, antes de enviar, a mensalidade de hoje e a com este convite. No teste e na cortesia
 * nada é cobrado, mas o valor de quando assinar aparece igual.
 */
export function InviteForm({
  orgId,
  planId,
  status,
  members,
  pending,
}: {
  orgId: string;
  planId: string | null;
  status: SubscriptionStatus | null;
  members: TeamRole[];
  pending: TeamRole[];
}) {
  const [state, action] = useActionState(createInvite.bind(null, orgId), undefined);
  const [role, setRole] = useState<(typeof ROLES)[number]>("modelista");
  const quote = inviteQuote({ planId, status, members, pending, role });
  const priceLabel = (r: TeamRole) => {
    const c = rolePriceCents(planId, r);
    if (c === null) return "";
    return c === 0 ? " · grátis" : ` · ${formatMoney(c)}/mês`;
  };

  return (
    <div className="space-y-4">
      <form action={action} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <div>
            <label htmlFor="invite-email" className={ui.label}>
              E-mail
            </label>
            <input id="invite-email" name="email" type="email" required placeholder="pessoa@confeccao.com.br" className={ui.input} />
          </div>
          <div>
            <label htmlFor="invite-role" className={ui.label}>
              Papel
            </label>
            <select
              id="invite-role"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}
              className={ui.input}
              data-invite-role
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                  {priceLabel(r)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="can_create_orgs" className="mt-0.5" data-invite-can-create />
          <span>
            Pode criar organizações próprias
            <span className="block text-xs text-tinta-suave">
              Desmarcado, a pessoa usa a conta só na sua organização. Você pode liberar depois, na aba Equipe.
            </span>
          </span>
        </label>

        {quote && (
          <div className="rounded-lg border border-tinta/10 bg-papel px-4 py-3 text-sm" data-invite-quote aria-live="polite">
            <p>
              {ROLE_LABEL[role]}: <b>{quote.roleCents === 0 ? "grátis" : `${formatMoney(quote.roleCents)}/mês`}</b>
            </p>
            <p className="mt-1 text-tinta-suave">
              {quote.charging ? "Mensalidade hoje" : "Ao assinar, a mensalidade"}: {formatMoney(quote.beforeCents)}
              {" → "}
              <b className="text-tinta">com este convite, {formatMoney(quote.afterCents)}</b>
              {quote.deltaCents > 0 && ` (+${formatMoney(quote.deltaCents)})`}
            </p>
            {pending.length > 0 && (
              <p className="mt-1 text-xs text-tinta-suave">
                Já conta {pending.length === 1 ? "o convite pendente" : `os ${pending.length} convites pendentes`}.
              </p>
            )}
            {!quote.charging && <p className="mt-1 text-xs text-tinta-suave">Durante o teste grátis ou a cortesia, nada é cobrado.</p>}
          </div>
        )}

        <SubmitButton pendingText="Criando…">
          {quote && quote.deltaCents > 0 ? `Convidar (+${formatMoney(quote.deltaCents)}/mês)` : "Convidar"}
        </SubmitButton>
      </form>
      {state?.error && (
        <p className={ui.error} role="alert">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <div className="space-y-2" role="status">
          <p className={ui.success}>{state.ok}</p>
          {state.link && <CopyLink link={state.link} />}
        </div>
      )}
    </div>
  );
}
