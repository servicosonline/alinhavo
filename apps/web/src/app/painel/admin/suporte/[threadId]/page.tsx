import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loading, NotConfigured, PageHeader } from "@/components/page-shell";
import { SupportConversation } from "@/components/support/conversation";
import { ui } from "@/components/ui";
import { requirePlatform } from "@/lib/admin-server";
import { isUuid } from "@/lib/ids";
import { THREAD_STATUS_LABEL } from "@/lib/support-faq";
import { loadSupportThread } from "@/lib/support-server";
import { getSupabaseConfig } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Conversa · Suporte · Superadmin · Alinhavo" };

export default function AdminConversaPage({ params }: PageProps<"/painel/admin/suporte/[threadId]">) {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Abrindo a conversa…" />}>
      <Conversa params={params} />
    </Suspense>
  );
}

/** A conversa vista pelo suporte, com o caminho para a ficha do cliente. */
async function Conversa({ params }: { params: PageProps<"/painel/admin/suporte/[threadId]">["params"] }) {
  const { threadId } = await params;
  const { supabase } = await requirePlatform(`/painel/admin/suporte/${threadId}`);
  if (!isUuid(threadId)) notFound();
  const data = await loadSupportThread(supabase, threadId);
  if (!data) notFound();
  const { thread } = data;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        trail={[{ href: "/painel/admin/suporte", label: "Suporte" }]}
        title={thread.subject}
        description={
          thread.org_id ? (
            <Link href={`/painel/admin/clientes/${thread.org_id}`} className={ui.link}>
              Ver a ficha do cliente
            </Link>
          ) : (
            "Pedido fora de uma organização."
          )
        }
        actions={<span className={thread.status === "aberta" ? ui.tagAlert : ui.tag}>{THREAD_STATUS_LABEL[thread.status]}</span>}
      />
      <SupportConversation threadId={threadId} messages={data.messages} closed={thread.status === "fechada"} side="suporte" />
    </div>
  );
}
