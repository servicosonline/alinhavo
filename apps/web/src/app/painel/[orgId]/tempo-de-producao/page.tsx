import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loading, NotConfigured, PageHeader } from "@/components/page-shell";
import { ProductionTimesView } from "@/components/production-times-view";
import { ui } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { getMyRole } from "@/lib/org-access";
import { readProductionTimes } from "@/lib/production-times";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type Params = PageProps<"/painel/[orgId]/tempo-de-producao">["params"];

export default function TempoDeProducaoPage({ params }: PageProps<"/painel/[orgId]/tempo-de-producao">) {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Medindo os estágios…" />}>
      <TempoDeProducao params={params} />
    </Suspense>
  );
}

async function TempoDeProducao({ params }: { params: Params }) {
  const { orgId } = await params;
  if (!isUuid(orgId)) notFound();
  const user = await requireUser(`/painel/${orgId}/tempo-de-producao`);
  const supabase = await createClient();
  const [orgRes, role] = await Promise.all([
    supabase.from("orgs").select("id, name").eq("id", orgId).maybeSingle(),
    getMyRole(supabase, orgId, user.id),
  ]);
  if (!orgRes.data) notFound();

  const trail = [{ label: orgRes.data.name, href: `/painel/${orgId}` }, { label: "Tempo de produção" }];
  if (role !== "owner") {
    return (
      <div className="space-y-6">
        <PageHeader trail={trail} eyebrow="Indicadores" title="Tempo de produção" />
        <p className={ui.muted}>Só o dono da organização vê o tempo de produção.</p>
      </div>
    );
  }

  // A função confere de novo que é o dono (a permissão de verdade é do banco).
  const { data, error } = await supabase.rpc("production_stage_times", { p_org_id: orgId });
  return (
    <div className="space-y-6">
      <PageHeader
        trail={trail}
        eyebrow="Indicadores"
        title="Tempo de produção"
        description="Quanto tempo, em média, cada produto fica em cada estágio, e quanto leva da ideia à produção."
      />
      {error ? (
        <p className={ui.error} role="alert">
          Não foi possível calcular agora. Tente de novo em instantes.
        </p>
      ) : (
        <ProductionTimesView times={readProductionTimes(data ?? [])} />
      )}
    </div>
  );
}
