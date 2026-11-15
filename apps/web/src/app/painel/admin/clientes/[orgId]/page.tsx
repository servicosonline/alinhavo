import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OrgCover } from "@/components/org-cover";
import { Loading, NotConfigured, PageHeader } from "@/components/page-shell";
import { SubmitButton } from "@/components/submit-button";
import { ROLE_LABEL, ui } from "@/components/ui";
import { STATUS_LABEL, planName } from "@/lib/account";
import { activityText } from "@/lib/activity";
import { packageMonthlyCents, potentialMonthlyCents, readClientDetail, USAGE_LABELS } from "@/lib/admin";
import { requirePlatform } from "@/lib/admin-server";
import { isUuid } from "@/lib/ids";
import { formatMoney } from "@/lib/money";
import { getOrigin } from "@/lib/origin";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { CopyLink } from "../../../[orgId]/copy-link";
import { adminRemoveMember, adminSetRole } from "../../actions";
import { AdminInviteForm, AdminSubscriptionForm } from "../../admin-forms";

export const metadata: Metadata = { title: "Cliente · Superadmin · Alinhavo" };

type Props = PageProps<"/painel/admin/clientes/[orgId]">;

export default function AdminClientePage({ params }: Props) {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Abrindo o cliente…" />}>
      <Cliente params={params} />
    </Suspense>
  );
}

const quando = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const dia = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
const money0 = (cents: number) => formatMoney(cents).replace(/,00$/, "");
const ROLES = ["owner", "admin", "modelista", "estilista", "leitura"] as const;
const HIERARCHY: { title: string; roles: string[] }[] = [
  { title: "Dono", roles: ["owner"] },
  { title: "Admin", roles: ["admin"] },
  { title: "Equipe", roles: ["modelista", "estilista", "leitura"] },
];

