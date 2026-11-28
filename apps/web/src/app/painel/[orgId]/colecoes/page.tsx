import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MoreMenu, menuItem } from "@/components/more-menu";
import { OpenOnHash } from "@/components/open-on-hash";
import { PageTabs } from "@/components/page-tabs";
import { EmptyState, Loading, NotConfigured, PageHeader } from "@/components/page-shell";
import { PlanLock } from "@/components/plan-lock";
import { ui } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import {
  COLLECTION_PHASES,
  collectionPhase,
  formatDay,
  milestoneState,
  productDueState,
  readCollectionPhase,
  todayInBrazil,
} from "@/lib/collection";
import { isUuid } from "@/lib/ids";
import { canEditProducts, getMyRole, getOrgPlan } from "@/lib/org-access";
import { planAllows } from "@/lib/plans";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { setCollectionArchived } from "./actions";
import { CreateCollectionForm } from "./forms";
import { CollectionProgress } from "./progress";

type Props = PageProps<"/painel/[orgId]/colecoes">;

export default function ColecoesPage({ params, searchParams }: Props) {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Carregando coleções…" />}>
      <Colecoes params={params} searchParams={searchParams} />
    </Suspense>
  );
}

const EMPTY: Record<string, { title: string; text: string }> = {
  andamento: { title: "Nenhuma coleção em andamento", text: "Crie uma em “Nova coleção”. Dentro dela você cadastra os produtos e liga cada um ao seu molde." },
  entregues: { title: "Nenhuma coleção entregue ainda", text: "Quando todos os produtos de uma coleção chegam à produção, ela aparece aqui." },
  arquivadas: { title: "Nenhuma coleção arquivada", text: "Arquive pelo menu ⋯ de uma coleção para tirá-la da frente sem apagar nada." },
};

/**
 * As coleções em abas (Em andamento, Entregues, Arquivadas) e em cards: andamento por estágio, atrasos e
 * lançamento; o menu ⋯ de cada card abre, edita e arquiva.
 */
async function Colecoes({ params, searchParams }: Pick<Props, "params" | "searchParams">) {
  const { orgId } = await params;
  if (!isUuid(orgId)) notFound();
  const phase = readCollectionPhase((await searchParams).aba);
  const base = `/painel/${orgId}/colecoes`;
  const user = await requireUser(base);
  const supabase = await createClient();

  const [orgRes, role, plan, colRes, prodRes, msRes] = await Promise.all([
    supabase.from("orgs").select("name").eq("id", orgId).maybeSingle(),
    getMyRole(supabase, orgId, user.id),
    getOrgPlan(supabase, orgId),
    supabase.from("collections").select("id, name, season, starts_on, launch_on, archived_at").eq("org_id", orgId).order("created_at", { ascending: false }),
    supabase.from("products").select("collection_id, status, due_on").eq("org_id", orgId),
    supabase.from("milestones").select("collection_id, due_on, done_at").eq("org_id", orgId),
  ]);
  if (!orgRes.data) notFound();
  const canEdit = canEditProducts(role, plan);
  const today = todayInBrazil();
  const productsOf = (id: string) => (prodRes.data ?? []).filter((p) => p.collection_id === id);
  const lateCount = (id: string) =>
    (msRes.data ?? []).filter((m) => m.collection_id === id && milestoneState(m.due_on, m.done_at, today) === "atrasada").length +
    productsOf(id).filter((p) => productDueState(p.due_on, p.status, today) === "atrasada").length;
  const all = (colRes.data ?? []).map((c) => ({ ...c, phase: collectionPhase(c.archived_at, productsOf(c.id).map((p) => p.status)) }));
  const collections = all.filter((c) => c.phase === phase);
  const here = phase === "andamento" ? base : `${base}?aba=${phase}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader title="Coleções" description="Cada coleção junta os produtos, o estágio de cada um, os prazos e o cronograma até o lançamento." />
        {canEdit && (
          <details id="nova-colecao" className="group relative">
            <summary className={`${ui.buttonPrimary} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>+ Nova coleção</summary>
            <div className={`${ui.card} absolute right-0 z-30 mt-2 w-[min(92vw,34rem)] shadow-[0_24px_50px_-28px_rgb(29_27_24/0.55)]`}>
              <CreateCollectionForm orgId={orgId} />
              <OpenOnHash id="nova-colecao" />
            </div>
          </details>
        )}
      </div>

      {!planAllows(plan, "colecao") && <PlanLock feature="colecao" />}

      <PageTabs
        label="Coleções por situação"
        current={phase}
        tabs={COLLECTION_PHASES.map((p) => ({
          id: p.id,
          label: p.label,
          href: p.id === "andamento" ? base : `${base}?aba=${p.id}`,
          count: all.filter((c) => c.phase === p.id).length,
        }))}
      />

      {collections.length === 0 ? (
        <EmptyState icon="colecoes" title={EMPTY[phase]!.title}>
          {EMPTY[phase]!.text}
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" data-collections>
          {collections.map((c) => {
            const products = productsOf(c.id);
            const late = c.phase === "arquivadas" ? 0 : lateCount(c.id);
            const href = `${base}/${c.id}`;
            return (
              <li
                key={c.id}
                className="relative flex h-full flex-col gap-4 rounded-2xl border border-tinta/10 bg-white p-5 transition hover:-translate-y-0.5 hover:border-tinta/30 hover:shadow-[0_18px_36px_-24px_rgb(29_27_24/0.5)]"
                data-collection={c.phase}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {c.season && <p className={ui.eyebrow}>{c.season}</p>}
                    {/* O link cobre o card inteiro (::after); o menu fica por cima dele. */}
                    <Link href={href} className="mt-1 block truncate font-display text-2xl leading-tight font-semibold after:absolute after:inset-0 after:rounded-2xl">
                      {c.name}
                    </Link>
                  </div>
                  <div className="relative z-10 flex shrink-0 items-center gap-2">
                    {late > 0 && (
                      <span className={ui.tagAlert} data-late={late}>
                        {late} {late === 1 ? "atraso" : "atrasos"}
                      </span>
                    )}
                    {canEdit && (
                      <MoreMenu label={`Ações de ${c.name}`}>
                        <Link href={href} className={menuItem}>
                          Abrir
                        </Link>
                        <Link href={`${href}?editar=1`} className={menuItem}>
                          Editar nome e datas
                        </Link>
                        <form action={setCollectionArchived}>
                          <input type="hidden" name="orgId" value={orgId} />
                          <input type="hidden" name="back" value={here} />
                          <input type="hidden" name="collectionId" value={c.id} />
                          <input type="hidden" name="archive" value={c.archived_at ? "0" : "1"} />
                          <button type="submit" className={menuItem}>
                            {c.archived_at ? "Restaurar" : "Arquivar"}
                          </button>
                        </form>
                      </MoreMenu>
                    )}
                  </div>
                </div>

                <CollectionProgress statuses={products.map((p) => p.status)} />

                <p className="mt-auto flex items-center justify-between gap-2 border-t border-tinta/10 pt-3 text-sm text-tinta-suave">
                  <span>
                    {products.length} {products.length === 1 ? "produto" : "produtos"}
                  </span>
                  <span className="font-mono text-xs">{c.launch_on ? `lançamento ${formatDay(c.launch_on)}` : "sem data de lançamento"}</span>
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
