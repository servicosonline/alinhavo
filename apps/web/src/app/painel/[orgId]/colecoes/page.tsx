import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EmptyState, Loading, NotConfigured, PageHeader } from "@/components/page-shell";
import { ui } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatDay, milestoneState, PRODUCT_STATUS_LABEL, PRODUCT_STATUSES, productDueState, todayInBrazil } from "@/lib/collection";
import { isUuid } from "@/lib/ids";
import { canEditProducts, getMyRole } from "@/lib/org-access";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { CreateCollectionForm } from "./forms";

export default function ColecoesPage({ params }: PageProps<"/painel/[orgId]/colecoes">) {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Carregando coleções…" />}>
      <Colecoes params={params} />
    </Suspense>
  );
}

/** Cores do andamento por status, da ideia (clara) à produção (tinta). */
const STATUS_BAR: Record<string, string> = {
  ideia: "bg-tinta/15",
  modelagem: "bg-costura/60",
  prova: "bg-fita",
  aprovado: "bg-linha",
  producao: "bg-tinta",
};

/** As coleções em cards: produtos, lançamento, andamento por status e atrasos (etapas e entregas). */
async function Colecoes({ params }: { params: PageProps<"/painel/[orgId]/colecoes">["params"] }) {
  const { orgId } = await params;
  if (!isUuid(orgId)) notFound();
  const user = await requireUser(`/painel/${orgId}/colecoes`);
  const supabase = await createClient();

  const [orgRes, role, colRes, prodRes, msRes] = await Promise.all([
    supabase.from("orgs").select("name").eq("id", orgId).maybeSingle(),
    getMyRole(supabase, orgId, user.id),
    supabase.from("collections").select("id, name, season, starts_on, launch_on").eq("org_id", orgId).is("archived_at", null).order("created_at", { ascending: false }),
    supabase.from("products").select("collection_id, status, due_on").eq("org_id", orgId),
    supabase.from("milestones").select("collection_id, due_on, done_at").eq("org_id", orgId),
  ]);
  if (!orgRes.data) notFound();
  const collections = colRes.data ?? [];
  const today = todayInBrazil();
  const productsOf = (id: string) => (prodRes.data ?? []).filter((p) => p.collection_id === id);
  const lateCount = (id: string) =>
    (msRes.data ?? []).filter((m) => m.collection_id === id && milestoneState(m.due_on, m.done_at, today) === "atrasada").length +
    productsOf(id).filter((p) => productDueState(p.due_on, p.status, today) === "atrasada").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader title="Coleções" description="Cada coleção junta os produtos, o status de cada um, os prazos e o cronograma até o lançamento." />
        {canEditProducts(role) && (
          <details className="group relative">
            <summary className={`${ui.buttonPrimary} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>+ Nova coleção</summary>
            <div className={`${ui.card} absolute right-0 z-30 mt-2 w-[min(92vw,34rem)] shadow-[0_24px_50px_-28px_rgb(29_27_24/0.55)]`}>
              <CreateCollectionForm orgId={orgId} />
            </div>
          </details>
        )}
      </div>

      {collections.length === 0 ? (
        <EmptyState icon="colecoes" title="Nenhuma coleção ainda">
          Crie a primeira em &ldquo;Nova coleção&rdquo;. Dentro dela você cadastra os produtos e liga cada um ao seu molde.
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" data-collections>
          {collections.map((c) => {
            const products = productsOf(c.id);
            const late = lateCount(c.id);
            return (
              <li key={c.id}>
                <Link
                  href={`/painel/${orgId}/colecoes/${c.id}`}
                  className="group flex h-full flex-col gap-4 rounded-2xl border border-tinta/10 bg-white p-5 transition hover:-translate-y-0.5 hover:border-tinta/30 hover:shadow-[0_18px_36px_-24px_rgb(29_27_24/0.5)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {c.season && <p className={ui.eyebrow}>{c.season}</p>}
                      <p className="mt-1 truncate font-display text-2xl leading-tight font-semibold">{c.name}</p>
                    </div>
                    {late > 0 && (
                      <span className={`shrink-0 ${ui.tagAlert}`} data-late={late}>
                        {late} {late === 1 ? "atraso" : "atrasos"}
                      </span>
                    )}
                  </div>

                  {/* Andamento: uma faixa por status, do tamanho da quantidade de produtos. */}
                  <div>
                    <div className="flex h-2 overflow-hidden rounded-full bg-papel-escuro" aria-hidden="true">
                      {PRODUCT_STATUSES.map((s) => {
                        const n = products.filter((p) => p.status === s).length;
                        return n ? <span key={s} className={STATUS_BAR[s]} style={{ width: `${(n / products.length) * 100}%` }} /> : null;
                      })}
                    </div>
                    <p className="mt-2 text-xs text-tinta-suave">
                      {products.length === 0
                        ? "Nenhum produto ainda"
                        : PRODUCT_STATUSES.map((s) => [s, products.filter((p) => p.status === s).length] as const)
                            .filter(([, n]) => n > 0)
                            .map(([s, n]) => `${n} ${PRODUCT_STATUS_LABEL[s].toLowerCase()}`)
                            .join(" · ")}
                    </p>
                  </div>

                  <p className="mt-auto flex items-center justify-between gap-2 border-t border-tinta/10 pt-3 text-sm text-tinta-suave">
                    <span>
                      {products.length} {products.length === 1 ? "produto" : "produtos"}
                    </span>
                    <span className="font-mono text-xs">{c.launch_on ? `lançamento ${formatDay(c.launch_on)}` : "sem data de lançamento"}</span>
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
