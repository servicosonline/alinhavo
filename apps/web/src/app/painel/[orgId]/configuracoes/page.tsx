import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OrgCover } from "@/components/org-cover";
import { Loading, NotConfigured, PageHeader } from "@/components/page-shell";
import { SubmitButton } from "@/components/submit-button";
import { ROLE_LABEL, ui } from "@/components/ui";
import { STATUS_LABEL, planName, type SubscriptionStatus } from "@/lib/account";
import { effectivePlan, planAllows } from "@/lib/plans";
import { PlanLock } from "@/components/plan-lock";
import type { TeamRole } from "@/lib/invite-price";
import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { getOrigin } from "@/lib/origin";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { cancelInvite } from "../actions";
import { CopyLink } from "../copy-link";
import { InviteForm } from "../invite-form";
import { changeMemberRole, removeMember, setMemberCanCreateOrgs } from "./actions";
import { OrgCoverCropper, RenameOrgForm } from "./settings-forms";
import { SettingsTabs, type SettingsTab } from "./settings-tabs";

export const metadata: Metadata = { title: "Configurações · Alinhavo" };

type Props = PageProps<"/painel/[orgId]/configuracoes">;

export default function ConfiguracoesPage({ params, searchParams }: Props) {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Carregando as configurações…" />}>
      <Configuracoes params={params} searchParams={searchParams} />
    </Suspense>
  );
}

const dataCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
const ROLES = ["owner", "admin", "modelista", "estilista", "leitura"] as const;

async function Configuracoes({ params, searchParams }: Pick<Props, "params" | "searchParams">) {
  const { orgId } = await params;
  if (!isUuid(orgId)) notFound();
  const aba = (await searchParams).aba;
  const tab: SettingsTab = aba === "equipe" || aba === "convidar" ? aba : "geral";
  const user = await requireUser(`/painel/${orgId}/configuracoes`);
  const supabase = await createClient();
  const [orgRes, teamRes, planRes, creationRes] = await Promise.all([
    supabase.from("orgs").select("id, name, thumbnail_path").eq("id", orgId).maybeSingle(),
    supabase.rpc("org_team", { p_org_id: orgId }),
    supabase.rpc("org_plan_status", { p_org_id: orgId }),
    supabase.from("org_members").select("user_id, can_create_orgs").eq("org_id", orgId),
  ]);
  const canCreateOf = new Map((creationRes.data ?? []).map((m) => [m.user_id, m.can_create_orgs]));
  if (!orgRes.data) notFound();
  const org = orgRes.data;
  const team = teamRes.data ?? [];
  const myRole = team.find((m) => m.user_id === user.id)?.role;
  const canManage = myRole === "owner" || myRole === "admin";
  const plan = planRes.data?.[0];

  return (
    <div className="space-y-6">
      <PageHeader trail={[{ label: org.name, href: `/painel/${orgId}` }, { label: "Configurações" }]} title="Configurações" />
      <SettingsTabs orgId={orgId} current={tab} />

      {tab === "geral" &&
        (canManage ? (
          <div className="grid items-start gap-6 lg:grid-cols-[1fr_1fr]">
            <section className={`${ui.card} space-y-5`} aria-labelledby="capa">
              <h2 id="capa" className={ui.eyebrow}>
                Capa
              </h2>
              <div className="flex flex-wrap items-start gap-6">
                <div className="@container w-36 shrink-0 overflow-hidden rounded-2xl border border-tinta/10">
                  <OrgCover name={org.name} path={org.thumbnail_path} />
                </div>
                <div className="min-w-[280px] flex-1">
                  <OrgCoverCropper orgId={orgId} hasCover={Boolean(org.thumbnail_path)} />
                </div>
              </div>
            </section>
            <div className="space-y-6">
              <section className={`${ui.card} space-y-5`} aria-labelledby="nome">
                <h2 id="nome" className={ui.eyebrow}>
                  Nome
                </h2>
                <RenameOrgForm orgId={orgId} name={org.name} />
              </section>
              {plan && (
                <section className={`${ui.card} space-y-2`} aria-labelledby="plano">
                  <h2 id="plano" className={ui.eyebrow}>
                    Plano
                  </h2>
                  <p>
                    {planName(plan.plan_id)} · {STATUS_LABEL[plan.status as SubscriptionStatus]}
                    {plan.status === "trial" && plan.days_left !== null && ` · faltam ${plan.days_left} dias`}
                  </p>
                  <p className={ui.muted}>A escolha do plano e o pagamento chegam em breve.</p>
                </section>
              )}
            </div>
          </div>
        ) : (
          <p className={ui.muted}>Só dono e admin mudam o nome e a capa da organização.</p>
        ))}

      {tab === "equipe" && (
        <section aria-label="Equipe" className="space-y-3">
          <p className={ui.muted}>
            {team.length} {team.length === 1 ? "pessoa" : "pessoas"} na organização. Dono e admin mudam papéis; a organização nunca fica sem dono.
          </p>
          <ul className={ui.list}>
            {team.map((m) => {
              const me = m.user_id === user.id;
              // Admin não mexe em dono nem promove a dono (a RLS confere de novo).
              const editable = canManage && !me && (myRole === "owner" || m.role !== "owner");
              return (
                <li key={m.user_id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <span className="min-w-0 truncate">
                    {m.email}
                    {me && <span className="text-tinta-suave"> (você)</span>}
                    <span className="block text-xs text-tinta-suave">
                      desde {dataCurta.format(new Date(m.joined_at))}
                      {m.role !== "owner" && (canCreateOf.get(m.user_id) ? " · pode criar organizações" : " · não cria organizações")}
                    </span>
                  </span>
                  {editable ? (
                    <span className="flex flex-wrap items-center gap-2">
                      <form action={changeMemberRole} className="flex items-center gap-2">
                        <input type="hidden" name="orgId" value={orgId} />
                        <input type="hidden" name="userId" value={m.user_id} />
                        <label className="sr-only" htmlFor={`papel-${m.user_id}`}>
                          Papel de {m.email}
                        </label>
                        <select id={`papel-${m.user_id}`} name="role" defaultValue={m.role} className={ui.select}>
                          {ROLES.filter((r) => myRole === "owner" || r !== "owner").map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABEL[r]}
                            </option>
                          ))}
                        </select>
                        <SubmitButton variant="ghost" pendingText="Salvando…">
                          Salvar
                        </SubmitButton>
                      </form>
                      {m.role !== "owner" && (
                        <form action={setMemberCanCreateOrgs} data-member-can-create={canCreateOf.get(m.user_id) ? "sim" : "nao"}>
                          <input type="hidden" name="orgId" value={orgId} />
                          <input type="hidden" name="userId" value={m.user_id} />
                          <input type="hidden" name="allow" value={canCreateOf.get(m.user_id) ? "0" : "1"} />
                          <SubmitButton variant="ghost" pendingText="Salvando…">
                            {canCreateOf.get(m.user_id) ? "Travar criar organizações" : "Liberar criar organizações"}
                          </SubmitButton>
                        </form>
                      )}
                      <form action={removeMember}>
                        <input type="hidden" name="orgId" value={orgId} />
                        <input type="hidden" name="userId" value={m.user_id} />
                        <button type="submit" className="text-sm text-linha underline underline-offset-4">
                          Tirar da equipe
                        </button>
                      </form>
                    </span>
                  ) : (
                    <span className={`shrink-0 ${ui.tag}`}>{ROLE_LABEL[m.role] ?? m.role}</span>
                  )}
                </li>
              );
            })}
          </ul>
          {myRole !== "owner" && (
            <form action={removeMember} className="pt-2">
              <input type="hidden" name="orgId" value={orgId} />
              <input type="hidden" name="userId" value={user.id} />
              <button type="submit" className="text-sm text-tinta-suave underline underline-offset-4 hover:text-linha">
                Sair desta organização
              </button>
            </form>
          )}
        </section>
      )}

      {tab === "convidar" &&
        (canManage ? (
          <Convidar
            orgId={orgId}
            planId={plan?.plan_id ?? null}
            status={plan?.status ?? null}
            members={team.map((m) => m.role)}
            teamAllowed={planAllows(effectivePlan(plan ?? null), "equipe")}
          />
        ) : (
          <p className={ui.muted}>Só dono e admin convidam pessoas.</p>
        ))}

      <p className="pt-4 text-sm text-tinta-suave">
        <Link href={`/painel/${orgId}`} className={ui.link}>
          Voltar para {org.name}
        </Link>
      </p>
    </div>
  );
}

