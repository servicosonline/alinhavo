import { emptyDocument, migratePattern, validatePattern, type PatternDocument } from "@alinhavo/geometry";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loading, NotConfigured, Trail } from "@/components/page-shell";
import { ui } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { canEditPatterns, getMyRole } from "@/lib/org-access";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { SubmitButton } from "@/components/submit-button";
import { linkSizeChart } from "../actions";
import { ApprovalsList } from "./approvals-list";
import { EditorClient } from "./editor-client";
import type { EditorRailItem } from "@/components/editor/pattern-editor";

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

  const [patternRes, role, chartsRes, productRes] = await Promise.all([
    supabase
      .from("patterns")
      .select("id, name, current_version, size_chart_id")
      .eq("id", patternId)
      .eq("org_id", orgId)
      .maybeSingle(),
    getMyRole(supabase, orgId, user.id),
    supabase.from("size_charts").select("id, name, sizes(id, label, position, is_base)").eq("org_id", orgId).order("name"),
    // O produto ligado a este molde (um por molde), para a trilha "Coleção › Produto › Molde"
    // e a composição do tecido dele (etiqueta de composição pronta nos acabamentos).
    supabase.from("products").select("id, name, collection_id, collections(name), fabrics(composition)").eq("org_id", orgId).eq("pattern_id", patternId).maybeSingle(),
  ]);
  const pattern = patternRes.data;
  if (!pattern) notFound();
  const product = productRes.data;
  const base = `/painel/${orgId}`;
  const trail = (
    <Trail
      items={[
        ...(product
          ? [
              ...(product.collection_id ? [{ label: product.collections?.name ?? "Coleção", href: `${base}/colecoes/${product.collection_id}` }] : []),
              { label: product.name, href: `${base}/produtos/${product.id}` },
            ]
          : [{ label: "Moldes", href: `${base}/moldes` }]),
        { label: "Molde" },
      ]}
    />
  );
  const rail: EditorRailItem[] = [
    { icon: "moldes", label: "Molde", active: true },
    ...(pattern.current_version > 0 ? [{ icon: "prova" as const, label: "Prova 3D", href: `${base}/moldes/${patternId}/prova` }] : []),
    { icon: "encaixes", label: "Encaixe", href: product ? `${base}/produtos/${product.id}/encaixe` : `${base}/encaixes` },
    { icon: "colecoes", label: "Coleção", href: product?.collection_id ? `${base}/colecoes/${product.collection_id}` : `${base}/colecoes` },
  ];
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
  // Medidas da tabela ligada, para a Prova ao lado do editor (os tamanhos do molde mudam na tela: casar fica lá).
  const { data: measurementRows } = linkedSizes.length
    ? await supabase
        .from("measurements")
        .select("size_id, name, value_mm")
        .in(
          "size_id",
          linkedSizes.map((s) => s.id),
        )
        .eq("org_id", orgId)
    : { data: [] as { size_id: string; name: string; value_mm: number }[] };
  const chartMeasurements = { sizes: linkedSizes.map((s) => ({ id: s.id, label: s.label })), rows: measurementRows ?? [] };

  let document: PatternDocument = emptyDocument();
  if (pattern.current_version > 0) {
    const { data: version } = await supabase
      .from("pattern_versions")
      .select("document")
      .eq("pattern_id", pattern.id)
      .eq("number", pattern.current_version)
      .maybeSingle();
    // Versões antigas (formato 1) são convertidas só na leitura; a gravada não muda.
    const doc = migratePattern(version?.document);
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
    // O editor usa a largura da tela (data-largura, ver Container).
    <div className="space-y-3" data-largura="tela">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-tinta-suave">Molde da organização · as versões ficam salvas, nada é sobrescrito.</p>
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
        trail={trail}
        rail={rail}
        approvalHref={canEdit ? `${base}/moldes/${patternId}/prova` : undefined}
        chartGrade={chartGrade}
        chartMeasurements={chartMeasurements}
        fabricComposition={product?.fabrics?.composition ?? null}
      />
      <ApprovalsList supabase={supabase} orgId={orgId} patternId={pattern.id} canEdit={canEdit} />
    </div>
  );
}
