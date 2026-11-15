import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EmptyState, Loading, NotConfigured, PageHeader } from "@/components/page-shell";
import { SubmitButton } from "@/components/submit-button";
import { ui } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import {
  daysLate,
  formatDay,
  milestoneState,
  PRODUCT_STATUS_LABEL,
  PRODUCT_STATUSES,
  productDueState,
  suggestApproved,
  todayInBrazil,
  type MilestoneState,
} from "@/lib/collection";
import { isUuid } from "@/lib/ids";
import { canEditProducts, getMyRole } from "@/lib/org-access";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { deleteMilestone, linkProductPattern, setProductDue, setProductStatus, toggleMilestone } from "../actions";
import { CreateMilestoneForm, CreateProductForm } from "../forms";
import { DueChip, ProductsView, type ProductCard } from "./products-view";

type Params = PageProps<"/painel/[orgId]/colecoes/[collectionId]">["params"];

export default function ColecaoPage({ params }: PageProps<"/painel/[orgId]/colecoes/[collectionId]">) {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Abrindo coleção…" />}>
      <Colecao params={params} />
    </Suspense>
  );
}

const STATE_STYLE: Record<MilestoneState, string> = {
  concluida: "bg-papel-escuro text-tinta-suave",
  atrasada: "bg-linha/10 text-linha",
  proxima: "bg-amber-100 text-amber-900",
  futura: "bg-white text-tinta-suave border border-tinta/15",
};

/**
 * A coleção: resumo no topo (produtos por status, lançamento, atrasos), os produtos no centro em
 * Lista ou Quadro, e o cronograma numa coluna ao lado (embaixo, no celular).
 */
