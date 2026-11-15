import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Loading, NotConfigured, PageHeader } from "@/components/page-shell";
import { ui } from "@/components/ui";
import { requirePlatform } from "@/lib/admin-server";
import { THREAD_STATUS_LABEL } from "@/lib/support-faq";
import { getSupabaseConfig } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Suporte · Superadmin · Alinhavo" };

const FILTERS = [
  { value: "", label: "Todas" },
  { value: "aberta", label: "Esperando o suporte" },
  { value: "respondida", label: "Respondidas" },
  { value: "fechada", label: "Fechadas" },
];

export default function AdminSuportePage({ searchParams }: PageProps<"/painel/admin/suporte">) {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Carregando as conversas…" />}>
      <Caixa searchParams={searchParams} />
    </Suspense>
  );
}

const quando = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });

/** Caixa de entrada do suporte: as que esperam resposta primeiro. */
async function Caixa({ searchParams }: { searchParams: PageProps<"/painel/admin/suporte">["searchParams"] }) {
  const { supabase } = await requirePlatform("/painel/admin/suporte");
  const raw = (await searchParams).status;
  const status = FILTERS.some((f) => f.value === raw) ? String(raw) : "";
  const { data, error } = await supabase.rpc("platform_support_threads", { p_status: status || null });
  const threads = data ?? [];
  const waiting = threads.filter((t) => t.status === "aberta").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Superadmin"
        title="Suporte"
        description={status ? `${threads.length} conversa(s).` : waiting ? `${waiting} esperando resposta.` : "Ninguém esperando resposta."}
      />
      <nav aria-label="Filtrar" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value ? `/painel/admin/suporte?status=${f.value}` : "/painel/admin/suporte"}
            aria-current={status === f.value ? "page" : undefined}
            className={`rounded-full border px-3 py-1 text-sm ${status === f.value ? "border-tinta bg-tinta text-papel" : "border-tinta/20 text-tinta-suave hover:text-tinta"}`}
          >
            {f.label}
          </Link>
        ))}
      </nav>
      {error && (
        <p className={ui.error} role="alert">
          Não foi possível carregar agora.
        </p>
      )}
      {threads.length === 0 ? (
        <p className={ui.muted}>Nenhuma conversa aqui.</p>
      ) : (
        <ul className={ui.list}>
          {threads.map((t) => (
            <li key={t.id}>
              <Link href={`/painel/admin/suporte/${t.id}`} className={`${ui.row} items-start`}>
                <span className="min-w-0 space-y-0.5">
                  <span className="block truncate font-medium">{t.subject}</span>
                  <span className="block truncate text-sm text-tinta-suave">{t.last_body}</span>
                  <span className="block font-mono text-[11px] text-tinta-suave">
                    {t.user_email}
                    {t.org_name ? ` · ${t.org_name}` : ""} · {t.messages} msg · {quando.format(new Date(t.last_message_at))}
                  </span>
                </span>
                <span className={t.status === "aberta" ? ui.tagAlert : ui.tag}>{THREAD_STATUS_LABEL[t.status]}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
