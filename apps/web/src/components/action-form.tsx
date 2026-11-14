"use client";

import { createContext, useContext, useEffect, useRef, startTransition } from "react";
import type { FormState } from "./ui";

/** O formulário está enviando (para o SubmitButton, que não vê o useFormStatus aqui). */
export const ActionPending = createContext(false);
export const useActionPending = () => useContext(ActionPending);

/**
 * Formulário ligado a uma Server Action pelo useActionState, sem a limpeza
 * automática do React 19: com <form action>, o React apaga os campos depois
 * de cada envio, até quando dá erro, e a pessoa teria de digitar tudo de
 * novo. Aqui os campos ficam quando há erro e são limpos só depois do
 * sucesso (`resetOnOk`).
 */
export function ActionForm({
  action,
  state,
  pending,
  resetOnOk = true,
  children,
  ...rest
}: {
  action: (payload: FormData) => void;
  state: FormState;
  pending: boolean;
  resetOnOk?: boolean;
  children: React.ReactNode;
} & Omit<React.FormHTMLAttributes<HTMLFormElement>, "action" | "onSubmit">) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (resetOnOk && state?.ok) ref.current?.reset();
  }, [state, resetOnOk]);
  return (
    <form
      ref={ref}
      {...rest}
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
    >
      <ActionPending.Provider value={pending}>{children}</ActionPending.Provider>
    </form>
  );
}
