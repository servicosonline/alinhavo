"use client";

import { useActionState } from "react";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { ROLE_LABEL, ui, type FormState } from "@/components/ui";
import { CopyLink } from "../[orgId]/copy-link";
import { adminAddHelper, adminInvite, adminSetAiLimit, adminSetSubscription } from "./actions";

function Message({ state }: { state: FormState }) {
  if (state?.error)
    return (
      <p className={ui.error} role="alert">
        {state.error}
      </p>
    );
  if (state?.ok)
    return (
      <div className="space-y-2" role="status">
        <p className={ui.success}>{state.ok}</p>
        {state.link && <CopyLink link={state.link} />}
      </div>
    );
  return null;
}

/** Convite em nome da plataforma para pôr uma pessoa na organização (vale 14 dias). */
export function AdminInviteForm({ orgId }: { orgId: string }) {
  const [state, action, pending] = useActionState(adminInvite.bind(null, orgId), undefined);
  return (
    <ActionForm action={action} state={state} pending={pending} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
      <label className="block">
        <span className={ui.label}>E-mail</span>
        <input name="email" type="email" required className={ui.input} placeholder="pessoa@confeccao.com.br" />
      </label>
      <label className="block">
        <span className={ui.label}>Papel</span>
        <select name="role" defaultValue="modelista" className={ui.input}>
          {(["admin", "modelista", "estilista", "leitura", "owner"] as const).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </select>
      </label>
      <SubmitButton pendingText="Criando…">Convidar</SubmitButton>
      <div className="sm:col-span-3">
        <Message state={state} />
      </div>
    </ActionForm>
  );
}

/** Plano e teste (só o dono da plataforma): estender o teste, cortesia, ativo, cancelado. */
export function AdminSubscriptionForm({ orgId, planId }: { orgId: string; planId: string | null }) {
  const [state, action, pending] = useActionState(adminSetSubscription.bind(null, orgId), undefined);
  return (
    <ActionForm action={action} state={state} pending={pending} resetOnOk={false} className="grid gap-3 sm:grid-cols-2">
      <label className="block">
        <span className={ui.label}>Status</span>
        <select name="status" defaultValue="trial" className={ui.input}>
          <option value="trial">Teste grátis (a partir de hoje)</option>
          <option value="cortesia">Cortesia</option>
          <option value="ativa">Ativo</option>
          <option value="cancelada">Cancelado</option>
        </select>
      </label>
      <label className="block">
        <span className={ui.label}>Dias de teste</span>
        <input name="days" type="number" min={1} max={90} defaultValue={15} className={ui.input} />
      </label>
      <label className="block sm:col-span-2">
        <span className={ui.label}>Plano</span>
        <select name="plan" defaultValue={planId ?? "confeccao"} className={ui.input}>
          <option value="gratis">Grátis</option>
          <option value="modelista">Modelista</option>
          <option value="confeccao">Confecção</option>
        </select>
      </label>
      <div className="sm:col-span-2">
        <SubmitButton pendingText="Salvando…">Salvar plano</SubmitButton>
      </div>
      <div className="sm:col-span-2">
        <Message state={state} />
      </div>
    </ActionForm>
  );
}

/** Limite de IA do mês de um tipo para o cliente (só o dono da plataforma). Vazio volta ao padrão. */
export function AdminAiLimitForm({ orgId, kind, label, current, custom }: { orgId: string; kind: string; label: string; current: number; custom: boolean }) {
  const [state, action, pending] = useActionState(adminSetAiLimit.bind(null, orgId), undefined);
  return (
    <ActionForm action={action} state={state} pending={pending} resetOnOk={false} className="space-y-2">
      <input type="hidden" name="kind" value={kind} />
      <div className="flex flex-wrap items-end gap-2">
        <label className="block w-48">
          <span className={ui.label}>
            {label} por mês {custom ? "" : "(padrão)"}
          </span>
          <input name="limit" type="number" min={0} max={10000} step={1} defaultValue={custom ? current : ""} placeholder={String(current)} className={ui.input} />
        </label>
        <SubmitButton variant="ghost" pendingText="Salvando…">
          Salvar
        </SubmitButton>
      </div>
      <Message state={state} />
    </ActionForm>
  );
}

/** Adicionar ajudante (só o dono da plataforma; a pessoa já precisa ter conta). */
export function AddHelperForm() {
  const [state, action, pending] = useActionState(adminAddHelper, undefined);
  return (
    <ActionForm action={action} state={state} pending={pending} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
      <label className="block">
        <span className={ui.label}>E-mail da conta</span>
        <input name="email" type="email" required className={ui.input} />
      </label>
      <label className="block">
        <span className={ui.label}>Papel</span>
        <select name="role" defaultValue="suporte" className={ui.input}>
          <option value="suporte">Suporte</option>
          <option value="dono">Dono</option>
        </select>
      </label>
      <SubmitButton pendingText="Adicionando…">Adicionar</SubmitButton>
      <div className="sm:col-span-3">
        <Message state={state} />
      </div>
    </ActionForm>
  );
}
