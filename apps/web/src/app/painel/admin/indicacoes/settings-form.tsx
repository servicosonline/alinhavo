"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { ui } from "@/components/ui";
import type { DiscountKind, ReferralSettingsRow } from "@/lib/supabase/database.types";
import { saveReferralSettings } from "./actions";

/** Valor como a pessoa digita: percentual inteiro ou reais com vírgula. */
function shown(kind: DiscountKind, value: number) {
  return kind === "percentual" ? String(value) : (value / 100).toFixed(2).replace(".", ",");
}

function Side({
  prefix,
  title,
  kind,
  value,
  months,
  disabled,
}: {
  prefix: string;
  title: string;
  kind: DiscountKind;
  value: number;
  months: number;
  disabled: boolean;
}) {
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className={ui.eyebrow}>{title}</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        <label className="block text-sm">
          <span className={ui.label}>Tipo</span>
          <select name={`${prefix}_kind`} defaultValue={kind} className={ui.input}>
            <option value="percentual">Percentual (%)</option>
            <option value="fixo">Valor fixo (R$)</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className={ui.label}>Desconto</span>
          <input name={`${prefix}_value`} defaultValue={shown(kind, value)} inputMode="decimal" className={ui.input} />
        </label>
        <label className="block text-sm">
          <span className={ui.label}>Mensalidades</span>
          <input name={`${prefix}_months`} type="number" min={1} max={12} defaultValue={months} className={ui.input} />
        </label>
      </div>
    </fieldset>
  );
}

/** Regras do programa de indicação. Só o dono da plataforma salva; o suporte vê. */
export function ReferralSettingsForm({ settings, canEdit }: { settings: ReferralSettingsRow; canEdit: boolean }) {
  const [state, action] = useActionState(saveReferralSettings, undefined);
  return (
    <form action={action} className={`${ui.card} space-y-5`} data-referral-settings>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="enabled" defaultChecked={settings.enabled} disabled={!canEdit} />
        Programa ligado: o link aparece em Minha conta e as indicações passam a contar
      </label>
      <Side
        prefix="referrer"
        title="Quem indica ganha"
        kind={settings.referrer_kind}
        value={settings.referrer_value}
        months={settings.referrer_months}
        disabled={!canEdit}
      />
      <Side
        prefix="referred"
        title="Quem é indicado ganha"
        kind={settings.referred_kind}
        value={settings.referred_value}
        months={settings.referred_months}
        disabled={!canEdit}
      />
      <p className="text-xs text-tinta-suave">
        O desconto nasce no primeiro pagamento da pessoa indicada, com as regras daquele momento. Percentual de 0 a 100; valor fixo até R$ 1.000,00;
        0 = sem desconto daquele lado.
      </p>
      {canEdit ? <SubmitButton pendingText="Salvando…">Salvar regras</SubmitButton> : <p className={ui.muted}>Só o superadmin dono muda as regras.</p>}
      {state?.error && (
        <p className={ui.error} role="alert">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className={ui.success} role="status">
          {state.ok}
        </p>
      )}
    </form>
  );
}
