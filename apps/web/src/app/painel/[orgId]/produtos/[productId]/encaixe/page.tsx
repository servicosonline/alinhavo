import { migratePattern, validatePattern } from "@alinhavo/geometry";
import { readMarkerLayout } from "@alinhavo/nesting";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EncaixeStudio } from "@/components/encaixe/encaixe-studio";
import { MarkerDownloads } from "@/components/encaixe/marker-downloads";
import { MarkerView } from "@/components/encaixe/marker-view";
import { fileSlug } from "@/lib/file-slug";
import { Loading, NotConfigured, PageHeader } from "@/components/page-shell";
import { SubmitButton } from "@/components/submit-button";
import { ui } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { DEFAULT_WIDTH_MM, formatDemand, formatEfficiency, formatMeters, formatPerGarment } from "@/lib/encaixe/marker";
import { isUuid } from "@/lib/ids";
import { PlanLock } from "@/components/plan-lock";
import { canNest, getMyRole, getOrgPlan } from "@/lib/org-access";
import { planAllows } from "@/lib/plans";
import { formatDate } from "@/lib/prova/approval";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { formatCm } from "@/lib/units";
import { deleteMarker } from "./actions";

type Props = PageProps<"/painel/[orgId]/produtos/[productId]/encaixe">;

export default function EncaixePage({ params, searchParams }: Props) {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Abrindo o encaixe…" />}>
      <Encaixe params={params} searchParams={searchParams} />
    </Suspense>
  );
}

