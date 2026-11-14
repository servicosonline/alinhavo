import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loading, NotConfigured } from "@/components/page-shell";
import { SubmitButton } from "@/components/submit-button";
import { ROLE_LABEL, ui } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
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

const dataCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

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
      <div>
        <Link href="/painel" className="text-sm text-tinta-suave hover:text-tinta">
          ← Organizações
        </Link>
        <h1 className={`mt-2 ${ui.h1}`}>{orgRes.data.name}</h1>
        {myRole && <p className={`mt-1 ${ui.muted}`}>Seu papel: {ROLE_LABEL[myRole] ?? myRole}</p>}
      </div>

      <nav aria-label="Módulos" className="space-y-3">
        <Link
          href={`/painel/${orgId}/colecoes`}
          className="flex items-center justify-between rounded-lg border border-tinta/15 bg-white/70 px-5 py-4 transition hover:bg-papel-escuro"
        >
          <span>
            <span className="font-display text-xl font-semibold">Coleções</span>
            <span className={`block ${ui.muted}`}>Produtos, status e cronograma</span>
          </span>
          <span aria-hidden>→</span>
        </Link>

        <Link
          href={`/painel/${orgId}/moldes`}
          className="flex items-center justify-between rounded-lg border border-tinta/15 bg-white/70 px-5 py-4 transition hover:bg-papel-escuro"
        >
          <span>
            <span className="font-display text-xl font-semibold">Moldes</span>
            <span className={`block ${ui.muted}`}>Modelagem, gradação e margem de costura</span>
          </span>
          <span aria-hidden>→</span>
        </Link>
  
        <Link
          href={`/painel/${orgId}/medidas`}
          className="flex items-center justify-between rounded-lg border border-tinta/15 bg-white/70 px-5 py-4 transition hover:bg-papel-escuro"
        >
          <span>
            <span className="font-display text-xl font-semibold">Tabelas de medidas</span>
            <span className={`block ${ui.muted}`}>Tamanhos e medidas por público ou cliente</span>
          </span>
          <span aria-hidden>→</span>
        </Link>
      </nav>

      <section aria-labelledby="equipe" className="space-y-4">
        <h2 id="equipe" className={ui.h2}>
          Equipe
        </h2>
        <ul className="divide-y divide-tinta/10 overflow-hidden rounded-lg border border-tinta/15 bg-white/70">
          {team.map((m) => (
            <li key={m.user_id} className="flex items-center justify-between gap-4 px-5 py-3">
              <span className="truncate">
                {m.email}
                {m.user_id === user.id && <span className="text-tinta-suave"> (você)</span>}
              </span>
              <span className="shrink-0 text-sm text-tinta-suave">{ROLE_LABEL[m.role] ?? m.role}</span>
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
              <h3 className="text-sm font-medium uppercase tracking-widest text-tinta-suave">Convites pendentes</h3>
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
  );
}
