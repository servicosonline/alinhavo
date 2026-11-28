import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MoreMenu, menuItem } from "@/components/more-menu";
import { FilterChips, PageTabs } from "@/components/page-tabs";
import { EmptyState, Loading, NotConfigured, PageHeader } from "@/components/page-shell";
import { ProductThumb } from "@/components/product-thumb";
import { SubmitButton } from "@/components/submit-button";
import { TrackingShare } from "@/components/tracking-share";
import { ui } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import {
  daysLate,
  formatDay,
  matchesProductFilter,
  milestoneState,
  PRODUCT_STATUS_LABEL,
  PRODUCT_STATUSES,
  productDueState,
  readProductFilter,
  suggestApproved,
  todayInBrazil,
  type MilestoneState,
  type ProductFilter,
} from "@/lib/collection";
import { isUuid } from "@/lib/ids";
import { canEditProducts, getMyRole, getOrgPlan } from "@/lib/org-access";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { activeTrackingLinks } from "../../tracking-links";
import { deleteMilestone, linkProductPattern, setCollectionArchived, setProductDue, setProductStatus, toggleMilestone } from "../actions";
import { CreateMilestoneForm, CreateProductForm, EditCollectionForm } from "../forms";
import { CollectionProgress } from "../progress";
import { DueChip, ProductsView, type ProductCard } from "./products-view";

type Props = PageProps<"/painel/[orgId]/colecoes/[collectionId]">;
type Tab = "produtos" | "cronograma";

export default function ColecaoPage({ params, searchParams }: Props) {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Abrindo coleção…" />}>
      <Colecao params={params} searchParams={searchParams} />
    </Suspense>
  );
}

const STATE_STYLE: Record<MilestoneState, string> = {
  concluida: "bg-papel-escuro text-tinta-suave",
  atrasada: "bg-linha/10 text-linha",
  proxima: "bg-amber-100 text-amber-900",
  futura: "bg-white text-tinta-suave border border-tinta/15",
};

const APPROVAL_TEXT = { aprovado: "Cliente aprovou", ajustes: "Cliente pediu ajustes", pendente: "Aguardando a cliente" } as const;

const popover = `${ui.card} absolute right-0 z-30 mt-2 shadow-[0_24px_50px_-28px_rgb(29_27_24/0.55)]`;
const summaryReset = "cursor-pointer list-none [&::-webkit-details-marker]:hidden";

/**
 * A coleção: título, datas e andamento no topo, com as ações (novo produto, acompanhamento, editar, ⋯);
 * abas Produtos (filtros por estágio e atraso, Lista ou Quadro; as edições de cada produto no menu ⋯
 * da linha) e Cronograma (etapas com caixa de concluir).
 */