/** A ficha de um cliente: plano, hierarquia da equipe, uso, IA, atividade, erros e as ações de atendimento. */
async function Cliente({ params }: { params: Props["params"] }) {
  const { orgId } = await params;
  if (!isUuid(orgId)) notFound();
  const { supabase, role } = await requirePlatform(`/painel/admin/clientes/${orgId}`);
  const [{ data }, { data: errors }, origin] = await Promise.all([
    supabase.rpc("platform_client", { p_org_id: orgId }),
    supabase.rpc("platform_errors", { p_org_id: orgId, p_limit: 20 }),
    getOrigin(),
  ]);
  const c = readClientDetail(data);
  if (!c) notFound();
  const full = c.members.filter((m) => ["owner", "admin", "modelista"].includes(m.role)).length;
  const stylists = c.members.filter((m) => m.role === "estilista").length;
  const value = c.plan ? packageMonthlyCents(c.plan.planId, c.plan.status, full, stylists) : null;
  const potential = c.plan ? potentialMonthlyCents(c.plan.planId, full, stylists) : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end gap-5">
        <div className="@container w-20 shrink-0 overflow-hidden rounded-2xl border border-tinta/10">
          <OrgCover name={c.name} path={c.thumbnailPath} />
        </div>
        <PageHeader
          trail={[{ label: "Clientes", href: "/painel/admin" }, { label: c.name }]}
          eyebrow={`Cliente desde ${dia.format(new Date(c.createdAt))}`}
          title={c.name}
        />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section aria-labelledby="equipe" className={`${ui.card} space-y-4`}>
            <h2 id="equipe" className={ui.eyebrow}>
              Equipe ({c.members.length})
            </h2>
            {HIERARCHY.map((h) => {
              const people = c.members.filter((m) => h.roles.includes(m.role));
              if (people.length === 0) return null;
              return (
                <div key={h.title} className="space-y-1.5">
                  <h3 className="text-xs font-medium text-tinta-suave">{h.title}</h3>
                  <ul className="divide-y divide-tinta/10 rounded-xl border border-tinta/10">
                    {people.map((m) => (
                      <li key={m.userId} className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 text-sm">
                        <span className="min-w-0">
                          <span className="block truncate">{m.email}</span>
                          <span className="block text-xs text-tinta-suave">
                            {ROLE_LABEL[m.role] ?? m.role} · último uso {m.lastActivity ? quando.format(new Date(m.lastActivity)) : "nunca"}
                          </span>
                        </span>
                        <span className="flex flex-wrap items-center gap-2">
                          <form action={adminSetRole} className="flex items-center gap-1.5">
                            <input type="hidden" name="orgId" value={c.id} />
                            <input type="hidden" name="userId" value={m.userId} />
                            <label className="sr-only" htmlFor={`papel-${m.userId}`}>
                              Papel de {m.email}
                            </label>
                            <select id={`papel-${m.userId}`} name="role" defaultValue={m.role} className={ui.select}>
                              {ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {ROLE_LABEL[r]}
                                </option>
                              ))}
                            </select>
                            <SubmitButton variant="ghost" pendingText="…">
                              Salvar
                            </SubmitButton>
                          </form>
                          <form action={adminRemoveMember}>
                            <input type="hidden" name="orgId" value={c.id} />
                            <input type="hidden" name="userId" value={m.userId} />
                            <button type="submit" className="text-xs text-linha underline underline-offset-4">
                              Tirar
                            </button>
                          </form>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            <div className="space-y-2 border-t border-tinta/10 pt-4">
              <h3 className="text-xs font-medium text-tinta-suave">Pôr uma pessoa na organização</h3>
              <AdminInviteForm orgId={c.id} />
              {c.invites.length > 0 && (
                <ul className="space-y-2 pt-2">
                  {c.invites.map((i) => (
                    <li key={i.id} className="space-y-1.5 text-xs">
                      <p className="text-tinta-suave">
                        Convite pendente: {i.email} · {ROLE_LABEL[i.role] ?? i.role} · vence {dia.format(new Date(i.expiresAt))}
                      </p>
                      <CopyLink link={`${origin}/convite/${i.token}`} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section aria-labelledby="uso" className={`${ui.card} space-y-4`}>
            <h2 id="uso" className={ui.eyebrow}>
              Uso nos últimos 30 dias
            </h2>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {USAGE_LABELS.map(([k, label]) => (
                <div key={k} className={`rounded-xl p-3 ${c.usage[k] ? "bg-papel" : "bg-papel/40 text-tinta-suave"}`}>
                  <dt className="text-xs">{label}</dt>
                  <dd className="font-display text-2xl font-semibold">{c.usage[k] ?? 0}</dd>
                </div>
              ))}
            </dl>
            <p className="text-sm text-tinta-suave">
              IA: {c.ai.textos_produto?.n ?? 0} textos e {c.ai.foto_catalogo?.n ?? 0} fotos no período
              {Object.values(c.ai).some((a) => a.inputTokens > 0) &&
                ` · ${Object.values(c.ai)
                  .reduce((a, b) => a + b.inputTokens + b.outputTokens, 0)
                  .toLocaleString("pt-BR")} tokens`}
              .
            </p>
          </section>

          <section aria-labelledby="atividade" className={`${ui.card} space-y-3`}>
            <h2 id="atividade" className={ui.eyebrow}>
              Atividade recente
            </h2>
            {c.activity.length === 0 ? (
              <p className={ui.muted}>Nenhuma atividade ainda.</p>
            ) : (
              <ol className="space-y-2 text-sm">
                {c.activity.map((a, i) => (
                  <li key={i} className="border-l-2 border-tinta/10 pl-3">
                    <span className="font-medium">{a.email ? a.email.split("@")[0] : "A cliente"}</span> {activityText(a.action, a.meta)}
                    <span className="block font-mono text-[11px] text-tinta-suave">{quando.format(new Date(a.createdAt))}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section aria-labelledby="plano" className={`${ui.card} space-y-4`}>
            <h2 id="plano" className={ui.eyebrow}>
              Plano
            </h2>
            {c.plan ? (
              <div className="space-y-1">
                <p className="font-display text-2xl font-semibold">
                  {planName(c.plan.planId)} <span className={ui.tag}>{STATUS_LABEL[c.plan.status]}</span>
                </p>
                <p className="text-sm text-tinta-suave">
                  {full} assento(s) cheio(s), {stylists} estilista(s).{" "}
                  {value ? `Pacote: ${money0(value)}/mês.` : potential ? `Valeria ${money0(potential)}/mês como assinatura.` : ""}
                  {c.plan.status === "trial" && c.plan.trialEndsAt && ` Teste até ${dia.format(new Date(c.plan.trialEndsAt))}.`}
                </p>
              </div>
            ) : (
              <p className={ui.muted}>Sem plano registrado.</p>
            )}
            {role === "dono" ? (
              <AdminSubscriptionForm orgId={c.id} planId={c.plan?.planId ?? null} />
            ) : (
              <p className={ui.muted}>Só o dono da plataforma muda plano e teste.</p>
            )}
          </section>

          <section aria-labelledby="erros" className={`${ui.card} space-y-3`}>
            <h2 id="erros" className={ui.eyebrow}>
              Erros na tela ({errors?.length ?? 0})
            </h2>
            {!errors?.length ? (
              <p className={ui.muted}>Nenhum erro registrado.</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {errors.map((e) => (
                  <li key={e.id} className="rounded-lg bg-linha/5 px-3 py-2">
                    <p className="font-medium text-linha">{e.message}</p>
                    <p className="font-mono text-tinta-suave">
                      {e.path} · {e.user_email ?? "—"} · {quando.format(new Date(e.created_at))}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
