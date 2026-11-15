import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { OnboardingCard } from "@/components/account/onboarding-card";
import { WelcomeDialog } from "@/components/account/welcome-dialog";
import { ModuleIcon } from "@/components/icons";
import { OrgCover } from "@/components/org-cover";
import { Container, Loading, NotConfigured, PageHeader } from "@/components/page-shell";
import { ROLE_LABEL, ui } from "@/components/ui";
import { displayName, onboardingSteps, trialNotice } from "@/lib/account";
import { requireUser } from "@/lib/auth";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { CreateOrgForm } from "./create-org-form";

export const metadata: Metadata = { title: "Painel · Alinhavo" };

const dataCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

export default function PainelPage() {
  return (
    <Container>
      {getSupabaseConfig() ? (
        <Suspense fallback={<Loading label="Carregando suas organizações…" />}>
          <Organizacoes />
        </Suspense>
      ) : (
        <NotConfigured />
      )}
    </Container>
  );
}

/**
 * O painel em ordem: primeiros passos (se houver), continuar de onde parou (os últimos moldes mexidos)
 * e as organizações em cards com capa, terminando no card "Nova organização".
 */
async function Organizacoes() {
  const user = await requireUser("/painel");
  const supabase = await createClient();
  const [{ data, error }, { data: profile }, { data: progress }, { data: recent }] = await Promise.all([
    supabase.from("org_members").select("role, orgs(id, name, thumbnail_path)").eq("user_id", user.id).order("created_at"),
    supabase.from("profiles").select("first_name, last_name, welcome_seen_at, onboarding_closed_at").eq("user_id", user.id).maybeSingle(),
    supabase.rpc("onboarding_progress"),
    // A RLS já devolve só moldes das organizações da pessoa.
    supabase
      .from("patterns")
      .select("id, name, org_id, current_version, updated_at")
      .is("archived_at", null)
      .order("updated_at", { ascending: false })
      .limit(4),
  ]);

  if (error) {
    return (
      <p className={ui.error} role="alert">
        Não foi possível carregar suas organizações.
      </p>
    );
  }

  const orgs = data ?? [];
  // Primeiro acesso: boas-vindas uma vez; primeiros passos até a pessoa pular ou concluir.
  const welcome = !profile?.welcome_seen_at ? <WelcomeDialog name={profile?.first_name ?? displayName(null, user.email)} /> : null;
  const steps = progress?.[0] ? onboardingSteps(progress[0], orgs[0]?.orgs.id ?? null) : [];
  const showSteps = !profile?.onboarding_closed_at && steps.some((s) => !s.done);

  if (orgs.length === 0) {
    return (
      <div className="mx-auto max-w-md">
        {welcome}
        <PageHeader
          eyebrow="Primeiro passo"
          title="Boas-vindas ao Alinhavo"
          description="Crie a sua confecção ou o seu ateliê e ganhe 15 dias com tudo liberado. Se alguém já te convidou, abra o link do convite."
        />
        <div className={`mt-8 ${ui.card}`}>
          <CreateOrgForm />
        </div>
      </div>
    );
  }

  const plans = await Promise.all(orgs.map(async (m) => (await supabase.rpc("org_plan_status", { p_org_id: m.orgs.id })).data?.[0] ?? null));
  const orgName = (id: string) => orgs.find((m) => m.orgs.id === id)?.orgs.name ?? "";

  return (
    <div className="space-y-10">
      {welcome}
      <PageHeader
        title={profile?.first_name ? `Olá, ${profile.first_name}.` : "Suas organizações"}
        description="Continue de onde parou ou escolha onde trabalhar."
      />

      {showSteps && <OnboardingCard steps={steps} />}

      {recent && recent.length > 0 && (
        <section aria-labelledby="continuar" className="space-y-4">
          <h2 id="continuar" className={ui.eyebrow}>
            Continuar de onde parou
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {recent.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/painel/${p.org_id}/moldes/${p.id}`}
                  className="group flex h-full items-center gap-4 rounded-2xl border border-tinta/10 bg-white p-4 transition hover:border-tinta/30"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-papel text-tinta transition group-hover:text-linha">
                    <ModuleIcon name="moldes" className="size-6" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{p.name}</span>
                    <span className="block truncate text-xs text-tinta-suave">
                      {orgName(p.org_id)} · v{p.current_version} · {dataCurta.format(new Date(p.updated_at))}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="organizacoes" className="space-y-4">
        <h2 id="organizacoes" className={ui.eyebrow}>
          Organizações
        </h2>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6" data-orgs>
          {orgs.map((m, i) => {
            const notice = trialNotice(plans[i]);
            return (
              <li key={m.orgs.id}>
                <Link
                  href={`/painel/${m.orgs.id}`}
                  className="group block h-full overflow-hidden rounded-2xl border border-tinta/10 bg-white transition hover:-translate-y-0.5 hover:border-tinta/30 hover:shadow-[0_18px_36px_-24px_rgb(29_27_24/0.5)]"
                >
                  <div className="@container border-b border-tinta/10">
                    <OrgCover name={m.orgs.name} path={m.orgs.thumbnail_path} />
                  </div>
                  <div className="space-y-1.5 p-4">
                    <p className="truncate font-display text-lg leading-tight font-semibold">{m.orgs.name}</p>
                    <p className="flex flex-wrap items-center gap-1.5">
                      <span className={ui.tag}>{ROLE_LABEL[m.role] ?? m.role}</span>
                      {notice && <span className={notice.tone === "alerta" ? ui.tagAlert : ui.tag}>{notice.text.replace("Teste grátis: ", "Teste: ")}</span>}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
          <li className="has-[details[open]]:col-span-2">
            <details className="group/nova h-full rounded-2xl border-2 border-dashed border-tinta/20 bg-papel/60 transition hover:border-tinta/40">
              <summary className="flex aspect-square cursor-pointer list-none flex-col items-center justify-center gap-2 p-4 text-center group-open/nova:aspect-auto group-open/nova:items-start [&::-webkit-details-marker]:hidden">
                <span className="grid size-11 place-items-center rounded-full border border-tinta/25 font-mono text-xl" aria-hidden="true">
                  +
                </span>
                <span className="font-medium">Nova organização</span>
                <span className="text-xs text-tinta-suave">15 dias com tudo liberado</span>
              </summary>
              <div className="px-4 pb-4">
                <CreateOrgForm />
              </div>
            </details>
          </li>
        </ul>
      </section>
    </div>
  );
}
