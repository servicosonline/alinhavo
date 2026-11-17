import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EmptyState, Loading, NotConfigured, PageHeader } from "@/components/page-shell";
import { ModuleIcon } from "@/components/icons";
import { ui } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { canEditPatterns, getMyRole, getOrgPlan } from "@/lib/org-access";
import { planAllows } from "@/lib/plans";
import { PlanLock } from "@/components/plan-lock";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { CreatePatternForm } from "./create-pattern-form";

export default function MoldesPage({ params }: PageProps<"/painel/[orgId]/moldes">) {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Carregando moldes…" />}>
      <Moldes params={params} />
    </Suspense>
  );
}

const quando = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

async function Moldes({ params }: { params: PageProps<"/painel/[orgId]/moldes">["params"] }) {
  const { orgId } = await params;
  if (!isUuid(orgId)) notFound();
  const user = await requireUser(`/painel/${orgId}/moldes`);
  const supabase = await createClient();

  const [orgRes, role, plan, allRes, patternsRes] = await Promise.all([
    supabase.from("orgs").select("name").eq("id", orgId).maybeSingle(),
    getMyRole(supabase, orgId, user.id),
    getOrgPlan(supabase, orgId),
    // Todos, arquivados inclusive: é o que conta no limite do Grátis (igual ao banco).
    supabase.from("patterns").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    supabase
      .from("patterns")
      .select("id, name, current_version, updated_at")
      .eq("org_id", orgId)
      .is("archived_at", null)
      .order("updated_at", { ascending: false }),
  ]);
  if (!orgRes.data) notFound();
  const patterns = patternsRes.data ?? [];
  const atPlanLimit = !planAllows(plan, "moldes") && (allRes.count ?? 0) >= 1;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Moldes"
        description="Desenhe no tamanho base, gradue a grade inteira e prove no corpo em 3D. Cada ajuste salvo vira uma versão nova."
      />

      {canEditPatterns(role) && atPlanLimit && <PlanLock feature="moldes" />}

      {canEditPatterns(role) && !atPlanLimit && (
        <section className={`${ui.card} space-y-3`} aria-label="Novo molde">
          <h2 className={`${ui.eyebrow} mb-1`}>Novo molde</h2>
          <CreatePatternForm orgId={orgId} />
          {planAllows(plan, "scan") && (
            <p className="text-sm text-tinta-suave">
              Tem o molde em papel?{" "}
              <Link href={`/painel/${orgId}/moldes/scan`} className={ui.link} data-scan-link>
                Escanear por foto
              </Link>
            </p>
          )}
        </section>
      )}

      {patterns.length === 0 ? (
        <EmptyState icon="moldes" title="Nenhum molde ainda">
          Comece de um exemplo (saia, calça ou conjunto) ou do zero. Tem o molde em papel? Escaneie por foto.
        </EmptyState>
      ) : (
        <ul className={ui.list}>
          {patterns.map((p) => (
            <li key={p.id}>
              <Link
                href={`/painel/${orgId}/moldes/${p.id}`}
                className={ui.row}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <ModuleIcon name="moldes" className="size-5 text-tinta-suave" />
                  <span className="truncate font-medium">{p.name}</span>
                </span>
                <span className="shrink-0 text-right font-mono text-[11px] text-tinta-suave">
                  {p.current_version === 0 ? "sem versão salva" : `versão ${p.current_version}`}
                  <br />
                  {quando.format(new Date(p.updated_at))}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
