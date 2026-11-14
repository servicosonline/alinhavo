"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { ROLE_LABEL, ui } from "@/components/ui";
import { createInvite } from "./actions";
import { CopyLink } from "./copy-link";

const ROLES = ["modelista", "estilista", "leitura", "admin"] as const;

export function InviteForm({ orgId }: { orgId: string }) {
  const [state, action] = useActionState(createInvite.bind(null, orgId), undefined);
  return (
    <div className="space-y-4">
      <form action={action} className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
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
          <select id="invite-role" name="role" defaultValue="modelista" className={ui.input}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </div>
        <SubmitButton pendingText="Criando…">Convidar</SubmitButton>
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