async function Colecao({ params, searchParams }: Pick<Props, "params" | "searchParams">) {
  const { orgId, collectionId } = await params;
  if (!isUuid(orgId) || !isUuid(collectionId)) notFound();
  const sp = await searchParams;
  const tab: Tab = sp.aba === "cronograma" ? "cronograma" : "produtos";
  const filter = readProductFilter(sp.filtro);
  const editing = sp.editar === "1";
  const base = `/painel/${orgId}/colecoes/${collectionId}`;
  const user = await requireUser(base);
  const supabase = await createClient();

  const [colRes, role, plan, prodRes, msRes, patRes, teamRes] = await Promise.all([
    supabase.from("collections").select("id, name, season, starts_on, launch_on, archived_at").eq("id", collectionId).eq("org_id", orgId).maybeSingle(),
    getMyRole(supabase, orgId, user.id),
    getOrgPlan(supabase, orgId),
    supabase.from("products").select("id, reference, name, status, pattern_id, due_on, photo_path, updated_at").eq("collection_id", collectionId).eq("org_id", orgId).order("created_at"),
    supabase.from("milestones").select("id, title, due_on, assignee, done_at").eq("collection_id", collectionId).eq("org_id", orgId).order("due_on"),
    supabase.from("patterns").select("id, name, current_version").eq("org_id", orgId).is("archived_at", null).order("name"),
    supabase.rpc("org_team", { p_org_id: orgId }),
  ]);
  const col = colRes.data;
  if (!col) notFound();
  const products = prodRes.data ?? [];
  const milestones = msRes.data ?? [];
  const patterns = patRes.data ?? [];
  const team = (teamRes.data ?? []).map((m) => ({
    user_id: m.user_id,
    label: [m.first_name, m.last_name].filter(Boolean).join(" ") || m.email,
  }));
  const canEdit = canEditProducts(role, plan);
  const [tracking, { data: orgRow }] = await Promise.all([
    canEdit ? activeTrackingLinks(supabase, "colecao", collectionId) : Promise.resolve([]),
    supabase.from("orgs").select("name").eq("id", orgId).maybeSingle(),
  ]);
  const orgName = orgRow?.name ?? "";
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

  const lateMilestones = milestones.filter((m) => milestoneState(m.due_on, m.done_at, today) === "atrasada").length;
  const doneMilestones = milestones.filter((m) => m.done_at).length;
  const labelOf = (id: string | null) => team.find((m) => m.user_id === id)?.label ?? null;
  const dueOf = (p: (typeof products)[number]) => {
    const state = productDueState(p.due_on, p.status, today);
    return state && p.due_on ? { label: formatDay(p.due_on).slice(0, 5), state } : null;
  };
  const lateProducts = products.filter((p) => dueOf(p)?.state === "atrasada").length;
  const shown = products.filter((p) => matchesProductFilter(p, filter, today));

  const tabHref = (t: Tab) => (t === "produtos" ? base : `${base}?aba=${t}`);
  const filterHref = (f: ProductFilter) => (f === "todos" ? base : `${base}?filtro=${f}`);
  const hidden = (extra: Record<string, string>) => (
    <>
      <input type="hidden" name="orgId" value={orgId} />
      <input type="hidden" name="back" value={base} />
      {Object.entries(extra).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
    </>
  );

  // Troca o endereço da miniatura quando a foto ou o produto mudam (o navegador guarda a imagem por 5 min).
  const thumbVersion = (p: (typeof products)[number]) => `${p.photo_path ?? ""}|${p.updated_at}`;
  const cards: ProductCard[] = shown.map((p) => ({
    id: p.id,
    thumbVersion: thumbVersion(p),
    column: p.status,
    name: p.name,
    reference: p.reference,
    href: `/painel/${orgId}/produtos/${p.id}`,
    patternName: patterns.find((m) => m.id === p.pattern_id)?.name ?? null,
    due: dueOf(p),
  }));

  const list = (
    <ul className={ui.list} data-products>
      {shown.map((p) => {
        const pattern = patterns.find((m) => m.id === p.pattern_id);
        const approval = latestApproval(p.pattern_id);
        const href = `/painel/${orgId}/produtos/${p.id}`;
        return (
          <li key={p.id} className="space-y-3 px-4 py-3 sm:px-5" data-product={p.status}>
            <div className="flex items-center gap-4">
              <Link href={href} aria-hidden tabIndex={-1} className="shrink-0">
                <ProductThumb orgId={orgId} productId={p.id} version={thumbVersion(p)} size={56} />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={href} className="font-medium hover:underline">
                  {p.reference && <span className="font-mono text-sm text-tinta-suave">{p.reference} · </span>}
                  {p.name}
                </Link>
                <p className="mt-0.5 truncate text-sm text-tinta-suave">
                  {pattern ? `Molde: ${pattern.name} · v${pattern.current_version}` : "Sem molde ligado"}
                  {approval && ` · ${APPROVAL_TEXT[approval]}`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="hidden sm:inline-flex">
                  <DueChip due={dueOf(p)} />
                </span>
                <span className={ui.tag}>{PRODUCT_STATUS_LABEL[p.status]}</span>
                {canEdit && (
                  <MoreMenu label={`Ações de ${p.name}`} wide>
                    <Link href={href} className={menuItem}>
                      Abrir produto
                    </Link>
                    <div className="space-y-3 border-t border-tinta/10 px-3 pt-3 pb-2">
                      {/* A chave recria o formulário quando o valor salvo muda (o select guarda o valor antigo). */}
                      <form key={`status-${p.status}`} action={setProductStatus} className="flex items-end gap-2">
                        {hidden({ productId: p.id })}
                        <label className="block min-w-0 flex-1">
                          <span className={ui.label}>Estágio</span>
                          <select name="status" defaultValue={p.status} className={`${ui.select} w-full`}>
                            {PRODUCT_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {PRODUCT_STATUS_LABEL[s]}
                              </option>
                            ))}
                          </select>
                        </label>
                        <SubmitButton variant="ghost" pendingText="…">
                          Mudar
                        </SubmitButton>
                      </form>
                      <form key={`molde-${p.pattern_id ?? ""}`} action={linkProductPattern} className="flex items-end gap-2">
                        {hidden({ productId: p.id })}
                        <label className="block min-w-0 flex-1">
                          <span className={ui.label}>Molde</span>
                          <select name="patternId" defaultValue={p.pattern_id ?? ""} className={`${ui.select} w-full`}>
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
                      <form key={`entrega-${p.due_on ?? ""}`} action={setProductDue} className="flex items-end gap-2">
                        {hidden({ productId: p.id })}
                        <label className="block min-w-0 flex-1">
                          <span className={ui.label}>Entrega</span>
                          <input name="due_on" type="date" defaultValue={p.due_on ?? ""} className={`${ui.select} w-full`} />
                        </label>
                        <SubmitButton variant="ghost" pendingText="…">
                          Salvar
                        </SubmitButton>
                      </form>
                    </div>
                  </MoreMenu>
                )}
              </div>
            </div>
            {canEdit && suggestApproved(p.status, approval) && (
              <form action={setProductStatus} className={`${ui.success} flex flex-wrap items-center justify-between gap-2 text-sm`} data-suggest>
                {hidden({ productId: p.id, status: "aprovado" })}
                <span>A cliente aprovou o molde. Marcar o produto como aprovado?</span>
                <SubmitButton variant="ghost" pendingText="Marcando…">
                  Marcar como aprovado
                </SubmitButton>
              </form>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="space-y-6">
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
          <div className="flex flex-wrap items-center gap-2">
            <TrackingShare orgId={orgId} kind="colecao" targetId={collectionId} title={col.name} orgName={orgName} back={base} links={tracking} />
            <details className="relative" open={editing} id="editar-colecao">
              <summary className={`${ui.buttonSecondary} ${summaryReset}`}>Editar</summary>
              <div className={`${popover} w-[min(92vw,26rem)]`}>
                <EditCollectionForm orgId={orgId} collection={col} />
              </div>
            </details>
            <details className="relative">
              <summary className={`${ui.buttonPrimary} ${summaryReset}`}>+ Novo produto</summary>
              <div className={`${popover} w-[min(92vw,30rem)]`}>
                <CreateProductForm orgId={orgId} collectionId={collectionId} />
              </div>
            </details>
            <MoreMenu label={`Mais ações de ${col.name}`}>
              <form action={setCollectionArchived}>
                {hidden({ collectionId, archive: col.archived_at ? "0" : "1" })}
                <button type="submit" className={menuItem}>
                  {col.archived_at ? "Restaurar coleção" : "Arquivar coleção"}
                </button>
              </form>
            </MoreMenu>
          </div>
        )}
      </div>

      {col.archived_at && (
        <p className={`${ui.card} text-sm text-tinta-suave`} data-archived>
          Coleção arquivada em {formatDay(col.archived_at.slice(0, 10))}. Ela não aparece em &ldquo;Em andamento&rdquo; nem em &ldquo;Entregues&rdquo;; nada foi apagado.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-8 gap-y-3" data-resumo>
        <CollectionProgress statuses={products.map((p) => p.status)} className="min-w-64 flex-1" />
        <p className="text-sm text-tinta-suave">
          <b className="font-display text-2xl font-semibold text-tinta">{products.length}</b> {products.length === 1 ? "produto" : "produtos"}
          {lateProducts + lateMilestones > 0 && (
            <span className={`ml-3 ${ui.tagAlert}`} title={`${lateProducts} produtos e ${lateMilestones} etapas`}>
              {lateProducts + lateMilestones} {lateProducts + lateMilestones === 1 ? "atraso" : "atrasos"}
            </span>
          )}
        </p>
      </div>

      <PageTabs
        label="Seções da coleção"
        current={tab}
        tabs={[
          { id: "produtos", label: "Produtos", href: tabHref("produtos"), count: products.length },
          {
            id: "cronograma",
            label: "Cronograma",
            href: tabHref("cronograma"),
            count: lateMilestones > 0 ? lateMilestones : milestones.length ? milestones.length - doneMilestones : null,
            alert: lateMilestones > 0,
          },
        ]}
      />

      {tab === "produtos" ? (
        <section aria-label="Produtos" className="space-y-4">
          {products.length === 0 ? (
            <EmptyState icon="colecoes" title="Nenhum produto nesta coleção ainda">
              Cadastre o primeiro produto em &ldquo;Novo produto&rdquo; e ligue ao molde: o estágio acompanha da ideia até a produção.
            </EmptyState>
          ) : (
            <>
              <FilterChips
                label="Filtrar produtos"
                current={filter}
                items={[
                  { id: "todos", label: "Todos", href: filterHref("todos"), count: products.length },
                  ...PRODUCT_STATUSES.map((s) => ({ id: s, label: PRODUCT_STATUS_LABEL[s], href: filterHref(s), count: products.filter((p) => p.status === s).length })).filter(
                    (f) => f.count > 0,
                  ),
                  ...(lateProducts > 0 ? [{ id: "atrasados", label: "Atrasados", href: filterHref("atrasados"), count: lateProducts, alert: true }] : []),
                ]}
              />
              {shown.length === 0 ? (
                <p className={ui.muted}>
                  Nenhum produto neste filtro.{" "}
                  <Link href={base} className="underline">
                    Ver todos
                  </Link>
                </p>
              ) : (
                <ProductsView orgId={orgId} collectionId={collectionId} list={list} cards={cards} canEdit={canEdit} />
              )}
            </>
          )}
        </section>
      ) : (
        <section aria-label="Cronograma" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className={ui.muted}>
              {milestones.length === 0
                ? "Nenhuma etapa no cronograma ainda."
                : `${doneMilestones} de ${milestones.length} etapas concluídas${lateMilestones ? ` · ${lateMilestones} ${lateMilestones === 1 ? "atrasada" : "atrasadas"}` : ""}`}
            </p>
            {canEdit && (
              <details className="relative">
                <summary className={`${ui.buttonPrimary} ${summaryReset}`}>+ Nova etapa</summary>
                <div className={`${popover} w-[min(92vw,40rem)]`}>
                  <CreateMilestoneForm orgId={orgId} collectionId={collectionId} team={team} />
                </div>
              </details>
            )}
          </div>
          {milestones.length > 0 && (
            <ol className={ui.list} data-milestones>
              {milestones.map((m) => {
                const state = milestoneState(m.due_on, m.done_at, today);
                const late = daysLate(m.due_on, m.done_at, today);
                const who = labelOf(m.assignee);
                return (
                  <li key={m.id} className="flex items-center gap-3 px-4 py-3" data-milestone={state}>
                    {canEdit ? (
                      <form action={toggleMilestone} className="shrink-0">
                        {hidden({ milestoneId: m.id, done: m.done_at ? "0" : "1" })}
                        <button
                          type="submit"
                          aria-label={m.done_at ? `Reabrir ${m.title}` : `Concluir ${m.title}`}
                          title={m.done_at ? "Reabrir" : "Concluir"}
                          className={`flex size-6 items-center justify-center rounded-md border transition ${m.done_at ? "border-tinta bg-tinta text-papel" : "border-tinta/30 bg-white hover:border-tinta"}`}
                        >
                          {m.done_at && (
                            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                              <path d="m5 12 5 5 9-10" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                      </form>
                    ) : (
                      <span className={`size-6 shrink-0 rounded-md border ${m.done_at ? "border-tinta bg-tinta" : "border-tinta/30"}`} aria-hidden="true" />
                    )}
                    <span className={`min-w-0 flex-1 ${state === "concluida" ? "text-tinta-suave line-through" : ""}`}>
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
                    {canEdit && (
                      <MoreMenu label={`Ações de ${m.title}`}>
                        <form action={deleteMilestone}>
                          {hidden({ milestoneId: m.id })}
                          <button type="submit" className={`${menuItem} text-linha`}>
                            Apagar etapa
                          </button>
                        </form>
                      </MoreMenu>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      )}
    </div>
  );
}
