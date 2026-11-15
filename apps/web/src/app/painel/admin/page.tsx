import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loading, NotConfigured, PageHeader } from "@/components/page-shell";
import { ProductionTimesView } from "@/components/production-times-view";
import { ui } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { readProductionTimes } from "@/lib/production-times";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Área do superadmin da plataforma: tempo de produção de todas as
 * organizações juntas ou de uma (`?org=`). Quem não é superadmin recebe 404
 * (a área não existe para ele). Superadmin entra só por SQL (docs/07-deploy.md).
 */
export default function AdminPage({ searchParams }: PageProps<"/painel/admin">) {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Abrindo a plataforma…" />}>
      <Admin searchParams={searchParams} />
    </Suspense>
  );
}

const dataCurta = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

async function Admin({ searchParams }: { searchParams: PageProps<"/painel/admin">["searchParams"] }) {
  await requireUser("/painel/admin");
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("am_platform_admin");
  if (isAdmin !== true) notFound();

  const raw = (await searchParams).org;
  const orgId = typeof raw === "string" && isUuid(raw) ? raw : null;
  const [orgsRes, timesRes] = await Promise.all([
    supabase.rpc("platform_orgs"),
    supabase.rpc("production_stage_times", { p_org_id: orgId }),
  ]);
  const orgs = orgsRes.data ?? [];
  const chosen = orgId ? orgs.find((o) => o.id === orgId) : null;
  if (orgId && !chosen) notFound();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Superadmin"
        title="Tempo de produção"
        description={chosen ? `Organização: ${chosen.name}.` : `Todas as organizações juntas (${orgs.length}).`}
        actions={
          chosen ? (
            <Link href="/painel/admin" className={ui.buttonGhost}>
              Ver todas
            </Link>
          ) : undefined
        }
      />
      {timesRes.error ? (
        <p className={ui.error} role="alert">
          Não foi possível calcular agora. Tente de novo em instantes.
        </p>
      ) : (
        <ProductionTimesView times={readProductionTimes(timesRes.data ?? [])} />
      )}

      <section aria-labelledby="orgs" className="space-y-3">
        <h2 id="orgs" className={ui.h2}>
          Organizações
        </h2>
        {orgs.length === 0 ? (
          <p className={ui.muted}>Nenhuma organização ainda.</p>
        ) : (
          <ul className={ui.list}>
            {orgs.map((o) => (
              <li key={o.id}>
                <Link href={`/painel/admin?org=${o.id}`} className={`${ui.row} ${o.id === orgId ? "bg-papel" : ""}`} data-admin-org={o.id}>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{o.name}</span>
                    <span className="text-xs text-tinta-suave">desde {dataCurta.format(new Date(o.created_at))}</span>
                  </span>
                  <span className="shrink-0 text-xs text-tinta-suave">
                    {o.members} {o.members === 1 ? "membro" : "membros"} · {o.products} {o.products === 1 ? "produto" : "produtos"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
