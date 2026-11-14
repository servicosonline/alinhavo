import { migratePattern, validatePattern } from "@alinhavo/geometry";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loading, NotConfigured } from "@/components/page-shell";
import { ui } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { measurementsBySize } from "@/lib/prova/measurements";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { ProvaPainel } from "./prova-painel";

type Params = PageProps<"/painel/[orgId]/moldes/[patternId]/prova">["params"];

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
  await requireUser(`/painel/${orgId}/moldes/${patternId}/prova`);
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

  const [versionRes, chartRes] = await Promise.all([
    supabase
      .from("pattern_versions")
      .select("document")
      .eq("pattern_id", pattern.id)
      .eq("number", pattern.current_version)
      .maybeSingle(),
    pattern.size_chart_id
      ? supabase.from("size_charts").select("id, name").eq("id", pattern.size_chart_id).eq("org_id", orgId).maybeSingle()
      : Promise.resolve({ data: null }),
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

  return (
    // Como o editor, a Prova sai da coluna estreita do painel e usa a largura da tela.
    <div className="relative left-1/2 w-[min(100vw-2rem,90rem)] -translate-x-1/2 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <Link href={back} className="text-sm text-tinta-suave hover:text-tinta">
            ← Voltar ao molde
          </Link>
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
              <Link href={back} className="underline">
                Ligar uma tabela
              </Link>
            </>
          )}
        </p>
      </div>
      <ProvaPainel patternId={pattern.id} version={pattern.current_version} savedDoc={doc} measurementsBySize={measurements.bySize} />
    </div>
  );
}
