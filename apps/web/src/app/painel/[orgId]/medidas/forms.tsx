"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { ui } from "@/components/ui";
import { addSize, createSizeChart } from "./actions";

export function CreateSizeChartForm({ orgId }: { orgId: string }) {
  const [state, action] = useActionState(createSizeChart.bind(null, orgId), undefined);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <div>
        <label htmlFor="chart-name" className={ui.label}>
          Nome da tabela
        </label>
        <input id="chart-name" name="name" required maxLength={120} placeholder="Ex.: Feminino adulto" className={ui.input} />
      </div>
      <div>
        <label htmlFor="chart-sizes" className={ui.label}>
          Tamanhos
        </label>
        <input id="chart-sizes" name="sizes" required defaultValue="PP, P, M, G, GG" className={ui.input} />
      </div>
      <SubmitButton pendingText="Criando…">Criar tabela</SubmitButton>
      {state?.error && (
        <p className={`${ui.error} sm:col-span-3`} role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}

export function AddSizeForm({ orgId, chartId }: { orgId: string; chartId: string }) {
  const [state, action] = useActionState(addSize.bind(null, orgId, chartId), undefined);
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <div>
        <label htmlFor="size-label" className={ui.label}>
          Novo tamanho
        </label>
        <input id="size-label" name="label" required maxLength={20} placeholder="Ex.: XG" className={`${ui.input} w-28`} />
      </div>
      <SubmitButton variant="ghost" pendingText="Incluindo…">
        Incluir
      </SubmitButton>
      {state?.error && (
        <p className="basis-full text-xs text-linha" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
