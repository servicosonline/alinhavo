"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { ui } from "@/components/ui";
import { createOrg } from "./actions";

export function CreateOrgForm() {
  const [state, action] = useActionState(createOrg, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="name" className={ui.label}>
          Nome da confecção ou ateliê
        </label>
        <input
          id="name"
          name="name"
          required
          minLength={2}
          maxLength={120}
          placeholder="Ex.: Ateliê Linha Fina"
          className={ui.input}
        />
      </div>
      {state?.error && (
        <p className={ui.error} role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton pendingText="Criando…">Criar organização</SubmitButton>
    </form>
  );
}
