import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loading, NotConfigured, PageHeader } from "@/components/page-shell";
import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { canEditProducts, getMyRole, getOrgPlan } from "@/lib/org-access";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { FabricEditForm } from "../fabric-form";

type Params = PageProps<"/painel/[orgId]/tecidos/[fabricId]">["params"];

export default function TecidoPage({ params }: PageProps<"/painel/[orgId]/tecidos/[fabricId]">) {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Abrindo o tecido…" />}>
      <Tecido params={params} />
    </Suspense>
  );
}

async function Tecido({ params }: { params: Params }) {
  const { orgId, fabricId } = await params;
  if (!isUuid(orgId) || !isUuid(fabricId)) notFound();
  const user = await requireUser(`/painel/${orgId}/tecidos/${fabricId}`);
  const supabase = await createClient();
  const [fabricRes, role, plan] = await Promise.all([
    supabase
      .from("fabrics")
      .select("id, name, composition, width_mm, weight_gsm, price_cents, price_per_kg_cents, shrinkage_warp_pct, shrinkage_weft_pct, preset, stretch_pct, drape, thickness_mm, texture, texture_cm")
      .eq("id", fabricId)
      .eq("org_id", orgId)
      .maybeSingle(),
    getMyRole(supabase, orgId, user.id),
    getOrgPlan(supabase, orgId),
  ]);
  const fabric = fabricRes.data;
  if (!fabric) notFound();
  return (
    <div className="space-y-8">
      <PageHeader
        trail={[{ label: "Tecidos", href: `/painel/${orgId}/tecidos` }, { label: fabric.name }]}
        eyebrow="Tecido"
        title={fabric.name}
        description="Os dados técnicos entram no consumo e no custo da ficha; o comportamento e a foto, na Prova 3D."
      />
      <section className={`rounded-2xl border border-tinta/10 bg-white p-6`}>
        <FabricEditForm orgId={orgId} fabric={fabric} canEdit={canEditProducts(role, plan)} />
      </section>
    </div>
  );
}
