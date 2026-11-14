import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loading, NotConfigured } from "@/components/page-shell";
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

const PRESET_LABEL: Record<string, string> = { planoLeve: "Plano leve", malha: "Malha", jeans: "Jeans" };

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
    supabase.from("fabrics").select("id, name, composition, width_mm, weight_gsm, price_cents, preset").eq("org_id", orgId).order("name"),
  ]);
  if (!orgRes.data) notFound();
  const fabrics = fabRes.data ?? [];
  const canEdit = canEditProducts(role);

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/painel/${orgId}`} className="text-sm text-tinta-suave hover:text-tinta">
          ← {orgRes.data.name}
        </Link>
        <h1 className={`mt-2 ${ui.h1}`}>Tecidos</h1>
        <p className={`mt-1 ${ui.muted}`}>Largura, gramatura e preço entram no consumo e no custo da ficha técnica.</p>
      </div>
      {canEdit && (
        <div className={ui.card}>
          <FabricForm orgId={orgId} />
        </div>
      )}
      {fabrics.length === 0 ? (
        <p className={ui.muted}>Nenhum tecido cadastrado ainda.</p>
      ) : (
        <ul className="divide-y divide-tinta/10 overflow-hidden rounded-lg border border-tinta/15 bg-white/70" data-fabrics>
          {fabrics.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <span>
                <span className="font-medium">{f.name}</span>
                {f.composition && <span className="text-tinta-suave"> · {f.composition}</span>}
                <span className="block text-xs text-tinta-suave">
                  {[
                    f.width_mm && `largura ${formatCm(f.width_mm)} cm`,
                    f.weight_gsm && `${String(f.weight_gsm).replace(".", ",")} g/m²`,
                    f.price_cents != null && `${formatMoney(f.price_cents)}/m`,
                    f.preset && `Prova: ${PRESET_LABEL[f.preset]}`,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "sem dados técnicos"}
                </span>
              </span>
              {canEdit && (
                <form action={deleteFabric}>
                  <input type="hidden" name="orgId" value={orgId} />
                  <input type="hidden" name="fabricId" value={f.id} />
                  <SubmitButton variant="ghost" pendingText="…">
                    Apagar
                  </SubmitButton>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
