import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loading, NotConfigured } from "@/components/page-shell";
import { SubmitButton } from "@/components/submit-button";
import { ui } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { PRODUCT_STATUS_LABEL, PRODUCT_STATUSES, suggestApproved } from "@/lib/collection";
import { isUuid } from "@/lib/ids";
import { canEditPatterns, canEditProducts, getMyRole } from "@/lib/org-access";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { linkProductPattern, setProductStatus } from "../../colecoes/actions";
import { deleteTrim, setProductFabric } from "../actions";
import { DownloadTechPack, GenerateTechPack, TrimForm } from "./tech-pack-parts";
import { Comments } from "./comments";
import { meters, money, type TechPackData } from "@alinhavo/export/tech-pack";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/prova/approval";
import { ApprovalsList } from "../../moldes/[patternId]/approvals-list";

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

  const [prodRes, role, patRes] = await Promise.all([
    supabase
      .from("products")
      .select("id, reference, name, status, pattern_id, fabric_id, collection_id, collections(name)")
      .eq("id", productId)
      .eq("org_id", orgId)
      .maybeSingle(),
    getMyRole(supabase, orgId, user.id),
    supabase.from("patterns").select("id, name, current_version").eq("org_id", orgId).is("archived_at", null).order("name"),
  ]);
  const p = prodRes.data;
  if (!p) notFound();
  const patterns = patRes.data ?? [];
  const pattern = patterns.find((m) => m.id === p.pattern_id) ?? null;
  const canEdit = canEditProducts(role);
  const collection = p.collections as unknown as { name: string } | null;

  const { data: allLinks } = await supabase.from("products").select("id, pattern_id").eq("org_id", orgId).not("pattern_id", "is", null);
  const takenBy = new Map((allLinks ?? []).map((x) => [x.pattern_id!, x.id]));
  const { data: last } = pattern
    ? await supabase.from("approvals").select("status").eq("pattern_id", pattern.id).eq("org_id", orgId).order("created_at", { ascending: false }).limit(1)
    : { data: [] as { status: "pendente" | "aprovado" | "ajustes" }[] };
  const latest = last?.[0]?.status ?? null;

  const [fabRes, trimRes, packRes, commentRes, teamRes] = await Promise.all([
    supabase.from("fabrics").select("id, name, width_mm, price_cents").eq("org_id", orgId).order("name"),
    supabase.from("product_trims").select("id, name, quantity, unit, unit_price_cents").eq("product_id", p.id).eq("org_id", orgId).order("position").order("created_at"),
    supabase.from("tech_packs").select("id, number, pattern_version, data, created_at").eq("product_id", p.id).eq("org_id", orgId).order("number", { ascending: false }).limit(10),
    supabase.from("comments").select("id, author, body, created_at").eq("product_id", p.id).eq("org_id", orgId).order("created_at").limit(200),
    supabase.rpc("org_team", { p_org_id: orgId }),
  ]);
  const names = Object.fromEntries((teamRes.data ?? []).map((m) => [m.user_id, m.email]));
  const fabrics = fabRes.data ?? [];
  const trims = trimRes.data ?? [];
  const packs = packRes.data ?? [];
  const fabric = fabrics.find((x) => x.id === p.fabric_id) ?? null;
  const fileBase = (p.reference ?? p.name).normalize("NFD").replace(/[^\w-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "produto";

  return (
    <div className="space-y-8">
      <div>
        {p.collection_id ? (
          <Link href={`/painel/${orgId}/colecoes/${p.collection_id}`} className="text-sm text-tinta-suave hover:text-tinta">
            ← {collection?.name ?? "Coleção"}
          </Link>
        ) : (
          <Link href={`/painel/${orgId}/colecoes`} className="text-sm text-tinta-suave hover:text-tinta">
            ← Coleções
          </Link>
        )}
        <h1 className={`mt-2 ${ui.h1}`}>
          {p.reference && <span className="font-mono text-2xl text-tinta-suave">{p.reference} · </span>}
          {p.name}
        </h1>
        <p className={`mt-1 ${ui.muted}`} data-product-status={p.status}>
          {PRODUCT_STATUS_LABEL[p.status]}
        </p>
      </div>

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

      <section className={`${ui.card} space-y-3`} aria-labelledby="ficha" data-section="ficha">
        <h2 id="ficha" className={ui.h2}>
          Ficha técnica
        </h2>
        <p className="text-xs text-tinta-suave">
          Gerada da versão atual do molde, do tecido e dos aviamentos. O consumo de tecido é uma estimativa pela área das peças até o Encaixe.
        </p>
        {canEdit && (
          <GenerateTechPack
            orgId={orgId}
            productId={p.id}
            disabledReason={!pattern ? "Ligue um molde para gerar a ficha." : pattern.current_version === 0 ? "Salve uma versão do molde para gerar a ficha." : null}
          />
        )}
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
                        Tamanho {base}: {meters(c.meters)} de tecido (estimativa) · material {money(d.materialCentsBySize?.[base!] ?? null)}
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
      />

      {pattern && <ApprovalsList supabase={supabase} orgId={orgId} patternId={pattern.id} canEdit={canEditPatterns(role)} />}
    </div>
  );
}
