import { emptyDocument, validatePattern, type PatternDocument } from "@alinhavo/geometry";
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
import { SubmitButton } from "@/components/submit-button";
import { linkSizeChart } from "../actions";
import { EditorClient } from "./editor-client";

type Params = PageProps<"/painel/[orgId]/moldes/[patternId]">["params"];

export default function MoldePage({ params }: PageProps<"/painel/[orgId]/moldes/[patternId]">) {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Abrindo molde…" />}>
      <Molde params={params} />
    </Suspense>
  );
}

async function Molde({ params }: { params: Params }) {
  const { orgId, patternId } = await params;
  if (!isUuid(orgId) || !isUuid(patternId)) notFound();
  const user = await requireUser(`/painel/${orgId}/moldes/${patternId}`);
  const supabase = await createClient();

  const [patternRes, role, chartsRes] = await Promise.all([
    supabase
      .from("patterns")
      .select("id, name, current_version, size_chart_id")
      .eq("id", patternId)
      .eq("org_id", orgId)
      .maybeSingle(),
    getMyRole(supabase, orgId, user.id),
    supabase.from("size_charts").select("id, name, sizes(label, position, is_base)").eq("org_id", orgId).order("name"),
  ]);
  const pattern = patternRes.data;
  if (!pattern) notFound();
  const charts = chartsRes.data ?? [];
  const linked = charts.find((c) => c.id === pattern.size_chart_id);
  const linkedSizes = linked ? [...linked.sizes].sort((a, b) => a.position - b.position) : [];
  const chartGrade =
    linked && linkedSizes.length
      ? {
          name: linked.name,
          sizes: linkedSizes.map((s) => s.label),
          baseSize: linkedSizes.find((s) => s.is_base)?.label ?? null,
        }
      : null;
  const canEdit = canEditPatterns(role);

  let document: PatternDocument = emptyDocument();
  if (pattern.current_version > 0) {
    const { data: version } = await supabase
      .from("pattern_versions")
      .select("document")
      .eq("pattern_id", pattern.id)
      .eq("number", pattern.current_version)
      .maybeSingle();
    const doc = version?.document as unknown as PatternDocument | undefined;
    // Documento corrompido não abre no editor: melhor avisar do que salvar por cima.
    if (!doc || validatePattern(doc).length > 0) {
      return (
        <p className={ui.error} role="alert">
          A versão {pattern.current_version} deste molde não pôde ser lida. Nada foi alterado.
        </p>
      );
    }
    document = doc;
  }

  return (
    // O painel é estreito (bom para formulários); o editor sai da coluna e usa a largura da tela.
    <div className="relative left-1/2 w-[min(100vw-2rem,90rem)] -translate-x-1/2 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/painel/${orgId}/moldes`} className="text-sm text-tinta-suave hover:text-tinta">
          ← Moldes
        </Link>
        {canEdit ? (
          <form action={linkSizeChart} className="flex items-center gap-2 text-sm">
            <input type="hidden" name="orgId" value={orgId} />
            <input type="hidden" name="patternId" value={pattern.id} />
            <label htmlFor="chart" className="text-tinta-suave">
              Tabela de medidas
            </label>
            <select
              id="chart"
              name="chartId"
              defaultValue={pattern.size_chart_id ?? ""}
              className="rounded-md border border-tinta/20 bg-white px-2 py-1.5"
            >
              <option value="">Nenhuma</option>
              {charts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <SubmitButton variant="ghost" pendingText="Ligando…">
              Ligar
            </SubmitButton>
          </form>
        ) : (
          linked && <span className="text-sm text-tinta-suave">Tabela: {linked.name}</span>
        )}
      </div>
      <EditorClient
        orgId={orgId}
        patternId={pattern.id}
        name={pattern.name}
        initialVersion={pattern.current_version}
        initialDocument={document}
        readOnly={!canEdit}
        chartGrade={chartGrade}
      />
    </div>
  );
}
