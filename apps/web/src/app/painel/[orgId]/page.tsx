import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ModuleIcon } from "@/components/icons";
import { OrgCover } from "@/components/org-cover";
import { Loading, NotConfigured, PageHeader } from "@/components/page-shell";
import { ROLE_LABEL, ui } from "@/components/ui";
import { activityText, activityWho } from "@/lib/activity";
import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { MODULES } from "@/lib/modules";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default function OrgPage({ params }: PageProps<"/painel/[orgId]">) {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Carregando organização…" />}>
      <Org params={params} />
    </Suspense>
  );
}

const MODULE_HINT: Record<string, string> = {
  colecoes: "Produtos, status, prazos, cronograma e ficha técnica",
  moldes: "Modelagem, gradação, margem de costura e Prova 3D",
  medidas: "Tamanhos e medidas por público ou cliente",
  tecidos: "Largura, gramatura e preço para o consumo",
  encaixes: "Riscos processados um de cada vez, em segundo plano",
  resultados: "Quanto o Alinhavo deixa no caixa, comparado com antes",
};

const quando = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

/**
 * Início da organização: capa e nome, o botão de configurações (dono e admin), os módulos na ordem do
 * trabalho e, para dono e admin, o que a equipe fez por último (registro de atividade).
 * Equipe, convites e API ficam em Configurações.
 */
async function Org({ params }: { params: PageProps<"/painel/[orgId]">["params"] }) {
  const { orgId } = await params;
  if (!isUuid(orgId)) notFound();
  const user = await requireUser(`/painel/${orgId}`);
  const supabase = await createClient();
  const [orgRes, teamRes] = await Promise.all([
    supabase.from("orgs").select("id, name, thumbnail_path").eq("id", orgId).maybeSingle(),
    supabase.rpc("org_team", { p_org_id: orgId }),
  ]);
  // Organização alheia some na RLS: para o usuário, ela simplesmente não existe.
  if (!orgRes.data) notFound();
  const team = teamRes.data ?? [];
  const myRole = team.find((m) => m.user_id === user.id)?.role;
  const canManage = myRole === "owner" || myRole === "admin";
  // A RLS só devolve o registro para dono e admin.
  const activity = canManage
    ? ((await supabase.from("activity_log").select("id, user_id, action, meta, created_at").eq("org_id", orgId).order("id", { ascending: false }).limit(10)).data ?? [])
    : [];
  const emails = new Map(team.map((m) => [m.user_id, m.email]));

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex min-w-0 items-center gap-5">
          <div className="@container hidden w-20 shrink-0 overflow-hidden rounded-2xl border border-tinta/10 sm:block">
            <OrgCover name={orgRes.data.name} path={orgRes.data.thumbnail_path} />
          </div>
          <PageHeader
            eyebrow={myRole ? `Seu papel: ${ROLE_LABEL[myRole] ?? myRole} · ${team.length} ${team.length === 1 ? "pessoa" : "pessoas"}` : undefined}
            title={orgRes.data.name}
            description="Do traço ao corte, no mesmo molde. Comece pela coleção ou abra um molde."
          />
        </div>
        <Link href={`/painel/${orgId}/configuracoes`} className={ui.buttonSecondary} data-configuracoes>
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <path d="M4 7h10M18 7h2M4 17h4M12 17h8" strokeLinecap="round" />
            <circle cx="16" cy="7" r="2" />
            <circle cx="10" cy="17" r="2" />
          </svg>
          {canManage ? "Equipe, convites e API" : "Equipe"}
        </Link>
      </div>

      <div className={`grid items-start gap-8 ${canManage ? "xl:grid-cols-[1fr_24rem]" : ""}`}>
        <nav aria-label="Módulos da organização">
          <ul className="grid gap-3 sm:grid-cols-2">
            {MODULES.filter((m) => m.slug).map((m) => (
              <li key={m.slug}>
                <Link
                  href={`/painel/${orgId}/${m.slug}`}
                  className="group flex h-full items-start gap-4 rounded-2xl border border-tinta/10 bg-white p-5 transition hover:border-tinta/30"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-papel text-tinta transition group-hover:text-linha">
                    <ModuleIcon name={m.icon} className="size-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2 font-display text-xl font-semibold">
                      {m.label}
                      <span aria-hidden className="text-base text-tinta-suave transition group-hover:translate-x-0.5 group-hover:text-linha">
                        →
                      </span>
                    </span>
                    <span className={`mt-1 block ${ui.muted}`}>{MODULE_HINT[m.slug]}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {canManage && (
          <section aria-labelledby="atividade" className={`${ui.card} space-y-4`}>
            <h2 id="atividade" className={ui.eyebrow}>
              Atividade recente
            </h2>
            {activity.length === 0 ? (
              <p className={ui.muted}>Nada por aqui ainda. O que a equipe fizer (moldes, provas, aprovações) aparece aqui.</p>
            ) : (
              <ol className="space-y-3" data-atividade>
                {activity.map((a) => (
                  <li key={a.id} className="border-l-2 border-tinta/10 pl-3 text-sm">
                    <span className="font-medium">{activityWho(a.user_id, emails)}</span> {activityText(a.action, a.meta)}
                    <span className="block font-mono text-[11px] text-tinta-suave">{quando.format(new Date(a.created_at))}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
