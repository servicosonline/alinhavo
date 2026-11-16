"use client";

import { useActionState, useId } from "react";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { ui, type FormState } from "@/components/ui";
import { MIN_PASSWORD } from "@/lib/password-auth";
import { changePassword, saveProfile } from "./actions";

function Message({ state }: { state: FormState }) {
  if (state?.error)
    return (
      <p className={ui.error} role="alert">
        {state.error}
      </p>
    );
  if (state?.ok)
    return (
      <p className={ui.success} role="status">
        {state.ok}
      </p>
    );
  return null;
}

/** Nome, sobrenome e CPF ou CNPJ. Os campos ficam como estão depois de salvar. */
export function ProfileForm({ firstName, lastName, document }: { firstName: string; lastName: string; document: string }) {
  const [state, action, pending] = useActionState(saveProfile, undefined);
  const id = useId();
  return (
    <ActionForm action={action} state={state} pending={pending} resetOnOk={false} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${id}-nome`} className={ui.label}>
            Nome
          </label>
          <input id={`${id}-nome`} name="first_name" defaultValue={firstName} maxLength={60} autoComplete="given-name" className={ui.input} />
        </div>
        <div>
          <label htmlFor={`${id}-sobrenome`} className={ui.label}>
            Sobrenome
          </label>
          <input id={`${id}-sobrenome`} name="last_name" defaultValue={lastName} maxLength={80} autoComplete="family-name" className={ui.input} />
        </div>
      </div>
      <div className="max-w-sm">
        <label htmlFor={`${id}-doc`} className={ui.label}>
          CPF ou CNPJ <span className="font-normal text-tinta-suave">(opcional)</span>
        </label>
        <input id={`${id}-doc`} name="document" defaultValue={document} inputMode="numeric" maxLength={18} className={`${ui.input} font-mono`} />
        <p className="mt-1 text-xs text-tinta-suave">Só você vê. Vai servir para a nota fiscal quando a assinatura chegar.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pendingText="Salvando…">Salvar dados</SubmitButton>
      </div>
      <Message state={state} />
    </ActionForm>
  );
}

/** Nova senha e confirmação. Depois do "Esqueci minha senha", é aqui que a pessoa define a nova. */
export function PasswordForm({ fromReset }: { fromReset: boolean }) {
  const [state, action, pending] = useActionState(changePassword, undefined);
  const id = useId();
  return (
    <ActionForm action={action} state={state} pending={pending} className="grid max-w-md gap-4">
      {fromReset && (
        <p className={ui.success} role="status">
          Você entrou pelo link do e-mail. Defina a nova senha abaixo.
        </p>
      )}
      <div>
        <label htmlFor={`${id}-senha`} className={ui.label}>
          Nova senha
        </label>
        <input
          id={`${id}-senha`}
          name="password"
          type="password"
          required
          minLength={MIN_PASSWORD}
          autoComplete="new-password"
          autoFocus={fromReset}
          className={ui.input}
        />
        <p className="mt-1 text-xs text-tinta-suave">Pelo menos {MIN_PASSWORD} caracteres.</p>
      </div>
      <div>
        <label htmlFor={`${id}-confirma`} className={ui.label}>
          Repita a nova senha
        </label>
        <input id={`${id}-confirma`} name="confirm" type="password" required autoComplete="new-password" className={ui.input} />
      </div>
      <div>
        <SubmitButton pendingText="Trocando…">Trocar senha</SubmitButton>
      </div>
      <Message state={state} />
    </ActionForm>
  );
}
