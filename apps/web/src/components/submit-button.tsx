"use client";

import { useFormStatus } from "react-dom";
import { useActionPending } from "./action-form";
import { ui } from "./ui";

export function SubmitButton({
  children,
  pendingText = "Aguarde…",
  variant = "primary",
  block = false,
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: "primary" | "accent" | "ghost";
  /** Ocupa a largura toda (formulário de um campo só, como o de entrar). */
  block?: boolean;
}) {
  // <form action> informa pelo useFormStatus; o ActionForm, pelo contexto.
  const status = useFormStatus();
  const fromContext = useActionPending();
  const pending = status.pending || fromContext;
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${variant === "primary" ? ui.buttonPrimary : variant === "accent" ? ui.buttonAccent : ui.buttonGhost}${block ? " w-full" : ""}`}
    >
      {pending ? pendingText : children}
    </button>
  );
}