/** Encaixe do produto: novo risco (calculado no navegador) e os riscos salvos. */
async function Encaixe({ params, searchParams }: Pick<Props, "params" | "searchParams">) {
  const { orgId, productId } = await params;
  if (!isUuid(orgId) || !isUuid(productId)) notFound();
  const { risco } = await searchParams;
  const selected = typeof risco === "string" && /^\d{1,6}$/.test(risco) ? Number(risco) : null;
  const productHref = `/painel/${orgId}/produtos/${productId}`;
  const user = await requireUser(`${productHref}/encaixe`);
  // Cliente com a sessão do usuário: tudo abaixo passa pela RLS.
  const supabase = await createClient();

  const [prodRes, role, plan] = await Promise.all([
    supabase.from("products").select("id, reference, name, pattern_id, fabric_id").eq("id", productId).eq("org_id", orgId).maybeSingle(),
    getMyRole(supabase, orgId, user.id),
    getOrgPlan(supabase, orgId),
  ]);
  const p = prodRes.data;
  if (!p) notFound();
  const canEdit = canNest(role, plan);

  const [patRes, fabRes, markersRes] = await Promise.all([
    p.pattern_id
      ? supabase.from("patterns").select("id, name, current_version").eq("id", p.pattern_id).eq("org_id", orgId).maybeSingle()
      : Promise.resolve({ data: null }),
    p.fabric_id ? supabase.from("fabrics").select("name, width_mm").eq("id", p.fabric_id).eq("org_id", orgId).maybeSingle() : Promise.resolve({ data: null }),
    supabase
      .from("markers")
      .select("id, number, pattern_version, width_mm, demand, length_mm, efficiency, created_at")
      .eq("product_id", p.id)
      .eq("org_id", orgId)
      .order("number", { ascending: false })
      .limit(20),
  ]);
  const pattern = patRes.data;
  const fabric = fabRes.data;
  const markers = markersRes.data ?? [];

  let problem: string | null = null;
  let doc = null;
  if (!pattern) problem = "Ligue um molde ao produto para encaixar.";
  else if (pattern.current_version === 0) problem = "O molde ligado ainda não tem versão salva.";
  else {
    const { data: v } = await supabase.from("pattern_versions").select("document").eq("pattern_id", pattern.id).eq("number", pattern.current_version).maybeSingle();
    doc = migratePattern(v?.document);
    if (!doc || validatePattern(doc).length > 0) {
      doc = null;
      problem = `A versão ${pattern.current_version} do molde não pôde ser lida. Nada foi alterado.`;
    }
  }

  const chosen = selected !== null ? markers.find((m) => m.number === selected) : undefined;
  const { data: chosenRow } = chosen ? await supabase.from("markers").select("layout").eq("id", chosen.id).maybeSingle() : { data: null };
  const chosenLayout = readMarkerLayout(chosenRow?.layout);
  // Ordem da grade atual; tamanhos de versões antigas que saíram da grade vão no fim.
  const gradeSizes = doc?.sizes ?? [];
  const sizesFor = (demand: Record<string, number>) => [...gradeSizes, ...Object.keys(demand).filter((s) => !gradeSizes.includes(s))];

  return (
    <div className="space-y-6" data-largura="tela">
      <div className="space-y-2">
        <PageHeader
          trail={[
            { label: "Coleções", href: `/painel/${orgId}/colecoes` },
            { label: p.reference ? `${p.reference} · ${p.name}` : p.name, href: productHref },
            { label: "Encaixe" },
          ]}
          title="Encaixe"
          stitch={false}
        />
        <p className={ui.muted}>
          {pattern ? (
            <>
              Molde {pattern.name}, versão {pattern.current_version}.{" "}
            </>
          ) : null}
          {fabric ? (
            <>
              Tecido {fabric.name}
              {fabric.width_mm ? `, ${formatCm(fabric.width_mm)} cm de largura útil.` : " (sem largura útil cadastrada)."}
            </>
          ) : (
            "Sem tecido ligado: informe a largura abaixo."
          )}
        </p>
      </div>

      {!planAllows(plan, "encaixe") ? (
        <PlanLock feature="encaixe" />
      ) : problem || !doc || !pattern ? (
        <p className={ui.error} role="alert">
          {problem}
        </p>
      ) : (
        <EncaixeStudio
          orgId={orgId}
          productId={p.id}
          version={pattern.current_version}
          doc={doc}
          defaultWidthMm={fabric?.width_mm ?? DEFAULT_WIDTH_MM}
          canSave={canEdit}
        />
      )}

      {chosen && chosenLayout && (
        <section className={`${ui.card} space-y-3`} aria-labelledby="risco-salvo" data-section="risco-salvo">
          <h2 id="risco-salvo" className={ui.h2}>
            Risco nº {chosen.number}
          </h2>
          <p className="text-sm">
            Molde versão {chosen.pattern_version} · {formatCm(chosen.width_mm)} cm de largura · {formatMeters(Number(chosen.length_mm))} ·{" "}
            {formatEfficiency(Number(chosen.efficiency))} de aproveitamento
            {chosenLayout.oneWay && " · tecido com sentido"}
          </p>
          <MarkerView layout={chosenLayout} sizes={sizesFor(chosenLayout.demand)} />
          <MarkerDownloads
            layout={chosenLayout}
            fileBase={`risco-${fileSlug(p.reference ?? p.name)}-${chosen.number}`}
            title={`${p.reference ? `${p.reference} - ` : ""}${p.name} - risco ${chosen.number}`}
          />
        </section>
      )}

      <section className={`${ui.card} space-y-3`} aria-labelledby="riscos" data-section="riscos">
        <h2 id="riscos" className={ui.h2}>
          Riscos salvos
        </h2>
        {markers.length === 0 ? (
          <p className={ui.muted}>Nenhum risco salvo ainda.</p>
        ) : (
          <ul className="divide-y divide-tinta/10 text-sm" data-markers>
            {markers.map((m) => {
              const demand = m.demand as Record<string, number>;
              return (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2" data-marker-number={m.number}>
                  <span>
                    <Link href={`?risco=${m.number}`} className="font-semibold underline">
                      Nº {m.number}
                    </Link>{" "}
                    · {formatMeters(Number(m.length_mm))} · {formatEfficiency(Number(m.efficiency))} · {formatCm(m.width_mm)} cm
                    <span className="block text-xs text-tinta-suave">
                      {formatDemand(sizesFor(demand), demand)} · {formatPerGarment(Number(m.length_mm), demand)} por peça · molde versão{" "}
                      {m.pattern_version}
                      {pattern && m.pattern_version !== pattern.current_version && " (antiga)"} · {formatDate(m.created_at)}
                    </span>
                  </span>
                  {canEdit && (
                    <form action={deleteMarker}>
                      <input type="hidden" name="orgId" value={orgId} />
                      <input type="hidden" name="productId" value={p.id} />
                      <input type="hidden" name="markerId" value={m.id} />
                      <SubmitButton variant="ghost" pendingText="…">
                        Apagar
                      </SubmitButton>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
