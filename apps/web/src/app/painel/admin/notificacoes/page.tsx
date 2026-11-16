import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading, NotConfigured, PageHeader } from "@/components/page-shell";
import { ui } from "@/components/ui";
import { requirePlatform } from "@/lib/admin-server";
import { AUDIENCE_STATUS, AUDIENCES } from "@/lib/notifications";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { SendNotificationForm } from "../notification-forms";

export const metadata: Metadata = { title: "Notificações · Superadmin · Alinhavo" };

export default function AdminNotificacoesPage() {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Carregando as notificações…" />}>
      <Notificacoes />
    </Suspense>
  );
}

const quando = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

/** Enviar notificação para todos, um plano, um status, uma organização ou uma pessoa; e as já enviadas, com quantos leram. */
async function Notificacoes() {
  const { supabase } = await requirePlatform("/painel/admin/notificacoes");
  const [{ data: sent }, { data: clients }] = await Promise.all([supabase.rpc("platform_notifications", { p_limit: 60 }), supabase.rpc("platform_clients")]);
  const orgs = (clients ?? []).map((c) => ({ id: c.id, name: c.name }));
  const orgName = new Map(orgs.map((o) => [o.id, o.name]));
  const audienceText = (a: string, v: string | null) => {
    const base = AUDIENCES.find((x) => x.id === a)?.label ?? a;
    if (a === "org" && v) return `Organização: ${orgName.get(v) ?? v}`;
    if (a === "status" && v) return `Status: ${AUDIENCE_STATUS.find((s) => s.id === v)?.label ?? v}`;
    if (a === "plano" && v) return `Plano: ${v}`;
    if (a === "pessoa") return "Uma pessoa";
    return base;
  };
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Superadmin" title="Notificações" description="Aparecem no sino e na central de notificações de cada cliente, na hora." />
      <div className="grid items-start gap-6 xl:grid-cols-[1fr_1fr]">
        <section className={`${ui.card} space-y-4`} aria-labelledby="enviar">
          <h2 id="enviar" className={ui.eyebrow}>
            Nova notificação
          </h2>
          <SendNotificationForm orgs={orgs} />
        </section>
        <section className="space-y-3" aria-labelledby="enviadas">
          <h2 id="enviadas" className={ui.eyebrow}>
            Enviadas
          </h2>
          {!sent?.length ? (
            <p className={ui.muted}>Nenhuma notificação enviada ainda.</p>
          ) : (
            <ul className={ui.list}>
              {sent.map((n) => (
                <li key={n.id} className="space-y-1 px-5 py-3 text-sm">
                  <p className="font-medium">{n.title}</p>
                  <p className="font-mono text-[11px] text-tinta-suave">
                    {quando.format(new Date(n.created_at))} · {audienceText(n.audience, n.audience_value)} · {n.reads} {n.reads === 1 ? "leu" : "leram"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
