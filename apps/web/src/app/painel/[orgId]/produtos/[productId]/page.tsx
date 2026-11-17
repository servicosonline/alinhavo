import { aiTextRoute } from "@/lib/ai/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loading, NotConfigured, PageHeader } from "@/components/page-shell";
import { SubmitButton } from "@/components/submit-button";
import { ui } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatDay, PRODUCT_STATUS_LABEL, PRODUCT_STATUSES, productDueState, suggestApproved, todayInBrazil } from "@/lib/collection";
import { isUuid } from "@/lib/ids";
import { canEditPatterns, canEditProducts, canNest, getMyRole, getOrgPlan } from "@/lib/org-access";
import { PLAN_LOCK_TEXT, planAllows } from "@/lib/plans";
import { PlanLock } from "@/components/plan-lock";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { linkProductPattern, setProductDue, setProductStatus } from "../../colecoes/actions";
import { DueChip } from "../../colecoes/[collectionId]/products-view";
import { deleteTrim, setProductFabric } from "../actions";
import { DownloadTechPack, GenerateTechPack, TrimForm } from "./tech-pack-parts";
import { Comments } from "./comments";
import { ProductTexts } from "./product-texts";
import { CatalogPhotos } from "./catalog-photos";
import { FlatSketchView } from "@/components/flat-sketch-view";
import { ProductPhoto } from "./product-photo";
import { readFlatSketch } from "@alinhavo/export/flat-sketch";
import { consumptionSource, meters, money, type TechPackData } from "@alinhavo/export/tech-pack";
import { formatMoney } from "@/lib/money";
import { formatEfficiency, formatMeters, formatPerGarment } from "@/lib/encaixe/marker";
import { formatCm } from "@/lib/units";
import { formatDate } from "@/lib/prova/approval";
import { ApprovalsList } from "../../moldes/[patternId]/approvals-list";
import { TrackingShare } from "@/components/tracking-share";
import { activeTrackingLinks } from "../../tracking-links";

type Params = PageProps<"/painel/[orgId]/produtos/[productId]">["params"];

export default function ProdutoPage({ params }: PageProps<"/painel/[orgId]/produtos/[productId]">) {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Abrindo produto…" />}>
      <Produto params={params} />
    </Suspense>
  );
}