async function Colecao({ params }: { params: Params }) {
  const { orgId, collectionId } = await params;
  if (!isUuid(orgId) || !isUuid(collectionId)) notFound();
  const back = `/painel/${orgId}/colecoes/${collectionId}`;
  const user = await requireUser(back);
  const supabase = await createClient();

  const [colRes, role, prodRes, msRes, patRes, teamRes] = await Promise.all([
    supabase.from("collections").select("id, name, season, starts_on, launch_on").eq("id", collectionId).eq("org_id", orgId).maybeSingle(),
    getMyRole(supabase, orgId, user.id),
    supabase.from("products").select("id, reference, name, status, pattern_id, due_on").eq("collection_id", collectionId).eq("org_id", orgId).order("created_at"),
    supabase.from("milestones").select("id, title, due_on, assignee, done_at").eq("collection_id", collectionId).eq("org_id", orgId).order("due_on"),
    supabase.from("patterns").select("id, name, current_version").eq("org_id", orgId).is("archived_at", null).order("name"),
    supabase.rpc("org_team", { p_org_id: orgId }),
  ]);
  const col = colRes.data;
  if (!col) notFound();
  const products = prodRes.data ?? [];
  const milestones = msRes.data ?? [];
  const patterns = patRes.data ?? [];
  const team = (teamRes.data ?? []).map((m) => ({ user_id: m.user_id, email: m.email }));
  const canEdit = canEditProducts(role);
  const today = todayInBrazil();

  // Moldes já usados por outro produto (um molde por produto).
  const { data: allLinks } = await supabase.from("products").select("id, pattern_id").eq("org_id", orgId).not("pattern_id", "is", null);
  const takenBy = new Map((allLinks ?? []).map((p) => [p.pattern_id!, p.id]));
  // Última aprovação de cada molde ligado.
  const linked = products.map((p) => p.pattern_id).filter((id): id is string => !!id);
  const { data: approvals } = linked.length
    ? await supabase.from("approvals").select("pattern_id, status, created_at").in("pattern_id", linked).eq("org_id", orgId).order("created_at", { ascending: false })
    : { data: [] as { pattern_id: string; status: "pendente" | "aprovado" | "ajustes"; created_at: string }[] };
  const latestApproval = (patternId: string | null) => (patternId ? ((approvals ?? []).find((a) => a.pattern_id === patternId)?.status ?? null) : null);

  const lateTotal = milestones.filter((m) => milestoneState(m.due_on, m.done_at, today) === "atrasada").length;
  const emailOf = (id: string | null) => team.find((m) => m.user_id === id)?.email ?? null;
  const dueOf = (p: (typeof products)[number]) => {
    const state = productDueState(p.due_on, p.status, today);
    return state && p.due_on ? { label: formatDay(p.due_on).slice(0, 5), state } : null;
  };
  const lateProducts = products.filter((p) => dueOf(p)?.state === "atrasada").length;

  const cards: ProductCard[] = products.map((p) => ({
    id: p.id,
    column: p.status,
    name: p.name,
    reference: p.reference,
    href: `/painel/${orgId}/produtos/${p.id}`,
    patternName: patterns.find((m) => m.id === p.pattern_id)?.name ?? null,
    due: dueOf(p),
  }));

  const list = (
    <ul className={ui.list} data-products>
      {products.map((p) => {
        const pattern = patterns.find((m) => m.id === p.pattern_id);
        const approval = latestApproval(p.pattern_id);
        return (
          <li key={p.id} className="space-y-3 px-5 py-4" data-product={p.status}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <Link href={`/painel/${orgId}/produtos/${p.id}`} className="font-medium hover:underline">
                {p.reference && <span className="font-mono text-sm text-tinta-suave">{p.reference} · </span>}
                {p.name}
              </Link>
              <span className="flex items-center gap-2">
                <DueChip due={dueOf(p)} />
                <span className="rounded bg-papel-escuro px-2 py-0.5 text-xs">{PRODUCT_STATUS_LABEL[p.status]}</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {pattern ? (
                <Link href={`/painel/${orgId}/moldes/${pattern.id}`} className="text-tinta-suave underline hover:text-tinta">
                  Molde: {pattern.name} (versão {pattern.current_version})
                </Link>
              ) : (
                <span className="text-tinta-suave">Sem molde ligado</span>
              )}
              {approval && (
                <span className="text-xs text-tinta-suave">
                  Última aprovação: {approval === "aprovado" ? "aprovado" : approval === "ajustes" ? "pediu ajustes" : "aguardando"}
                </span>
              )}
            </div>
            {canEdit && suggestApproved(p.status, approval) && (
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
            {canEdit && (
              <div className="flex flex-wrap gap-3">
                {/* A chave recria o formulário quando o valor salvo muda (o select guarda o valor antigo). */}
                <form key={`status-${p.status}`} action={setProductStatus} className="flex items-center gap-2 text-sm">
                  <input type="hidden" name="orgId" value={orgId} />
                  <input type="hidden" name="back" value={back} />
                  <input type="hidden" name="productId" value={p.id} />
                  <label className="sr-only" htmlFor={`status-${p.id}`}>
                    Status de {p.name}
                  </label>
                  <select id={`status-${p.id}`} name="status" defaultValue={p.status} className={ui.select}>
                    {PRODUCT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {PRODUCT_STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                  <SubmitButton variant="ghost" pendingText="…">
                    Mudar status
                  </SubmitButton>
                </form>
                <form key={`molde-${p.pattern_id ?? ""}`} action={linkProductPattern} className="flex items-center gap-2 text-sm">
                  <input type="hidden" name="orgId" value={orgId} />
                  <input type="hidden" name="back" value={back} />
                  <input type="hidden" name="productId" value={p.id} />
                  <label className="sr-only" htmlFor={`molde-${p.id}`}>
                    Molde de {p.name}
                  </label>
                  <select id={`molde-${p.id}`} name="patternId" defaultValue={p.pattern_id ?? ""} className={`${ui.select} max-w-56`}>
                    <option value="">Sem molde</option>
                    {patterns
                      .filter((m) => !takenBy.has(m.id) || takenBy.get(m.id) === p.id)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                  </select>
                  <SubmitButton variant="ghost" pendingText="…">
                    Ligar molde
                  </SubmitButton>
                </form>
                <form key={`entrega-${p.due_on ?? ""}`} action={setProductDue} className="flex items-center gap-2 text-sm">
                  <input type="hidden" name="orgId" value={orgId} />
                  <input type="hidden" name="back" value={back} />
                  <input type="hidden" name="productId" value={p.id} />
                  <label className="text-tinta-suave" htmlFor={`entrega-${p.id}`}>
                    Entrega
                  </label>
                  <input id={`entrega-${p.id}`} name="due_on" type="date" defaultValue={p.due_on ?? ""} className={ui.select} />
                  <SubmitButton variant="ghost" pendingText="…">
                    Salvar
                  </SubmitButton>
                </form>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          trail={[{ label: "Coleções", href: `/painel/${orgId}/colecoes` }, { label: col.name }]}
          eyebrow={
            [col.season, col.starts_on && `início ${formatDay(col.starts_on)}`, col.launch_on && `lançamento ${formatDay(col.launch_on)}`]
              .filter(Boolean)
              .join(" · ") || undefined
          }
          title={col.name}
        />
        {canEdit && (
          <details className="group relative">
            <summary className={`${ui.buttonPrimary} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>+ Novo produto</summary>
            <div className={`${ui.card} absolute right-0 z-30 mt-2 w-[min(92vw,30rem)] shadow-[0_24px_50px_-28px_rgb(29_27_24/0.55)]`}>
              <CreateProductForm orgId={orgId} collectionId={collectionId} />
            </div>
          </details>
        )}
      </div>

      {/* Resumo: produtos por status, atrasos. */}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7" data-resumo>
        <div className="rounded-2xl bg-tinta p-4 text-papel">
          <dt className="font-mono text-[11px] tracking-[0.12em] text-papel/70 uppercase">Produtos</dt>
          <dd className="mt-1 font-display text-3xl font-semibold">{products.length}</dd>
        </div>
        {PRODUCT_STATUSES.map((s) => (
          <div key={s} className="rounded-2xl border border-tinta/10 bg-white p-4">
            <dt className="font-mono text-[11px] tracking-[0.12em] text-tinta-suave uppercase">{PRODUCT_STATUS_LABEL[s]}</dt>
            <dd className="mt-1 font-display text-3xl font-semibold">{products.filter((p) => p.status === s).length}</dd>
          </div>
        ))}
        <div className={`rounded-2xl p-4 ${lateProducts + lateTotal > 0 ? "bg-linha/10 text-linha" : "border border-tinta/10 bg-white"}`}>
          <dt className="font-mono text-[11px] tracking-[0.12em] uppercase opacity-80">Atrasos</dt>
          <dd className="mt-1 font-display text-3xl font-semibold" title={`${lateProducts} produtos e ${lateTotal} etapas`}>
            {lateProducts + lateTotal}
          </dd>
        </div>
      </dl>

      <div className="grid items-start gap-8 xl:grid-cols-[1fr_24rem]">
        <section aria-labelledby="produtos" className="min-w-0 space-y-4">
          <h2 id="produtos" className={ui.h2}>
            Produtos
          </h2>
          {products.length === 0 ? (
            <EmptyState icon="colecoes" title="Nenhum produto nesta coleção ainda">
              Cadastre o primeiro produto em &ldquo;Novo produto&rdquo; e ligue ao molde: o status acompanha da ideia até a produção.
            </EmptyState>
          ) : (
            <ProductsView orgId={orgId} collectionId={collectionId} list={list} cards={cards} canEdit={canEdit} />
          )}
        </section>

        <aside aria-labelledby="cronograma" className="space-y-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="cronograma" className={ui.h2}>
              Cronograma
            </h2>
            {lateTotal > 0 && (
              <span className="text-sm font-medium text-linha" data-late-total={lateTotal}>
                {lateTotal} {lateTotal === 1 ? "etapa atrasada" : "etapas atrasadas"}
              </span>
            )}
          </div>
          {milestones.length === 0 ? (
            <p className={ui.muted}>Nenhuma etapa no cronograma ainda.</p>
          ) : (
            <ol className={ui.list} data-milestones>
              {milestones.map((m) => {
                const state = milestoneState(m.due_on, m.done_at, today);
                const late = daysLate(m.due_on, m.done_at, today);
                const who = emailOf(m.assignee);
                return (
                  <li key={m.id} className="space-y-2 px-4 py-3" data-milestone={state}>
                    <div className="flex items-start justify-between gap-2">
                      <span className={state === "concluida" ? "text-tinta-suave line-through" : ""}>
                        <span className="font-medium">{m.title}</span>
                        <span className="block text-xs text-tinta-suave">
                          prazo {formatDay(m.due_on)}
                          {who && ` · ${who}`}
                        </span>
                      </span>
                      <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${STATE_STYLE[state]}`}>
                        {state === "atrasada"
                          ? `Atrasada ${late} ${late === 1 ? "dia" : "dias"}`
                          : state === "proxima"
                            ? "Vence em breve"
                            : state === "concluida"
                              ? "Concluída"
                              : "No prazo"}
                      </span>
                    </div>
                    {canEdit && (
                      <div className="flex gap-2">
                        <form action={toggleMilestone}>
                          <input type="hidden" name="orgId" value={orgId} />
                          <input type="hidden" name="back" value={back} />
                          <input type="hidden" name="milestoneId" value={m.id} />
                          <input type="hidden" name="done" value={m.done_at ? "0" : "1"} />
                          <SubmitButton variant="ghost" pendingText="…">
                            {m.done_at ? "Reabrir" : "Concluir"}
                          </SubmitButton>
                        </form>
                        <form action={deleteMilestone}>
                          <input type="hidden" name="orgId" value={orgId} />
                          <input type="hidden" name="back" value={back} />
                          <input type="hidden" name="milestoneId" value={m.id} />
                          <SubmitButton variant="ghost" pendingText="…">
                            Apagar
                          </SubmitButton>
                        </form>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
          {canEdit && (
            <details className={ui.card}>
              <summary className="cursor-pointer text-sm font-medium">+ Nova etapa</summary>
              <div className="mt-4">
                <CreateMilestoneForm orgId={orgId} collectionId={collectionId} team={team} />
              </div>
            </details>
          )}
        </aside>
      </div>
    </div>
  );
}
