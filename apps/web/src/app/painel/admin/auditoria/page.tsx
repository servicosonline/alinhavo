import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Loading, NotConfigured, PageHeader } from "@/components/page-shell";
import { ui } from "@/components/ui";
import { auditText } from "@/lib/admin";
import { requirePlatform } from "@/lib/admin-server";
import { getSupabaseConfig } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Auditoria · Superadmin · Alinhavo" };

export default function AdminAuditoriaPage() {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Carregando a auditoria…" />}>
      <Auditoria />
    </Suspense>
  );
}

const quando = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** Tudo o que os admins fizeram nos clientes: quem, o quê, em quem e quando. Não se apaga. */
async function Auditoria() {
  const { supabase } = await requirePlatform("/painel/admin/auditoria");
  const { data, error } = await supabase.rpc("platform_audit_list", { p_limit: 300 });
  const rows = data ?? [];
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Superadmin" title="Auditoria" description="Cada ação feita pela administração fica registrada aqui, para sempre." />
      {error && (
        <p className={ui.error} role="alert">
          Não foi possível carregar agora.
        </p>
      )}
      {rows.length === 0 ? (
        <p className={ui.muted}>Nenhuma ação de administração ainda.</p>
      ) : (
        <ul className={ui.list} data-auditoria>
          {rows.map((a) => (
            <li key={a.id} className="px-5 py-3 text-sm">
              <span className="font-medium">{a.admin_email ?? "—"}</span> {auditText(a.action, a.meta)}
              {a.target_email && <span className="text-tinta-suave"> · {a.target_email}</span>}
              {a.org_id && (
                <>
                  {" · "}
                  <Link href={`/painel/admin/clientes/${a.org_id}`} className={ui.link}>
                    {a.org_name}
                  </Link>
                </>
              )}
              <span className="block font-mono text-[11px] text-tinta-suave">{quando.format(new Date(a.created_at))}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
