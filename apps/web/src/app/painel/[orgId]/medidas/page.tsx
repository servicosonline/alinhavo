import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loading, NotConfigured } from "@/components/page-shell";
import { ui } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { canEditPatterns, getMyRole } from "@/lib/org-access";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { CreateSizeChartForm } from "./forms";

export default function MedidasPage({ params }: PageProps<"/painel/[orgId]/medidas">) {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Carregando tabelas…" />}>
      <Tabelas params={params} />
    </Suspense>
  );
}

async function Tabelas({ params }: { params: PageProps<"/painel/[orgId]/medidas">["params"] }) {
  const { orgId } = await params;
  if (!isUuid(orgId)) notFound();
  const user = await requireUser(`/painel/${orgId}/medidas`);
  const supabase = await createClient();

  const [orgRes, role, chartsRes] = await Promise.all([
    supabase.from("orgs").select("name").eq("id", orgId).maybeSingle(),
    getMyRole(supabase, orgId, user.id),
    supabase.from("size_charts").select("id, name, sizes(label, position)").eq("org_id", orgId).order("name"),
  ]);
  if (!orgRes.data) notFound();
  const charts = chartsRes.data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/painel/${orgId}`} className="text-sm text-tinta-suave hover:text-tinta">
          ← {orgRes.data.name}
        </Link>
        <h1 className={`mt-2 ${ui.h1}`}>Tabelas de medidas</h1>
        <p className={`mt-1 ${ui.muted}`}>Uma por público ou por cliente. Os moldes usam a grade de tamanhos daqui.</p>
      </div>

      {canEditPatterns(role) && (
        <div className={ui.card}>
          <CreateSizeChartForm orgId={orgId} />
        </div>
      )}

      {charts.length === 0 ? (
        <p className={ui.muted}>Nenhuma tabela ainda.</p>
      ) : (
        <ul className="divide-y divide-tinta/10 overflow-hidden rounded-lg border border-tinta/15 bg-white/70">
          {charts.map((c) => (
            <li key={c.id}>
              <Link
                href={`/painel/${orgId}/medidas/${c.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-papel-escuro"
              >
                <span className="font-medium">{c.name}</span>
                <span className="font-mono text-xs text-tinta-suave">
                  {[...c.sizes].sort((a, b) => a.position - b.position).map((s) => s.label).join(" · ") || "sem tamanhos"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
