"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { ui } from "@/components/ui";
import { findTemplate, SIZE_CHART_TEMPLATES } from "@/lib/size-chart-templates";
import { addSize, createSizeChart } from "./actions";

export function CreateSizeChartForm({ orgId }: { orgId: string }) {
  const [state, action] = useActionState(createSizeChart.bind(null, orgId), undefined);
  const [template, setTemplate] = useState("");
  const [name, setName] = useState("");
  const [sizes, setSizes] = useState("PP, P, M, G, GG");
  const model = findTemplate(template);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
      <div>
        <label htmlFor="chart-template" className={ui.label}>
          Começar de
        </label>
        <select
          id="chart-template"
          name="template"
          value={template}
          className={ui.input}
          data-chart-template
          onChange={(e) => {
            const next = findTemplate(e.target.value);
            setTemplate(e.target.value);
            if (next) {
              setSizes(next.sizes.join(", "));
              if (!name.trim() || SIZE_CHART_TEMPLATES.some((t) => t.name === name)) setName(next.name);
            }
          }}
        >
          <option value="">Tabela em branco</option>
          {SIZE_CHART_TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.sizes[0]} a {t.sizes.at(-1)})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="chart-name" className={ui.label}>
          Nome da tabela
        </label>
        <input
          id="chart-name"
          name="name"
          required
          maxLength={120}
          placeholder="Ex.: Feminino adulto"
          className={ui.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="chart-sizes" className={ui.label}>
          Tamanhos
        </label>
        <input id="chart-sizes" name="sizes" required value={sizes} onChange={(e) => setSizes(e.target.value)} className={ui.input} />
      </div>
      <SubmitButton pendingText="Criando…">Criar tabela</SubmitButton>
      {model && (
        <p className="text-xs text-tinta-suave sm:col-span-4" data-template-hint>
          {model.audience}. Já vem com as {model.measurements.length} medidas que o manequim da Prova usa e o jeito de medir cada uma; os
          valores você preenche ({model.reference} ainda não incluída).
        </p>
      )}
      {state?.error && (
        <p className={`${ui.error} sm:col-span-4`} role="alert">
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
