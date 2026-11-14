"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { ui } from "@/components/ui";
import { decideApproval } from "./actions";

/** Aprovar ou pedir ajustes, com nome (e comentário, obrigatório nos ajustes). */
export function DecisionForm({ token }: { token: string }) {
  const [state, action] = useActionState(decideApproval.bind(null, token), undefined);
  const [status, setStatus] = useState<"aprovado" | "ajustes">("aprovado");
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");

  if (state?.ok) {
    return (
      <p className={ui.success} role="status" data-decision-done>
        {state.ok}
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4" data-decision-form>
      <fieldset>
        <legend className={ui.label}>Sua resposta</legend>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {(
            [
              ["aprovado", "Aprovar"],
              ["ajustes", "Pedir ajustes"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm ${status === value ? "border-tinta bg-tinta text-papel" : "border-tinta/20 hover:bg-papel-escuro"}`}
            >
              <input
                type="radio"
                name="status"
                value={value}
                checked={status === value}
                onChange={() => setStatus(value)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="name" className={ui.label}>
          Seu nome
        </label>
        <input
          id="name"
          name="name"
          required
          maxLength={120}
          autoComplete="name"
          className={ui.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="comment" className={ui.label}>
          {status === "ajustes" ? "O que precisa ser ajustado" : "Comentário (opcional)"}
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={4}
          maxLength={2000}
          required={status === "ajustes"}
          placeholder={status === "ajustes" ? "Ex.: alongar 2 cm a barra, folgar o quadril." : ""}
          className={ui.input}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
      {state?.error && (
        <p className={ui.error} role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton pendingText="Enviando…">{status === "aprovado" ? "Enviar aprovação" : "Enviar pedido de ajustes"}</SubmitButton>
    </form>
  );
}
