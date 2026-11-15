import { migratePattern, validatePattern } from "@alinhavo/geometry";
import Link from "next/link";
import { LogEvent } from "@/components/log-event";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loading, NotConfigured, Trail } from "@/components/page-shell";
import { ui } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { canEditPatterns, canEditProducts, getMyRole } from "@/lib/org-access";
import { currentVersionsFilter, LOOK_OPTIONS_MAX, lookOptionsFrom } from "@/lib/prova/look-options";
import { measurementsBySize } from "@/lib/prova/measurements";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { ProvaPainel } from "./prova-painel";

type Params = PageProps<"/painel/[orgId]/moldes/[patternId]/prova">["params"];

// A foto de catálogo por IA (Server Action desta página) leva até ~2 min.
export const maxDuration = 300;

export default function ProvaPage({ params }: PageProps<"/painel/[orgId]/moldes/[patternId]/prova">) {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Abrindo a Prova…" />}>
      <Prova params={params} />
    </Suspense>
  );
}

async function Prova({ params }: { params: Params }) {
  const { orgId, patternId } = await params;
  if (!isUuid(orgId) || !isUuid(patternId)) notFound();
  const user = await requireUser(`/painel/${orgId}/moldes/${patternId}/prova`);
  // Cliente com a sessão do usuário: tudo abaixo passa pela RLS.
  const supabase = await createClient();

  const { data: pattern } = await supabase
    .from("patterns")
    .select("id, name, current_version, size_chart_id")
    .eq("id", patternId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (!pattern) notFound();
  const back = `/painel/${orgId}/moldes/${pattern.id}`;

  if (pattern.current_version === 0) {
    return (
      <div className="space-y-3">
        <Link href={back} className="text-sm text-tinta-suave hover:text-tinta">
          ← Voltar ao molde
        </Link>
        <p className={ui.error} role="alert">
          Este molde ainda não tem versão salva. Abra o editor e use o botão Provar, ou salve uma versão.
        </p>
      </div>
    );
  }

  const [versionRes, chartRes, role, othersRes, productRes, photosRes] = await Promise.all([
    supabase.from("pattern_versions").select("document").eq("pattern_id", pattern.id).eq("number", pattern.current_version).maybeSingle(),
    pattern.size_chart_id
      ? supabase.from("size_charts").select("id, name").eq("id", pattern.size_chart_id).eq("org_id", orgId).maybeSingle()
      : Promise.resolve({ data: null }),
    getMyRole(supabase, orgId, user.id),
    // Look: os outros moldes da organização com versão salva, os mais recentes primeiro.
    supabase
      .from("patterns")
      .select("id, name, current_version")
      .eq("org_id", orgId)
      .neq("id", pattern.id)
      .is("archived_at", null)
      .gt("current_version", 0)
      .order("updated_at", { ascending: false })
      .limit(LOOK_OPTIONS_MAX),
    // Fotos de catálogo: o produto ligado a este molde (um por molde) e o uso do mês.
    supabase.from("products").select("id, name").eq("org_id", orgId).eq("pattern_id", pattern.id).maybeSingle(),
    supabase.rpc("ai_generations_this_month", { p_org_id: orgId, p_kind: "foto_catalogo" }),
  ]);
  const doc = migratePattern(versionRes.data?.document);
  if (!doc || validatePattern(doc).length > 0) {
    return (
      <p className={ui.error} role="alert">
        A versão {pattern.current_version} deste molde não pôde ser lida. Nada foi alterado.
      </p>
    );
  }

  const chart = chartRes.data;
  const { data: chartSizes } = chart
    ? await supabase.from("sizes").select("id, label").eq("size_chart_id", chart.id).eq("org_id", orgId)
    : { data: [] as { id: string; label: string }[] };
  const sizeIds = (chartSizes ?? []).map((s) => s.id);
  const { data: rows } = sizeIds.length
    ? await supabase.from("measurements").select("size_id, name, value_mm").in("size_id", sizeIds).eq("org_id", orgId)
    : { data: [] as { size_id: string; name: string; value_mm: number }[] };
  const measurements = measurementsBySize(doc.sizes, chartSizes ?? [], rows ?? []);

  // Só a versão atual de cada um, numa consulta (pela RLS, como o resto).
  const others = othersRes.data ?? [];
  const { data: otherVersions } = others.length
    ? await supabase.from("pattern_versions").select("pattern_id, number, document").eq("org_id", orgId).or(currentVersionsFilter(others))
    : { data: [] as { pattern_id: string; number: number; document: unknown }[] };
  const lookOptions = lookOptionsFrom(others, otherVersions ?? []);

  // Só a informação de que há chave (nunca a chave) vai para a tela.
  const product = productRes.data;
  const catalog = product
    ? {
        productId: product.id,
        productName: product.name,
        usedThisMonth: photosRes.data ?? 0,
        blocked: !canEditProducts(role)
          ? "Só donos, admins, modelistas e estilistas geram fotos do produto."
          : !process.env.OPENAI_API_KEY?.trim()
            ? "As fotos por IA ainda não foram configuradas neste ambiente."
            : null,
      }
    : null;

  return (
    // Como o editor, a Prova usa a largura da tela (data-largura, ver Container).
    <div className="space-y-3" data-largura="tela">
      <LogEvent orgId={orgId} action="prova_aberta" entityId={pattern.id} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <Trail
            items={[
              { label: "Moldes", href: `/painel/${orgId}/moldes` },
              { label: pattern.name, href: back },
              { label: "Prova 3D" },
            ]}
          />
          <h1 className="font-display text-2xl font-semibold tracking-tight">Prova: {pattern.name}</h1>
        </div>
        <p className="text-xs text-tinta-suave">
          {chart ? (
            <>
              Medidas da tabela <strong>{chart.name}</strong>
              {measurements.missing.length > 0 && ` (sem medidas para ${measurements.missing.join(", ")}: o corpo estima)`}
            </>
          ) : (
            <>
              Sem tabela de medidas: o corpo usa medidas estimadas.{" "}
              <Link href={back} className={ui.link}>
                Ligar uma tabela
              </Link>
            </>
          )}
        </p>
      </div>
      <ProvaPainel
        orgId={orgId}
        canEdit={canEditPatterns(role)}
        patternId={pattern.id}
        version={pattern.current_version}
        savedDoc={doc}
        measurementsBySize={measurements.bySize}
        lookOptions={lookOptions}
        catalog={catalog}
      />
    </div>
  );
}
