"use client";

import { useActionState } from "react";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { ui } from "@/components/ui";
import { createCollection, createMilestone, createProduct } from "./actions";

function Feedback({ state }: { state: { error?: string; ok?: string } | undefined }) {
  if (state?.error)
    return (
      <p className={`${ui.error} sm:basis-full`} role="alert">
        {state.error}
      </p>
    );
  if (state?.ok)
    return (
      <p className={`${ui.success} sm:basis-full`} role="status">
        {state.ok}
      </p>
    );
  return null;
}

export function CreateCollectionForm({ orgId }: { orgId: string }) {
  const [state, action, pending] = useActionState(createCollection.bind(null, orgId), undefined);
  return (
    <ActionForm action={action} state={state} pending={pending} className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] sm:items-end" data-form="colecao">
      <label className="block">
        <span className={ui.label}>Nome da coleção</span>
        <input name="name" required maxLength={120} placeholder="Ex.: Verão 2027" className={ui.input} />
      </label>
      <label className="block">
        <span className={ui.label}>Temporada</span>
        <input name="season" maxLength={60} placeholder="Ex.: Alto verão" className={ui.input} />
      </label>
      <label className="block">
        <span className={ui.label}>Início</span>
        <input name="starts_on" type="date" className={ui.input} />
      </label>
      <label className="block">
        <span className={ui.label}>Lançamento</span>
        <input name="launch_on" type="date" className={ui.input} />
      </label>
      <SubmitButton pendingText="Criando…">Criar coleção</SubmitButton>
      <div className="sm:col-span-5">
        <Feedback state={state} />
      </div>
    </ActionForm>
  );
}

export function CreateProductForm({ orgId, collectionId }: { orgId: string; collectionId: string }) {
  const [state, action, pending] = useActionState(createProduct.bind(null, orgId, collectionId), undefined);
  return (
    <ActionForm action={action} state={state} pending={pending} className="grid gap-3 sm:grid-cols-2 sm:items-end" data-form="produto">
      <label className="block">
        <span className={ui.label}>Referência</span>
        <input name="reference" maxLength={40} placeholder="Ex.: CAL-001" className={ui.input} />
      </label>
      <label className="block">
        <span className={ui.label}>Entrega (opcional)</span>
        <input name="due_on" type="date" className={ui.input} />
      </label>
      <label className="block sm:col-span-2">
        <span className={ui.label}>Nome do produto</span>
        <input name="name" required maxLength={120} placeholder="Ex.: Calça pantalona" className={ui.input} />
      </label>
      <div className="sm:col-span-2">
        <SubmitButton pendingText="Criando…">Adicionar produto</SubmitButton>
      </div>
      <div className="sm:col-span-2">
        <Feedback state={state} />
      </div>
    </ActionForm>
  );
}

export function CreateMilestoneForm({
  orgId,
  collectionId,
  team,
}: {
  orgId: string;
  collectionId: string;
  team: { user_id: string; email: string }[];
}) {
  const [state, action, pending] = useActionState(createMilestone.bind(null, orgId, collectionId), undefined);
  return (
    <ActionForm action={action} state={state} pending={pending} className="grid gap-3 sm:grid-cols-[2fr_1fr_1.5fr_auto] sm:items-end" data-form="etapa">
      <label className="block">
        <span className={ui.label}>Etapa</span>
        <input name="title" required maxLength={120} placeholder="Ex.: Pilotagem" className={ui.input} />
      </label>
      <label className="block">
        <span className={ui.label}>Prazo</span>
        <input name="due_on" type="date" required className={ui.input} />
      </label>
      <label className="block">
        <span className={ui.label}>Responsável</span>
        <select name="assignee" defaultValue="" className={ui.input}>
          <option value="">Ninguém</option>
          {team.map((m) => (
            <option key={m.user_id} value={m.user_id}>
              {m.email}
            </option>
          ))}
        </select>
      </label>
      <SubmitButton pendingText="Criando…">Adicionar etapa</SubmitButton>
      <div className="sm:col-span-4">
        <Feedback state={state} />
      </div>
    </ActionForm>
  );
}
