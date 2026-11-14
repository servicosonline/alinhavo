"use client";

import { useFormStatus } from "react-dom";
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
  const { pending } = useFormStatus();
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
