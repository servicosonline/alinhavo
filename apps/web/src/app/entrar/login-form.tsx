"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/submit-button";
import { ui } from "@/components/ui";
import { MIN_PASSWORD } from "@/lib/password-auth";
import { signInWithEmail, signInWithPassword, signUpWithPassword } from "./actions";

type Mode = "entrar" | "criar" | "link";

const TABS: { id: Exclude<Mode, "link">; name: string }[] = [
  { id: "entrar", name: "Entrar" },
  { id: "criar", name: "Criar conta" },
];

export function LoginForm({ next }: { next: string }) {
  const [mode, setMode] = useState<Mode>("entrar");
  // O e-mail fica aqui fora: sobrevive ao erro (o React limpa o formulário) e à troca de aba.
  const [email, setEmail] = useState("");
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-1 rounded-md bg-papel-escuro p-1" role="tablist" aria-label="Entrar ou criar conta">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={mode === t.id}
            data-tab={t.id}
            onClick={() => setMode(t.id)}
            className={`rounded px-3 py-1.5 text-sm ${mode === t.id ? "bg-white font-medium text-tinta shadow-sm" : "text-tinta-suave hover:text-tinta"}`}
          >
            {t.name}
          </button>
        ))}
      </div>
      {/* A chave zera o formulário (e o erro anterior) ao trocar de aba. */}
      {mode === "link" ? <LinkForm key="link" next={next} email={email} onEmail={setEmail} /> : <PasswordForm key={mode} mode={mode} next={next} email={email} onEmail={setEmail} />}
      <p className="text-center text-xs text-tinta-suave">
        {mode === "link" ? (
          <button type="button" className="underline hover:text-tinta" onClick={() => setMode("entrar")}>
            Voltar para entrar com senha
          </button>
        ) : (
          <button type="button" className="underline hover:text-tinta" onClick={() => setMode("link")} data-mode-link>
            Prefere receber um link de acesso por e-mail?
          </button>
        )}
      </p>
    </div>
  );
}

type EmailProps = { email: string; onEmail: (v: string) => void };

function EmailField({ email, onEmail }: EmailProps) {
  return (
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
        value={email}
        onChange={(e) => onEmail(e.target.value)}
      />
    </div>
  );
}

function PasswordForm({ mode, next, email, onEmail }: { mode: "entrar" | "criar"; next: string } & EmailProps) {
  const creating = mode === "criar";
  const [state, action] = useActionState(creating ? signUpWithPassword : signInWithPassword, undefined);
  const [show, setShow] = useState(false);

  if (state?.ok) {
    return (
      <p className={ui.success} role="status">
        {state.ok}
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4" data-form={mode}>
      <input type="hidden" name="next" value={next} />
      <EmailField email={email} onEmail={onEmail} />
      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="password" className={ui.label}>
            Senha
          </label>
          <button type="button" className="text-xs text-tinta-suave underline hover:text-tinta" onClick={() => setShow((s) => !s)} aria-pressed={show}>
            {show ? "Esconder" : "Mostrar"}
          </button>
        </div>
        <input
          id="password"
          name="password"
          type={show ? "text" : "password"}
          autoComplete={creating ? "new-password" : "current-password"}
          required
          minLength={creating ? MIN_PASSWORD : undefined}
          className={ui.input}
          aria-describedby={creating ? "senha-dica" : undefined}
        />
        {creating && (
          <p id="senha-dica" className="mt-1 text-xs text-tinta-suave">
            Pelo menos {MIN_PASSWORD} caracteres.
          </p>
        )}
      </div>
      {creating && (
        <div>
          <label htmlFor="confirm" className={ui.label}>
            Repita a senha
          </label>
          <input id="confirm" name="confirm" type={show ? "text" : "password"} autoComplete="new-password" required className={ui.input} />
        </div>
      )}
      {state?.error && (
        <p className={ui.error} role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton pendingText={creating ? "Criando a conta…" : "Entrando…"}>{creating ? "Criar conta" : "Entrar"}</SubmitButton>
    </form>
  );
}

function LinkForm({ next, email, onEmail }: { next: string } & EmailProps) {
  const [state, action] = useActionState(signInWithEmail, undefined);

  if (state?.ok) {
    return (
      <p className={ui.success} role="status">
        {state.ok}
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4" data-form="link">
      <input type="hidden" name="next" value={next} />
      <EmailField email={email} onEmail={onEmail} />
      {state?.error && (
        <p className={ui.error} role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton pendingText="Enviando…">Receber link de acesso</SubmitButton>
    </form>
  );
}
