"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { ui } from "@/components/ui";
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
      <SubmitButton pendingText="Criando…">Criar molde</SubmitButton>
      {state?.error && (
        <p className={`${ui.error} sm:basis-full`} role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
