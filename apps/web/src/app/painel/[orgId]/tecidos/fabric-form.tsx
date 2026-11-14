"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { ui } from "@/components/ui";
import { createFabric } from "./actions";

export function FabricForm({ orgId }: { orgId: string }) {
  const [state, action] = useActionState(createFabric.bind(null, orgId), undefined);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-3" data-form="tecido">
      <label className="block sm:col-span-2">
        <span className={ui.label}>Nome</span>
        <input name="name" required maxLength={120} placeholder="Ex.: Sarja 2/1" className={ui.input} />
      </label>
      <label className="block">
        <span className={ui.label}>Comportamento na Prova</span>
        <select name="preset" defaultValue="" className={ui.input}>
          <option value="">Escolher depois</option>
          <option value="planoLeve">Plano leve</option>
          <option value="malha">Malha</option>
          <option value="jeans">Jeans</option>
        </select>
      </label>
      <label className="block sm:col-span-3">
        <span className={ui.label}>Composição</span>
        <input name="composition" maxLength={200} placeholder="Ex.: 98% algodão, 2% elastano" className={ui.input} />
      </label>
      <label className="block">
        <span className={ui.label}>Largura útil (cm)</span>
        <input name="width" inputMode="decimal" placeholder="Ex.: 150" className={ui.input} />
      </label>
      <label className="block">
        <span className={ui.label}>Gramatura (g/m²)</span>
        <input name="weight" inputMode="decimal" placeholder="Ex.: 280" className={ui.input} />
      </label>
      <label className="block">
        <span className={ui.label}>Preço por metro (R$)</span>
        <input name="price" inputMode="decimal" placeholder="Ex.: 39,90" className={ui.input} />
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
        <SubmitButton pendingText="Cadastrando…">Cadastrar tecido</SubmitButton>
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
      </div>
    </form>
  );
}
