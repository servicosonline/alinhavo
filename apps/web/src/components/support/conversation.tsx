"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { closeSupport, sendSupport } from "@/app/painel/suporte/actions";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { ui } from "@/components/ui";
import { getBrowserClient } from "@/lib/supabase/client";

export interface SupportMessageView {
  id: string;
  body: string;
  fromAdmin: boolean;
  when: string;
}

/**
 * A conversa de suporte, a mesma para o cliente e para o superadmin (`side` diz de que lado a tela está).
 * Mensagem nova chega pelo Realtime (a RLS só entrega a quem pode ler) e a página se atualiza.
 */
export function SupportConversation({
  threadId,
  messages,
  closed,
  side,
}: {
  threadId: string;
  messages: SupportMessageView[];
  closed: boolean;
  side: "cliente" | "suporte";
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(sendSupport.bind(null, threadId), undefined);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase) return;
    const channel = supabase
      .channel(`suporte-${threadId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "support_messages", filter: `thread_id=eq.${threadId}` }, () => router.refresh())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [threadId, router]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <div className="space-y-4">
      <ol className="space-y-3" aria-label="Mensagens">
        {messages.map((m) => {
          const mine = side === "suporte" ? m.fromAdmin : !m.fromAdmin;
          return (
            <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${mine ? "rounded-br-sm bg-tinta text-papel" : "rounded-bl-sm border border-tinta/10 bg-white"}`}>
                <p className={`mb-1 font-mono text-[10px] tracking-wide uppercase ${mine ? "text-papel/70" : "text-tinta-suave"}`}>
                  {m.fromAdmin ? "Suporte Alinhavo" : side === "suporte" ? "Cliente" : "Você"} · {m.when}
                </p>
                <p className="text-sm whitespace-pre-line">{m.body}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <div ref={endRef} />
      {closed ? (
        <p className={ui.success}>Conversa fechada. Escrever de novo reabre.</p>
      ) : null}
      <ActionForm action={action} state={state} pending={pending} className={`${ui.card} space-y-3`}>
        <label className={ui.label}>
          {side === "suporte" ? "Responder ao cliente" : "Responder"}
          <textarea name="body" required maxLength={4000} rows={3} className={ui.input} />
        </label>
        {state?.error && (
          <p className={ui.error} role="alert">
            {state.error}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SubmitButton pendingText="Enviando…">Enviar</SubmitButton>
          {!closed && (
            <button type="submit" form={`fechar-${threadId}`} className="text-sm text-tinta-suave underline underline-offset-4 hover:text-tinta">
              {side === "suporte" ? "Fechar a conversa" : "Resolvido, pode fechar"}
            </button>
          )}
        </div>
      </ActionForm>
      <form id={`fechar-${threadId}`} action={closeSupport} hidden>
        <input type="hidden" name="threadId" value={threadId} />
      </form>
    </div>
  );
}
