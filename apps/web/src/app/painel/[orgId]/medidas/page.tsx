import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EmptyState, Loading, NotConfigured, PageHeader } from "@/components/page-shell";
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
      <PageHeader
        title="Tabelas de medidas"
        description="Uma por público ou por cliente. Os moldes usam a grade de tamanhos daqui."
      />

      {canEditPatterns(role) && (
        <section className={ui.card} aria-label="Nova tabela">
          <h2 className={`${ui.eyebrow} mb-4`}>Nova tabela</h2>
          <CreateSizeChartForm orgId={orgId} />
        </section>
      )}

      {charts.length === 0 ? (
        <EmptyState icon="medidas" title="Nenhuma tabela ainda">
          A tabela dá a grade de tamanhos do molde e as medidas do corpo na Prova 3D.
        </EmptyState>
      ) : (
        <ul className={ui.list}>
          {charts.map((c) => (
            <li key={c.id}>
              <Link
                href={`/painel/${orgId}/medidas/${c.id}`}
                className={ui.row}
              >
                <span className="font-display text-lg font-semibold">{c.name}</span>
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
