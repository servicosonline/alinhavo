import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loading, NotConfigured } from "@/components/page-shell";
import { SubmitButton } from "@/components/submit-button";
import { ui } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import {
  daysLate,
  formatDay,
  milestoneState,
  PRODUCT_STATUS_LABEL,
  PRODUCT_STATUSES,
  suggestApproved,
  todayInBrazil,
  type MilestoneState,
} from "@/lib/collection";
import { isUuid } from "@/lib/ids";
import { canEditProducts, getMyRole } from "@/lib/org-access";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { deleteMilestone, linkProductPattern, setProductStatus, toggleMilestone } from "../actions";
import { CreateMilestoneForm, CreateProductForm } from "../forms";

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

async function Colecao({ params }: { params: Params }) {
  const { orgId, collectionId } = await params;
  if (!isUuid(orgId) || !isUuid(collectionId)) notFound();
  const back = `/painel/${orgId}/colecoes/${collectionId}`;
  const user = await requireUser(back);
  const supabase = await createClient();

  const [colRes, role, prodRes, msRes, patRes, teamRes] = await Promise.all([
    supabase.from("collections").select("id, name, season, starts_on, launch_on").eq("id", collectionId).eq("org_id", orgId).maybeSingle(),
    getMyRole(supabase, orgId, user.id),
    supabase.from("products").select("id, reference, name, status, pattern_id").eq("collection_id", collectionId).eq("org_id", orgId).order("created_at"),
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

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/painel/${orgId}/colecoes`} className="text-sm text-tinta-suave hover:text-tinta">
          ← Coleções
        </Link>
        <h1 className={`mt-2 ${ui.h1}`}>{col.name}</h1>
        <p className={`mt-1 ${ui.muted}`}>
          {[col.season, col.starts_on && `início ${formatDay(col.starts_on)}`, col.launch_on && `lançamento ${formatDay(col.launch_on)}`]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      <section aria-labelledby="produtos" className="space-y-4">
        <h2 id="produtos" className={ui.h2}>
          Produtos
        </h2>
        {canEdit && (
          <div className={ui.card}>
            <CreateProductForm orgId={orgId} collectionId={collectionId} />
          </div>
        )}
        {products.length === 0 ? (
          <p className={ui.muted}>Nenhum produto nesta coleção ainda.</p>
        ) : (
          <ul className="divide-y divide-tinta/10 overflow-hidden rounded-lg border border-tinta/15 bg-white/70" data-products>
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
                    <span className="rounded bg-papel-escuro px-2 py-0.5 text-xs">{PRODUCT_STATUS_LABEL[p.status]}</span>
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
                        <select id={`status-${p.id}`} name="status" defaultValue={p.status} className="rounded-md border border-tinta/20 bg-white px-2 py-1.5">
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
                        <select id={`molde-${p.id}`} name="patternId" defaultValue={p.pattern_id ?? ""} className="max-w-56 rounded-md border border-tinta/20 bg-white px-2 py-1.5">
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
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="cronograma" className="space-y-4">
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
        {canEdit && (
          <div className={ui.card}>
            <CreateMilestoneForm orgId={orgId} collectionId={collectionId} team={team} />
          </div>
        )}
        {milestones.length === 0 ? (
          <p className={ui.muted}>Nenhuma etapa no cronograma ainda.</p>
        ) : (
          <ol className="divide-y divide-tinta/10 overflow-hidden rounded-lg border border-tinta/15 bg-white/70" data-milestones>
            {milestones.map((m) => {
              const state = milestoneState(m.due_on, m.done_at, today);
              const late = daysLate(m.due_on, m.done_at, today);
              const who = emailOf(m.assignee);
              return (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3" data-milestone={state}>
                  <span className={state === "concluida" ? "text-tinta-suave line-through" : ""}>
                    <span className="font-medium">{m.title}</span>
                    <span className="block text-xs text-tinta-suave">
                      prazo {formatDay(m.due_on)}
                      {who && ` · ${who}`}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATE_STYLE[state]}`}>
                      {state === "atrasada"
                        ? `Atrasada ${late} ${late === 1 ? "dia" : "dias"}`
                        : state === "proxima"
                          ? "Vence em breve"
                          : state === "concluida"
                            ? "Concluída"
                            : "No prazo"}
                    </span>
                    {canEdit && (
                      <>
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
                      </>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
