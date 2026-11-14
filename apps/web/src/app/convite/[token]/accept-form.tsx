"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { ui } from "@/components/ui";
import { acceptInvite } from "./actions";

export function AcceptForm({ token }: { token: string }) {
  const [state, action] = useActionState(acceptInvite.bind(null, token), undefined);
  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <p className={ui.error} role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton pendingText="Entrando…">Aceitar convite</SubmitButton>
    </form>
  );
}
