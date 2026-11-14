"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { ui } from "@/components/ui";
import { signInWithEmail } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(signInWithEmail, undefined);

  if (state?.ok) {
    return (
      <p className={ui.success} role="status">
        {state.ok}
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className={ui.label}>
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="voce@confeccao.com.br"
          className={ui.input}
        />
      </div>
      {state?.error && (
        <p className={ui.error} role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton pendingText="Enviando…">Receber link de acesso</SubmitButton>
    </form>
  );
}
