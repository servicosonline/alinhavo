import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Container, EmptyState, Loading, NotConfigured, PageHeader } from "@/components/page-shell";
import { ui } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { isInternal } from "@/lib/notifications";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { MarkAllRead } from "./mark-all-read";

export const metadata: Metadata = { title: "Notificações · Alinhavo" };

export default function NotificacoesPage() {
  return (
    <Container size="narrow">
      {getSupabaseConfig() ? (
        <Suspense fallback={<Loading label="Carregando as notificações…" />}>
          <Notificacoes />
        </Suspense>
      ) : (
        <NotConfigured />
      )}
    </Container>
  );
}

const quando = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** A central de notificações: tudo o que a plataforma mandou para a pessoa, das mais recentes para trás. */
async function Notificacoes() {
  await requireUser("/painel/notificacoes");
  const supabase = await createClient();
  const { data } = await supabase.rpc("my_notifications", { p_limit: 100 });
  const items = data ?? [];
  const unread = items.filter((n) => !n.read).length;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notificações"
        description={unread ? `${unread} não ${unread === 1 ? "lida" : "lidas"}.` : "Tudo lido."}
        actions={unread > 0 ? <MarkAllRead /> : undefined}
      />
      {items.length === 0 ? (
        <EmptyState icon="inicio" title="Nenhuma notificação ainda">
          Avisos da plataforma e respostas do suporte aparecem aqui.
        </EmptyState>
      ) : (
        <ul className={ui.list}>
          {items.map((n) => (
            <li key={n.id} className="space-y-1 px-5 py-4">
              <p className={`flex items-center gap-2 ${n.read ? "" : "font-medium"}`}>
                {!n.read && <span aria-label="não lida" className="size-2 shrink-0 rounded-full bg-linha" />}
                {n.title}
              </p>
              {n.body && <p className="text-sm whitespace-pre-line text-tinta-suave">{n.body}</p>}
              <p className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-tinta-suave">
                {quando.format(new Date(n.created_at))}
                {n.link &&
                  (isInternal(n.link) ? (
                    <Link href={n.link} className={ui.link}>
                      Abrir
                    </Link>
                  ) : (
                    <a href={n.link} target="_blank" rel="noreferrer" className={ui.link}>
                      Abrir
                    </a>
                  ))}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