async function Convidar({
  orgId,
  planId,
  status,
  members,
  teamAllowed,
}: {
  orgId: string;
  planId: string | null;
  status: SubscriptionStatus | null;
  members: TeamRole[];
  /** O plano deixa chamar mais gente (o Grátis é para 1 pessoa). */
  teamAllowed: boolean;
}) {
  const supabase = await createClient();
  const [{ data: invites }, origin] = await Promise.all([
    supabase.from("invites").select("id, email, role, token, expires_at").eq("org_id", orgId).is("accepted_at", null).order("created_at"),
    getOrigin(),
  ]);
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_1fr]">
      <section className={`${ui.card} space-y-4`} aria-labelledby="novo-convite">
        <h2 id="novo-convite" className={ui.eyebrow}>
          Convidar pessoa
        </h2>
        <p className={ui.muted}>Modelagem e gestão pagam assento cheio; estilista tem preço menor; só leitura não paga.</p>
        {teamAllowed ? (
          <InviteForm orgId={orgId} planId={planId} status={status} members={members} pending={(invites ?? []).map((i) => i.role)} />
        ) : (
          <PlanLock feature="equipe" />
        )}
      </section>
      <section className="space-y-3" aria-labelledby="pendentes">
        <h2 id="pendentes" className={ui.eyebrow}>
          Convites pendentes
        </h2>
        {!invites?.length ? (
          <p className={ui.muted}>Nenhum convite esperando resposta.</p>
        ) : (
          <ul className="space-y-3">
            {invites.map((inv) => (
              <li key={inv.id} className={`${ui.card} space-y-3 p-4`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="truncate">
                    {inv.email} · {ROLE_LABEL[inv.role] ?? inv.role}
                  </span>
                  <span className="text-xs text-tinta-suave">vence em {dataCurta.format(new Date(inv.expires_at))}</span>
                </div>
                <CopyLink link={`${origin}/convite/${inv.token}`} />
                <form action={cancelInvite}>
                  <input type="hidden" name="orgId" value={orgId} />
                  <input type="hidden" name="inviteId" value={inv.id} />
                  <SubmitButton variant="ghost" pendingText="Cancelando…">
                    Cancelar convite
                  </SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
