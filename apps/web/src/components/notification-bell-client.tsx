"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";
import { isInternal } from "@/lib/notifications";

export interface BellItem {
  id: string;
  title: string;
  body: string;
  link: string | null;
  when: string;
  read: boolean;
}

/**
 * O sino da barra: número de não lidas, as últimas notificações e "marcar todas como lidas". Notificação nova
 * chega pelo Realtime (a RLS só entrega as que são para a pessoa) e a barra se atualiza.
 */
export function NotificationBellClient({ items, unread }: { items: BellItem[]; unread: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase) return;
    const channel = supabase
      .channel("notificacoes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => router.refresh())
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router]);

  async function markAll(ids: string[] | null) {
    const supabase = getBrowserClient();
    if (!supabase) return;
    setBusy(true);
    await supabase.rpc("mark_notifications_read", { p_ids: ids });
    setBusy(false);
    router.refresh();
  }

  return (
    <details className="group relative">
      <summary
        className="relative grid size-10 cursor-pointer list-none place-items-center rounded-full transition hover:bg-papel-escuro [&::-webkit-details-marker]:hidden"
        aria-label={unread ? `Notificações: ${unread} não ${unread === 1 ? "lida" : "lidas"}` : "Notificações"}
        data-sino
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16ZM10 20a2 2 0 0 0 4 0" strokeLinejoin="round" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-linha px-1 font-mono text-[10px] leading-5 text-white" data-nao-lidas>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </summary>
      <div className="absolute right-0 z-40 mt-2 w-[min(92vw,22rem)] overflow-hidden rounded-xl border border-tinta/10 bg-white shadow-[0_18px_40px_-20px_rgb(29_27_24/0.45)]">
        <div className="flex items-center justify-between border-b border-tinta/10 px-4 py-2.5">
          <p className="text-sm font-medium">Notificações</p>
          {unread > 0 && (
            <button type="button" disabled={busy} onClick={() => markAll(null)} className="text-xs text-tinta-suave underline underline-offset-4 hover:text-tinta">
              Marcar todas como lidas
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-tinta-suave">Nada por aqui ainda.</p>
        ) : (
          <ul className="max-h-[60vh] divide-y divide-tinta/10 overflow-y-auto">
            {items.map((n) => {
              const content = (
                <>
                  <span className="flex items-start gap-2">
                    {!n.read && <span aria-label="não lida" className="mt-1.5 size-2 shrink-0 rounded-full bg-linha" />}
                    <span className="min-w-0">
                      <span className={`block text-sm ${n.read ? "" : "font-medium"}`}>{n.title}</span>
                      {n.body && <span className="mt-0.5 line-clamp-2 block text-xs text-tinta-suave">{n.body}</span>}
                      <span className="mt-1 block font-mono text-[10px] text-tinta-suave">{n.when}</span>
                    </span>
                  </span>
                </>
              );
              const cls = "block px-4 py-3 hover:bg-papel";
              return (
                <li key={n.id}>
                  {n.link ? (
                    isInternal(n.link) ? (
                      <Link href={n.link} className={cls} onClick={() => !n.read && void markAll([n.id])}>
                        {content}
                      </Link>
                    ) : (
                      <a href={n.link} target="_blank" rel="noreferrer" className={cls} onClick={() => !n.read && void markAll([n.id])}>
                        {content}
                      </a>
                    )
                  ) : (
                    <button type="button" className={`${cls} w-full text-left`} onClick={() => !n.read && void markAll([n.id])}>
                      {content}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <Link href="/painel/notificacoes" className="block border-t border-tinta/10 px-4 py-2.5 text-center text-sm text-tinta-suave hover:bg-papel hover:text-tinta">
          Ver todas
        </Link>
      </div>
    </details>
  );
}