/** Produto: status, molde, tecido, aviamentos, fichas técnicas e as aprovações do molde. */
async function Produto({ params }: { params: Params }) {
  const { orgId, productId } = await params;
  if (!isUuid(orgId) || !isUuid(productId)) notFound();
  const back = `/painel/${orgId}/produtos/${productId}`;
  const user = await requireUser(back);
  const supabase = await createClient();

  const [prodRes, role, plan, patRes] = await Promise.all([
    supabase
      .from("products")
      .select("id, reference, name, status, pattern_id, fabric_id, collection_id, sales_description, technical_description, due_on, photo_path, updated_at, collections(name)")
      .eq("id", productId)
      .eq("org_id", orgId)
      .maybeSingle(),
    getMyRole(supabase, orgId, user.id),
    getOrgPlan(supabase, orgId),
    supabase.from("patterns").select("id, name, current_version").eq("org_id", orgId).is("archived_at", null).order("name"),
  ]);
  const p = prodRes.data;
  if (!p) notFound();
  const patterns = patRes.data ?? [];
  const pattern = patterns.find((m) => m.id === p.pattern_id) ?? null;
  const canEdit = canEditProducts(role, plan);
  const collection = p.collections as unknown as { name: string } | null;

  const { data: allLinks } = await supabase.from("products").select("id, pattern_id").eq("org_id", orgId).not("pattern_id", "is", null);
  const takenBy = new Map((allLinks ?? []).map((x) => [x.pattern_id!, x.id]));
  const { data: last } = pattern
    ? await supabase.from("approvals").select("status").eq("pattern_id", pattern.id).eq("org_id", orgId).order("created_at", { ascending: false }).limit(1)
    : { data: [] as { status: "pendente" | "aprovado" | "ajustes" }[] };
  const latest = last?.[0]?.status ?? null;
  const [tracking, { data: orgRow }] = await Promise.all([
    canEdit ? activeTrackingLinks(supabase, "produto", p.id) : Promise.resolve([]),
    supabase.from("orgs").select("name").eq("id", orgId).maybeSingle(),
  ]);
  const orgName = orgRow?.name ?? "";

  const [fabRes, trimRes, packRes, commentRes, teamRes, markerRes, aiRes, photoUseRes, textLimitRes, photoLimitRes] = await Promise.all([
    supabase.from("fabrics").select("id, name, width_mm, price_cents").eq("org_id", orgId).order("name"),
    supabase.from("product_trims").select("id, name, quantity, unit, unit_price_cents").eq("product_id", p.id).eq("org_id", orgId).order("position").order("created_at"),
    supabase.from("tech_packs").select("id, number, pattern_version, data, created_at").eq("product_id", p.id).eq("org_id", orgId).order("number", { ascending: false }).limit(10),
    supabase.from("comments").select("id, author, body, created_at").eq("product_id", p.id).eq("org_id", orgId).order("created_at").limit(200),
    supabase.rpc("org_team", { p_org_id: orgId }),
    supabase
      .from("markers")
      .select("number, pattern_version, width_mm, length_mm, efficiency, demand")
      .eq("product_id", p.id)
      .eq("org_id", orgId)
      .order("number", { ascending: false })
      .limit(1),
    supabase.rpc("ai_generations_this_month", { p_org_id: orgId }),
    supabase.rpc("ai_generations_this_month", { p_org_id: orgId, p_kind: "foto_catalogo" }),
    supabase.rpc("ai_limit_for", { p_org_id: orgId, p_kind: "textos_produto" }),
    supabase.rpc("ai_limit_for", { p_org_id: orgId, p_kind: "foto_catalogo" }),
  ]);
  // Só a informação de que há chave (nunca a chave) vai para a tela.
  const route = aiTextRoute();
  const aiReady = route.claude !== null || route.openai;
  const lastMarker = markerRes.data?.[0] ?? null;
  const names = Object.fromEntries((teamRes.data ?? []).map((m) => [m.user_id, m.email]));
  const fabrics = fabRes.data ?? [];
  const trims = trimRes.data ?? [];
  const packs = packRes.data ?? [];
  const fabric = fabrics.find((x) => x.id === p.fabric_id) ?? null;
  const fileBase = (p.reference ?? p.name).normalize("NFD").replace(/[^\w-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "produto";

  return (
    <div className="space-y-8">
      <PageHeader
        trail={[
          { label: "Coleções", href: `/painel/${orgId}/colecoes` },
          ...(p.collection_id ? [{ label: collection?.name ?? "Coleção", href: `/painel/${orgId}/colecoes/${p.collection_id}` }] : []),
          { label: p.name },
        ]}
        eyebrow={
          <span className="flex flex-wrap items-center gap-2">
            {p.reference && <span>{p.reference}</span>}
            <span className={ui.tag} data-product-status={p.status}>
              {PRODUCT_STATUS_LABEL[p.status]}
            </span>
            {p.due_on && (
              <DueChip due={{ label: formatDay(p.due_on), state: productDueState(p.due_on, p.status, todayInBrazil()) ?? "futura" }} />
            )}
          </span>
        }
        title={p.name}
        actions={
          canEdit ? (
            <TrackingShare orgId={orgId} kind="produto" targetId={p.id} title={p.name} orgName={orgName} back={back} links={tracking} />
          ) : undefined
        }
      />

      {!planAllows(plan, "colecao") && <PlanLock feature="colecao" />}

      {canEdit && suggestApproved(p.status, latest) && (
        <form action={setProductStatus} className={`${ui.success} flex flex-wrap items-center justify-between gap-2 text-sm`} data-suggest>
          <input type="hidden" name="orgId" value={orgId} />
          <input type="hidden" name="back" value={back} />
          <input type="hidden" name="productId" value={p.id} />
          <input type="hidden" name="status" value="aprovado" />
          <span>O cliente aprovou o molde. Marcar o produto como aprovado?</span>
          <SubmitButton variant="ghost" pendingText="Marcando…">
            Marcar como aprovado
          </SubmitButton>
        </form>
      )}

      <ProductPhoto orgId={orgId} productId={p.id} photoPath={p.photo_path} version={`${p.photo_path ?? ""}|${p.updated_at}`} canEdit={canEdit} />

      <section className={`${ui.card} space-y-4`} aria-label="Status e molde">
        {canEdit && (
          <form key={`status-${p.status}`} action={setProductStatus} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="orgId" value={orgId} />
            <input type="hidden" name="back" value={back} />
            <input type="hidden" name="productId" value={p.id} />
            <label className="block">
              <span className={ui.label}>Status</span>
              <select name="status" defaultValue={p.status} className={ui.input}>
                {PRODUCT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {PRODUCT_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
            <SubmitButton variant="ghost" pendingText="…">
              Mudar status
            </SubmitButton>
          </form>
        )}
        {canEdit && (
          <form key={`entrega-${p.due_on ?? ""}`} action={setProductDue} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="orgId" value={orgId} />
            <input type="hidden" name="back" value={back} />
            <input type="hidden" name="productId" value={p.id} />
            <label className="block">
              <span className={ui.label}>Data de entrega</span>
              <input name="due_on" type="date" defaultValue={p.due_on ?? ""} className={ui.input} />
            </label>
            <SubmitButton variant="ghost" pendingText="…">
              Salvar prazo
            </SubmitButton>
          </form>
        )}
        <div className="space-y-2">
          <p className="text-sm">
            {pattern ? (
              <>
                Molde:{" "}
                <Link href={`/painel/${orgId}/moldes/${pattern.id}`} className="underline">
                  {pattern.name}
                </Link>{" "}
                (versão {pattern.current_version})
              </>
            ) : (
              <span className="text-tinta-suave">Nenhum molde ligado a este produto.</span>
            )}
          </p>
          {canEdit && (
            <form key={`molde-${p.pattern_id ?? ""}`} action={linkProductPattern} className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="orgId" value={orgId} />
              <input type="hidden" name="back" value={back} />
              <input type="hidden" name="productId" value={p.id} />
              <label className="block">
                <span className={ui.label}>Ligar a um molde</span>
                <select name="patternId" defaultValue={p.pattern_id ?? ""} className={ui.input}>
                  <option value="">Sem molde</option>
                  {patterns
                    .filter((m) => !takenBy.has(m.id) || takenBy.get(m.id) === p.id)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                </select>
              </label>
              <SubmitButton variant="ghost" pendingText="…">
                Ligar
              </SubmitButton>
            </form>
          )}
          {!pattern && canEditPatterns(role) && (
            <p className="text-xs text-tinta-suave">
              Para começar um molde novo, crie em{" "}
              <Link href={`/painel/${orgId}/moldes`} className="underline">
                Moldes
              </Link>{" "}
              e ligue aqui.
            </p>
          )}
        </div>
      </section>

      <section className={`${ui.card} space-y-3`} aria-labelledby="textos" data-section="textos">
        <h2 id="textos" className={ui.h2}>
          Textos do produto
        </h2>
        <ProductTexts
          orgId={orgId}
          productId={p.id}
          sales={p.sales_description}
          technical={p.technical_description}
          canEdit={canEdit}
          aiReady={aiReady}
          usedThisMonth={aiRes.data ?? 0}
          monthlyLimit={textLimitRes.data ?? undefined}
        />
      </section>

      <CatalogPhotos
        supabase={supabase}
        orgId={orgId}
        productId={p.id}
        provaHref={pattern && pattern.current_version > 0 ? `/painel/${orgId}/moldes/${pattern.id}/prova` : null}
        canEdit={canEdit}
        usedThisMonth={photoUseRes.data ?? 0}
        monthlyLimit={photoLimitRes.data ?? undefined}
      />

      <section className={`${ui.card} space-y-3`} aria-labelledby="tecido" data-section="tecido">
        <h2 id="tecido" className={ui.h2}>
          Tecido
        </h2>
        <p className="text-sm">
          {fabric ? (
            <>
              <strong>{fabric.name}</strong>
              {!fabric.width_mm && <span className="text-tinta-suave"> · sem largura útil: a ficha não calcula metros</span>}
            </>
          ) : (
            <span className="text-tinta-suave">Nenhum tecido ligado.</span>
          )}
        </p>
        {canEdit && (
          <form key={`tecido-${p.fabric_id ?? ""}`} action={setProductFabric} className="flex flex-wrap items-end gap-2">
            <input type="hidden" name="orgId" value={orgId} />
            <input type="hidden" name="productId" value={p.id} />
            <label className="block">
              <span className={ui.label}>Tecido principal</span>
              <select name="fabricId" defaultValue={p.fabric_id ?? ""} className={ui.input}>
                <option value="">Nenhum</option>
                {fabrics.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </label>
            <SubmitButton variant="ghost" pendingText="…">
              Ligar tecido
            </SubmitButton>
            <Link href={`/painel/${orgId}/tecidos`} className="pb-2 text-xs text-tinta-suave underline">
              Cadastrar tecidos
            </Link>
          </form>
        )}
      </section>

      <section className={`${ui.card} space-y-3`} aria-labelledby="aviamentos" data-section="aviamentos">
        <h2 id="aviamentos" className={ui.h2}>
          Aviamentos
        </h2>
        {trims.length === 0 ? (
          <p className={ui.muted}>Nenhum aviamento ainda.</p>
        ) : (
          <ul className="divide-y divide-tinta/10 text-sm" data-trims>
            {trims.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  {t.name} · {String(t.quantity).replace(".", ",")} {t.unit}
                  {t.unit_price_cents != null && <span className="text-tinta-suave"> · {formatMoney(t.unit_price_cents)} cada</span>}
                </span>
                {canEdit && (
                  <form action={deleteTrim}>
                    <input type="hidden" name="orgId" value={orgId} />
                    <input type="hidden" name="productId" value={p.id} />
                    <input type="hidden" name="trimId" value={t.id} />
                    <SubmitButton variant="ghost" pendingText="…">
                      Tirar
                    </SubmitButton>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
        {canEdit && <TrimForm orgId={orgId} productId={p.id} />}
      </section>

      <section className={`${ui.card} space-y-3`} aria-labelledby="encaixe" data-section="encaixe">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="encaixe" className={ui.h2}>
            Encaixe
          </h2>
          <Link href={`${back}/encaixe`} className={ui.buttonGhost}>
            {lastMarker || !canNest(role, plan) ? "Abrir encaixe" : "Encaixar"}
          </Link>
        </div>
        {lastMarker ? (
          <p className="text-sm" data-last-marker={lastMarker.number}>
            Último risco: <strong>nº {lastMarker.number}</strong> · {formatMeters(Number(lastMarker.length_mm))} em {formatCm(lastMarker.width_mm)} cm ·{" "}
            {formatEfficiency(Number(lastMarker.efficiency))} de aproveitamento ·{" "}
            {formatPerGarment(Number(lastMarker.length_mm), lastMarker.demand as Record<string, number>)} por peça
            {pattern && lastMarker.pattern_version !== pattern.current_version && (
              <span className="text-tinta-suave"> · feito na versão {lastMarker.pattern_version} do molde</span>
            )}
          </p>
        ) : (
          <p className={ui.muted}>Nenhum risco salvo. O encaixe distribui as peças da grade na largura do tecido e mede o consumo real.</p>
        )}
      </section>

      <section className={`${ui.card} space-y-3`} aria-labelledby="ficha" data-section="ficha">
        <h2 id="ficha" className={ui.h2}>
          Ficha técnica
        </h2>
        <p className="text-xs text-tinta-suave">
          Gerada da versão atual do molde, do tecido e dos aviamentos. O consumo de tecido vem do último risco do Encaixe nessa versão do molde e na largura do tecido; sem risco, é uma estimativa pela área das peças.
        </p>
        {canEdit && (
          <GenerateTechPack
            orgId={orgId}
            productId={p.id}
            disabledReason={!pattern ? "Ligue um molde para gerar a ficha." : pattern.current_version === 0 ? "Salve uma versão do molde para gerar a ficha." : null}
          />
        )}
        {(() => {
          // Desenho técnico da ficha mais recente (fichas antigas não têm).
          const latestSketch = packs[0] ? readFlatSketch((packs[0].data as unknown as TechPackData).sketch) : null;
          return latestSketch && latestSketch.views.length > 0 ? (
            <div className="rounded-md border border-tinta/10 bg-papel/40 p-3">
              <p className="mb-2 text-xs font-medium">Desenho técnico (ficha nº {packs[0]!.number})</p>
              <FlatSketchView sketch={latestSketch} />
            </div>
          ) : null;
        })()}
        {packs.length === 0 ? (
          <p className={ui.muted}>Nenhuma ficha gerada ainda.</p>
        ) : (
          <ul className="divide-y divide-tinta/10 text-sm" data-packs>
            {packs.map((pk) => {
              const d = pk.data as unknown as TechPackData;
              const base = d.pattern?.baseSize;
              const c = base ? d.consumption?.bySize?.[base] : undefined;
              return (
                <li key={pk.id} className="flex flex-wrap items-center justify-between gap-2 py-2" data-pack={pk.number}>
                  <span>
                    <strong>Nº {pk.number}</strong> · molde versão {pk.pattern_version} · {formatDate(pk.created_at)}
                    {c && (
                      <span className="block text-xs text-tinta-suave">
                        Tamanho {base}: {meters(c.meters)} de tecido ({consumptionSource(d.consumption)}) · material {money(d.materialCentsBySize?.[base!] ?? null)}
                      </span>
                    )}
                  </span>
                  <DownloadTechPack data={d} number={pk.number} fileName={`ficha-${fileBase}-${pk.number}.pdf`} />
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Comments
        orgId={orgId}
        productId={p.id}
        me={user.id}
        moderator={role === "owner" || role === "admin"}
        names={names}
        initial={commentRes.data ?? []}
        locked={planAllows(plan, "colecao") ? null : PLAN_LOCK_TEXT.colecao}
      />

      {pattern && <ApprovalsList supabase={supabase} orgId={orgId} patternId={pattern.id} canEdit={canEditPatterns(role) && planAllows(plan, "aprovacao")} />}
    </div>
  );
}
