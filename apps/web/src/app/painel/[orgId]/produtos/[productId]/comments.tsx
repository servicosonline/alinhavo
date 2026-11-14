"use client";

import { useActionState, useEffect, useRef, useState, useSyncExternalStore, startTransition } from "react";
import { ui } from "@/components/ui";
import { mergeComment, MAX_COMMENT, removeComment, whenLabel, type CommentView } from "@/lib/comments";
import { getBrowserClient } from "@/lib/supabase/client";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { addComment, deleteComment, type CommentResult } from "../comment-actions";

type Props = {
  orgId: string;
  productId: string;
  me: string;
  /** Pode apagar comentário de outros (dono e admin). */
  moderator: boolean;
  /** user_id → e-mail, para mostrar o autor. */
  names: Record<string, string>;
  initial: CommentView[];
};

function subscribeClock(onChange: () => void) {
  const t = setInterval(onChange, 30_000);
  return () => clearInterval(t);
}
const clockSnapshot = () => Math.floor(Date.now() / 30_000) * 30_000;
const absoluteTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

/**
 * Comentários do produto, em tempo real: quem está com a página aberta vê
 * o comentário novo na hora (Supabase Realtime; só chegam as linhas que a
 * RLS deixa ler).
 */
export function Comments({ orgId, productId, me, moderator, names, initial }: Props) {
  const [list, setList] = useState<CommentView[]>(initial);
  const [status, setStatus] = useState<"conectando" | "ao vivo" | "caiu">("conectando");
  const live = !getSupabaseConfig() || status === "caiu" ? "sem tempo real" : status;
  const [state, action, pending] = useActionState<CommentResult, FormData>(addComment.bind(null, orgId, productId), undefined);
  const formRef = useRef<HTMLFormElement>(null);
  // Relógio só no navegador (de 30 em 30 s): no servidor não há "agora" igual ao do cliente.
  const now = useSyncExternalStore(subscribeClock, clockSnapshot, () => null);

  // O que eu mesmo enviei entra na hora, sem esperar o tempo real (ajuste durante a renderização).
  const [merged, setMerged] = useState<string | null>(null);
  if (state?.comment && state.comment.id !== merged) {
    setMerged(state.comment.id);
    setList((l) => mergeComment(l, state.comment!));
  }
  useEffect(() => {
    if (state?.comment) formRef.current?.reset();
  }, [state]);


  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase) return;
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    // Assinar só depois de a sessão carregar (vem dos cookies, sem esperar): antes
    // disso o Realtime avaliaria a assinatura como visitante, que não lê a tabela.
    // O supabase-js entrega o token ao Realtime sozinho (accessToken).
    void supabase.auth.getSession().then(() => {
      if (cancelled) return;
      channel = supabase
      .channel(`comentarios:${productId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "comments", filter: `product_id=eq.${productId}` }, (payload) => {
        const row = payload.new as CommentView;
        setList((l) => mergeComment(l, { id: row.id, author: row.author, body: row.body, created_at: row.created_at }));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "comments" }, (payload) => {
        const id = (payload.old as { id?: string }).id;
        if (id) setList((l) => removeComment(l, id));
      })
      .on("system", {}, (p: { status?: string; message?: string }) => {
        // O servidor recusa a assinatura com uma mensagem de sistema (e o canal segue "SUBSCRIBED").
        if (p.status === "error") {
          console.warn("[comentarios] tempo real recusado:", p.message);
          setStatus("caiu");
        }
      })
      .subscribe((s) => setStatus(s === "SUBSCRIBED" ? "ao vivo" : s === "CLOSED" || s === "CHANNEL_ERROR" || s === "TIMED_OUT" ? "caiu" : "conectando"));
    });
    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [productId]);

  return (
    <section className={`${ui.card} space-y-4`} aria-labelledby="comentarios" data-section="comentarios">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="comentarios" className={ui.h2}>
          Comentários
        </h2>
        <span className="text-xs text-tinta-suave" data-live={live}>
          {live === "ao vivo" ? "● ao vivo" : live === "conectando" ? "conectando…" : "atualize a página para ver novos"}
        </span>
      </div>

      {list.length === 0 ? (
        <p className={ui.muted}>Ninguém comentou ainda.</p>
      ) : (
        <ul className="space-y-3" data-comments aria-live="polite">
          {list.map((c) => {
            const mine = c.author === me;
            return (
              <li key={c.id} className={`rounded-md px-3 py-2 text-sm ${mine ? "bg-papel-escuro" : "border border-tinta/10"}`} data-comment={c.id}>
                <div className="flex items-baseline justify-between gap-2 text-xs text-tinta-suave">
                  <span>
                    <strong className="text-tinta">{c.author ? (names[c.author] ?? "Ex-membro") : "Ex-membro"}</strong>
                    {mine && " (você)"} · {now === null ? absoluteTime(c.created_at) : whenLabel(c.created_at, now)}
                  </span>
                  {(mine || moderator) && (
                    <button
                      type="button"
                      className="underline hover:text-linha"
                      onClick={async () => {
                        const r = await deleteComment(orgId, c.id);
                        if (r.ok) setList((l) => removeComment(l, c.id));
                      }}
                    >
                      Apagar
                    </button>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-line">{c.body}</p>
              </li>
            );
          })}
        </ul>
      )}

      <form
        ref={formRef}
        className="space-y-2"
        data-form="comentario"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          startTransition(() => action(data));
        }}
      >
        <label htmlFor="comment-body" className="sr-only">
          Novo comentário
        </label>
        <textarea id="comment-body" name="body" required maxLength={MAX_COMMENT} rows={3} placeholder="Escreva para a equipe…" className={ui.input} />
        <div className="flex items-center gap-3">
          <button type="submit" className={ui.buttonPrimary} disabled={pending}>
            {pending ? "Enviando…" : "Comentar"}
          </button>
          {state?.error && (
            <p className="text-sm text-linha" role="alert">
              {state.error}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
