"use client";

import { useFormStatus } from "react-dom";
import { useActionPending } from "./action-form";
import { ui } from "./ui";

export function SubmitButton({
  children,
  pendingText = "Aguarde…",
  variant = "primary",
}: {
  children: React.ReactNode;
  pendingText?: string;
  variant?: "primary" | "ghost";
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
      className={variant === "primary" ? ui.buttonPrimary : ui.buttonGhost}
    >
      {pending ? pendingText : children}
    </button>
  );
}
