import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Container, Loading, NotConfigured, PageHeader } from "@/components/page-shell";
import { SupportConversation } from "@/components/support/conversation";
import { ui } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { THREAD_STATUS_LABEL } from "@/lib/support-faq";
import { loadSupportThread } from "@/lib/support-server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Conversa com o suporte · Alinhavo" };

export default function ConversaPage({ params }: PageProps<"/painel/suporte/[threadId]">) {
  return (
    <Container size="narrow">
      {getSupabaseConfig() ? (
        <Suspense fallback={<Loading label="Abrindo a conversa…" />}>
          <Conversa params={params} />
        </Suspense>
      ) : (
        <NotConfigured />
      )}
    </Container>
  );
}

async function Conversa({ params }: { params: PageProps<"/painel/suporte/[threadId]">["params"] }) {
  const { threadId } = await params;
  const user = await requireUser(`/painel/suporte/${threadId}`);
  if (!isUuid(threadId)) notFound();
  const data = await loadSupportThread(await createClient(), threadId);
  // O superadmin lê toda conversa pela RLS, mas responde pela caixa dele; aqui só a do próprio cliente.
  if (!data || data.thread.user_id !== user.id) notFound();
  return (
    <div className="space-y-6">
      <PageHeader
        trail={[{ href: "/painel/suporte", label: "Minhas conversas" }]}
        title={data.thread.subject}
        actions={<span className={data.thread.status === "respondida" ? ui.tagAlert : ui.tag}>{THREAD_STATUS_LABEL[data.thread.status]}</span>}
      />
      <SupportConversation threadId={threadId} messages={data.messages} closed={data.thread.status === "fechada"} side="cliente" />
    </div>
  );
}
