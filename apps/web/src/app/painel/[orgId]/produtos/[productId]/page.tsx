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

/** Produto: status, molde ligado e as aprovações dele. Ficha técnica e comentários chegam nas próximas partes. */
async function Produto({ params }: { params: Params }) {
  const { orgId, productId } = await params;
  if (!isUuid(orgId) || !isUuid(productId)) notFound();
  const back = `/painel/${orgId}/produtos/${productId}`;
  const user = await requireUser(back);
  const supabase = await createClient();

  const [prodRes, role, patRes] = await Promise.all([
    supabase
      .from("products")
      .select("id, reference, name, status, pattern_id, collection_id, collections(name)")
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
          <form action={setProductStatus} className="flex flex-wrap items-end gap-2">
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
            <form action={linkProductPattern} className="flex flex-wrap items-end gap-2">
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

      {pattern && <ApprovalsList supabase={supabase} orgId={orgId} patternId={pattern.id} canEdit={canEditPatterns(role)} />}
    </div>
  );
}
