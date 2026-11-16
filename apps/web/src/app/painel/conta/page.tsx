import type { Metadata } from "next";
import { Suspense } from "react";
import { Avatar } from "@/components/account/avatar";
import { AvatarCropper } from "@/components/account/avatar-cropper";
import { Container, Loading, NotConfigured, PageHeader } from "@/components/page-shell";
import { ROLE_LABEL, ui } from "@/components/ui";
import { STATUS_LABEL, displayName, planName, type SubscriptionStatus } from "@/lib/account";
import { requireUser } from "@/lib/auth";
import { formatDocument } from "@/lib/document";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { PasswordForm, ProfileForm } from "./account-forms";

export const metadata: Metadata = { title: "Minha conta · Alinhavo" };

export default function ContaPage({ searchParams }: PageProps<"/painel/conta">) {
  return (
    <Container>
      {getSupabaseConfig() ? (
        <Suspense fallback={<Loading label="Carregando a sua conta…" />}>
          <Conta searchParams={searchParams} />
        </Suspense>
      ) : (
        <NotConfigured />
      )}
    </Container>
  );
}

const card = `${ui.card} space-y-5`;

async function Conta({ searchParams }: { searchParams: PageProps<"/painel/conta">["searchParams"] }) {
  const user = await requireUser("/painel/conta");
  const fromReset = (await searchParams).senha === "nova";
  const supabase = await createClient();
  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("org_members").select("role, orgs(id, name)").eq("user_id", user.id).order("created_at"),
  ]);
  const plans = await Promise.all(
    (memberships ?? []).map(async (m) => {
      const { data } = await supabase.rpc("org_plan_status", { p_org_id: m.orgs.id });
      return { org: m.orgs, role: m.role, plan: data?.[0] ?? null };
    }),
  );
  const name = displayName(profile, user.email);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Conta" title="Minha conta" description={`Você entra com ${user.email}.`} />

      <div className="grid items-start gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className={card} aria-labelledby="conta-foto">
            <h2 id="conta-foto" className={ui.eyebrow}>
              Foto de perfil
            </h2>
            <div className="flex flex-wrap items-start gap-6">
              <Avatar name={name} path={profile?.avatar_path} size={88} />
              <div className="min-w-[280px] flex-1">
                <AvatarCropper userId={user.id} hasPhoto={Boolean(profile?.avatar_path)} />
              </div>
            </div>
          </section>

          <section className={card} aria-labelledby="conta-dados">
            <h2 id="conta-dados" className={ui.eyebrow}>
              Seus dados
            </h2>
            <ProfileForm
              firstName={profile?.first_name ?? ""}
              lastName={profile?.last_name ?? ""}
              document={formatDocument(profile?.document)}
            />
          </section>
        </div>

        <div className="space-y-6">
          <section className={card} aria-labelledby="conta-senha" id="senha">
            <h2 id="conta-senha" className={ui.eyebrow}>
              Senha
            </h2>
            <PasswordForm fromReset={fromReset} />
          </section>

          <section className={card} aria-labelledby="conta-plano">
            <h2 id="conta-plano" className={ui.eyebrow}>
              Plano e pagamento
            </h2>
            {plans.length === 0 ? (
              <p className={ui.muted}>Você ainda não está em nenhuma organização. Crie a sua no painel e ganhe 15 dias com tudo liberado.</p>
            ) : (
              <ul className="divide-y divide-tinta/10">
                {plans.map(({ org, role, plan }) => (
                  <li key={org.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{org.name}</p>
                      <p className="text-sm text-tinta-suave">
                        {ROLE_LABEL[role] ?? role}
                        {plan && ` · plano ${planName(plan.plan_id)}`}
                      </p>
                    </div>
                    {plan && (
                      <span className={plan.status === "vencida" || plan.status === "cancelada" ? ui.tagAlert : ui.tag}>
                        {STATUS_LABEL[plan.status as SubscriptionStatus]}
                        {plan.status === "trial" && plan.days_left !== null && ` · ${plan.days_left} ${plan.days_left === 1 ? "dia" : "dias"}`}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap gap-2 border-t border-tinta/10 pt-4">
              <button type="button" disabled className={ui.buttonGhost} title="Em breve">
                Forma de pagamento
              </button>
              <button type="button" disabled className={ui.buttonGhost} title="Em breve">
                Cancelar plano
              </button>
              <span className="self-center font-mono text-[11px] text-tinta-suave uppercase">Em breve</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
