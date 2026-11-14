import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loading, NotConfigured } from "@/components/page-shell";
import { ui } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { formatDay, milestoneState, todayInBrazil } from "@/lib/collection";
import { isUuid } from "@/lib/ids";
import { canEditProducts, getMyRole } from "@/lib/org-access";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { CreateCollectionForm } from "./forms";

export default function ColecoesPage({ params }: PageProps<"/painel/[orgId]/colecoes">) {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Carregando coleções…" />}>
      <Colecoes params={params} />
    </Suspense>
  );
}

async function Colecoes({ params }: { params: PageProps<"/painel/[orgId]/colecoes">["params"] }) {
  const { orgId } = await params;
  if (!isUuid(orgId)) notFound();
  const user = await requireUser(`/painel/${orgId}/colecoes`);
  const supabase = await createClient();

  const [orgRes, role, colRes, prodRes, msRes] = await Promise.all([
    supabase.from("orgs").select("name").eq("id", orgId).maybeSingle(),
    getMyRole(supabase, orgId, user.id),
    supabase.from("collections").select("id, name, season, starts_on, launch_on").eq("org_id", orgId).is("archived_at", null).order("created_at", { ascending: false }),
    supabase.from("products").select("collection_id").eq("org_id", orgId),
    supabase.from("milestones").select("collection_id, due_on, done_at").eq("org_id", orgId),
  ]);
  if (!orgRes.data) notFound();
  const collections = colRes.data ?? [];
  const today = todayInBrazil();
  const productCount = (id: string) => (prodRes.data ?? []).filter((p) => p.collection_id === id).length;
  const lateCount = (id: string) =>
    (msRes.data ?? []).filter((m) => m.collection_id === id && milestoneState(m.due_on, m.done_at, today) === "atrasada").length;

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/painel/${orgId}`} className="text-sm text-tinta-suave hover:text-tinta">
          ← {orgRes.data.name}
        </Link>
        <h1 className={`mt-2 ${ui.h1}`}>Coleções</h1>
      </div>

      {canEditProducts(role) && (
        <div className={ui.card}>
          <CreateCollectionForm orgId={orgId} />
        </div>
      )}

      {collections.length === 0 ? (
        <p className={ui.muted}>Nenhuma coleção ainda.</p>
      ) : (
        <ul className="divide-y divide-tinta/10 overflow-hidden rounded-lg border border-tinta/15 bg-white/70" data-collections>
          {collections.map((c) => {
            const late = lateCount(c.id);
            return (
              <li key={c.id}>
                <Link
                  href={`/painel/${orgId}/colecoes/${c.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-papel-escuro"
                >
                  <span>
                    <span className="font-medium">{c.name}</span>
                    {c.season && <span className="text-tinta-suave"> · {c.season}</span>}
                    <span className="block text-xs text-tinta-suave">
                      {productCount(c.id)} {productCount(c.id) === 1 ? "produto" : "produtos"}
                      {c.launch_on && ` · lançamento ${formatDay(c.launch_on)}`}
                    </span>
                  </span>
                  {late > 0 && (
                    <span className="shrink-0 rounded bg-linha/10 px-2 py-0.5 text-xs font-medium text-linha" data-late={late}>
                      {late} {late === 1 ? "etapa atrasada" : "etapas atrasadas"}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
