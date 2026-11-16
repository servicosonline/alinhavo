import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Container, EmptyState, Loading, NotConfigured, PageHeader } from "@/components/page-shell";
import { ui } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { THREAD_STATUS_LABEL } from "@/lib/support-faq";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Suporte · Alinhavo" };

export default function SuportePage() {
  return (
    <Container size="narrow">
      {getSupabaseConfig() ? (
        <Suspense fallback={<Loading label="Carregando as conversas…" />}>
          <Conversas />
        </Suspense>
      ) : (
        <NotConfigured />
      )}
    </Container>
  );
}

const quando = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

/** As conversas da pessoa com o suporte. Nova conversa: botão "Ajuda" no canto da tela. */
async function Conversas() {
  const user = await requireUser("/painel/suporte");
  const supabase = await createClient();
  const { data } = await supabase
    .from("support_threads")
    .select("id, subject, status, last_message_at")
    .eq("user_id", user.id)
    .order("last_message_at", { ascending: false })
    .limit(100);
  const threads = data ?? [];
  return (
    <div className="space-y-6">
      <PageHeader title="Minhas conversas" description="Com o suporte do Alinhavo. Para abrir uma nova, use o botão Ajuda no canto da tela." />
      {threads.length === 0 ? (
        <EmptyState icon="inicio" title="Nenhuma conversa ainda">
          Dúvida ou problema? O botão Ajuda tem as perguntas frequentes e o caminho para falar com a gente.
        </EmptyState>
      ) : (
        <ul className={ui.list}>
          {threads.map((t) => (
            <li key={t.id}>
              <Link href={`/painel/suporte/${t.id}`} className={ui.row}>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{t.subject}</span>
                  <span className="font-mono text-[11px] text-tinta-suave">{quando.format(new Date(t.last_message_at))}</span>
                </span>
                <span className={t.status === "respondida" ? ui.tagAlert : ui.tag}>{THREAD_STATUS_LABEL[t.status]}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
