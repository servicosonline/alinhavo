"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { ui } from "@/components/ui";
import { EXAMPLES } from "@/lib/examples";
import { createPattern } from "./actions";

export function CreatePatternForm({ orgId }: { orgId: string }) {
  const [state, action] = useActionState(createPattern.bind(null, orgId), undefined);
  return (
    <form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label htmlFor="pattern-name" className={ui.label}>
          Nome do molde
        </label>
        <input id="pattern-name" name="name" required maxLength={120} placeholder="Ex.: Saia lápis base" className={ui.input} />
      </div>
      <div className="sm:w-56">
        <label htmlFor="pattern-start" className={ui.label}>
          Começar de
        </label>
        <select id="pattern-start" name="start" defaultValue="vazio" className={ui.input}>
          <option value="vazio">Em branco</option>
          {EXAMPLES.map((e) => (
            <option key={e.id} value={e.id} title={e.description}>
              Exemplo: {e.name}
            </option>
          ))}
        </select>
      </div>
      <SubmitButton pendingText="Criando…">Criar molde</SubmitButton>
      {state?.error && (
        <p className={`${ui.error} sm:basis-full`} role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
