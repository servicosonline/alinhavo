import { FABRIC_PRESETS, FABRICS } from "@alinhavo/cloth";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EmptyState, Loading, NotConfigured, PageHeader } from "@/components/page-shell";
import { SubmitButton } from "@/components/submit-button";
import { ui } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { formatMoney } from "@/lib/money";
import { canEditProducts, getMyRole } from "@/lib/org-access";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { formatCm } from "@/lib/units";
import { deleteFabric } from "./actions";
import { FabricForm } from "./fabric-form";

const PRESET_LABEL: Record<string, string> = Object.fromEntries(FABRIC_PRESETS.map((id) => [id, FABRICS[id].name]));

export default function TecidosPage({ params }: PageProps<"/painel/[orgId]/tecidos">) {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Carregando tecidos…" />}>
      <Tecidos params={params} />
    </Suspense>
  );
}

async function Tecidos({ params }: { params: PageProps<"/painel/[orgId]/tecidos">["params"] }) {
  const { orgId } = await params;
  if (!isUuid(orgId)) notFound();
  const user = await requireUser(`/painel/${orgId}/tecidos`);
  const supabase = await createClient();
  const [orgRes, role, fabRes] = await Promise.all([
    supabase.from("orgs").select("name").eq("id", orgId).maybeSingle(),
    getMyRole(supabase, orgId, user.id),
    // Sem a foto (pesada): a lista só diz se tem.
    supabase
      .from("fabrics")
      .select("id, name, composition, width_mm, weight_gsm, price_cents, preset, stretch_pct, drape, texture_cm")
      .eq("org_id", orgId)
      .order("name"),
  ]);
  if (!orgRes.data) notFound();
  const fabrics = fabRes.data ?? [];
  const canEdit = canEditProducts(role);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tecidos"
        description="Largura, gramatura e preço entram no consumo e no custo da ficha técnica."
      />
      {canEdit && (
        <section className={ui.card} aria-label="Novo tecido">
          <h2 className={`${ui.eyebrow} mb-4`}>Novo tecido</h2>
          <FabricForm orgId={orgId} />
        </section>
      )}
      {fabrics.length === 0 ? (
        <EmptyState icon="tecidos" title="Nenhum tecido cadastrado ainda">
          Com a largura útil e o preço por metro, a ficha técnica calcula o consumo e o custo de cada produto.
        </EmptyState>
      ) : (
        <ul className={ui.list} data-fabrics>
          {fabrics.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <span>
                <span className="font-display text-lg font-semibold">{f.name}</span>
                {f.composition && <span className="text-tinta-suave"> · {f.composition}</span>}
                <span className="mt-0.5 block font-mono text-[11px] text-tinta-suave">
                  {[
                    f.width_mm && `largura ${formatCm(f.width_mm)} cm`,
                    f.weight_gsm && `${String(f.weight_gsm).replace(".", ",")} g/m²`,
                    f.price_cents != null && `${formatMoney(f.price_cents)}/m`,
                    f.preset && `Prova: ${PRESET_LABEL[f.preset] ?? f.preset}`,
                    f.stretch_pct != null && `estica ${String(f.stretch_pct).replace(".", ",")}%`,
                    f.texture_cm != null && "com foto",
                  ]
                    .filter(Boolean)
                    .join(" · ") || "sem dados técnicos"}
                </span>
              </span>
              <span className="flex items-center gap-2">
              <Link href={`/painel/${orgId}/tecidos/${f.id}`} className={ui.buttonGhost} data-fabric-edit>
                {canEdit ? "Editar" : "Ver"}
              </Link>
              {canEdit && (
                <form action={deleteFabric}>
                  <input type="hidden" name="orgId" value={orgId} />
                  <input type="hidden" name="fabricId" value={f.id} />
                  <SubmitButton variant="ghost" pendingText="…">
                    Apagar
                  </SubmitButton>
                </form>
              )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
