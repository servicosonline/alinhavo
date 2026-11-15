import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ModuleIcon } from "@/components/icons";
import { Loading, NotConfigured, PageHeader } from "@/components/page-shell";
import { SubmitButton } from "@/components/submit-button";
import { ROLE_LABEL, ui } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { MODULES } from "@/lib/modules";
import { getOrigin } from "@/lib/origin";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { cancelInvite } from "./actions";
import { CopyLink } from "./copy-link";
import { InviteForm } from "./invite-form";

export default function OrgPage({ params }: PageProps<"/painel/[orgId]">) {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Carregando organização…" />}>
      <Org params={params} />
    </Suspense>
  );
}

const MODULE_HINT: Record<string, string> = {
  colecoes: "Produtos, status, cronograma e ficha técnica",
  moldes: "Modelagem, gradação, margem de costura e Prova 3D",
  medidas: "Tamanhos e medidas por público ou cliente",
  tecidos: "Largura, gramatura e preço para o consumo",
  encaixes: "Riscos processados um de cada vez, em segundo plano",
};

const dataCurta = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

async function Org({ params }: { params: PageProps<"/painel/[orgId]">["params"] }) {
  const { orgId } = await params;
  if (!isUuid(orgId)) notFound();
  const user = await requireUser(`/painel/${orgId}`);
  const supabase = await createClient();

  const [orgRes, teamRes] = await Promise.all([
    supabase.from("orgs").select("id, name").eq("id", orgId).maybeSingle(),
    supabase.rpc("org_team", { p_org_id: orgId }),
  ]);
  // Organização alheia some na RLS: para o usuário, ela simplesmente não existe.
  if (!orgRes.data) notFound();

  const team = teamRes.data ?? [];
  const myRole = team.find((m) => m.user_id === user.id)?.role;
  const canManage = myRole === "owner" || myRole === "admin";

  const invites = canManage
    ? ((
        await supabase
          .from("invites")
          .select("id, email, role, token, expires_at")
          .eq("org_id", orgId)
          .is("accepted_at", null)
          .order("created_at")
      ).data ?? [])
    : [];
  const origin = canManage ? await getOrigin() : "";

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow={myRole ? `Seu papel: ${ROLE_LABEL[myRole] ?? myRole}` : undefined}
        title={orgRes.data.name}
        description="Do traço ao corte, no mesmo molde. Comece pela coleção ou abra um molde."
      />

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
                    <span
                      aria-hidden
                      className="text-base text-tinta-suave transition group-hover:translate-x-0.5 group-hover:text-linha"
                    >
                      →
                    </span>
                  </span>
                  <span className={`mt-1 block ${ui.muted}`}>{MODULE_HINT[m.slug]}</span>
                </span>
              </Link>
            </li>
          ))}
          {canManage && (
            <li>
              <Link
                href={`/painel/${orgId}/api`}
                className="group flex h-full items-start gap-4 rounded-2xl border border-dashed border-tinta/20 bg-papel/60 p-5 transition hover:border-tinta/40"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white font-mono text-[13px] text-tinta transition group-hover:text-linha">
                  {"{ }"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2 font-display text-xl font-semibold">
                    API
                    <span aria-hidden className="text-base text-tinta-suave transition group-hover:translate-x-0.5 group-hover:text-linha">
                      →
                    </span>
                  </span>
                  <span className={`mt-1 block ${ui.muted}`}>Chaves para o ERP ou outro sistema ler produtos, fichas e riscos</span>
                </span>
              </Link>
            </li>
          )}
        </ul>
      </nav>

      <div className="grid items-start gap-10 lg:grid-cols-2">
        <section aria-labelledby="equipe" className="space-y-4">
          <h2 id="equipe" className={ui.h2}>
            Equipe
          </h2>
          <ul className={ui.list}>
            {team.map((m) => (
              <li key={m.user_id} className="flex items-center justify-between gap-4 px-5 py-3">
                <span className="truncate">
                  {m.email}
                  {m.user_id === user.id && <span className="text-tinta-suave"> (você)</span>}
                </span>
                <span className={`shrink-0 ${ui.tag}`}>{ROLE_LABEL[m.role] ?? m.role}</span>
              </li>
            ))}
          </ul>
        </section>

        {canManage && (
          <section aria-labelledby="convidar" className="space-y-4">
            <h2 id="convidar" className={ui.h2}>
              Convidar pessoa
            </h2>
            <div className={ui.card}>
              <InviteForm orgId={orgId} />
            </div>

            {invites.length > 0 && (
              <div className="space-y-3">
                <h3 className={ui.eyebrow}>Convites pendentes</h3>
                <ul className="space-y-3">
                  {invites.map((inv) => (
                    <li key={inv.id} className={`${ui.card} space-y-3 p-4`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="truncate">
                          {inv.email} · {ROLE_LABEL[inv.role] ?? inv.role}
                        </span>
                        <span className="text-xs text-tinta-suave">
                          vence em {dataCurta.format(new Date(inv.expires_at))}
                        </span>
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
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
