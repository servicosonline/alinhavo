import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loading, NotConfigured } from "@/components/page-shell";
import { ui } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { canEditPatterns, getMyRole } from "@/lib/org-access";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { CreatePatternForm } from "./create-pattern-form";

export default function MoldesPage({ params }: PageProps<"/painel/[orgId]/moldes">) {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Carregando moldes…" />}>
      <Moldes params={params} />
    </Suspense>
  );
}

const quando = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

async function Moldes({ params }: { params: PageProps<"/painel/[orgId]/moldes">["params"] }) {
  const { orgId } = await params;
  if (!isUuid(orgId)) notFound();
  const user = await requireUser(`/painel/${orgId}/moldes`);
  const supabase = await createClient();

  const [orgRes, role, patternsRes] = await Promise.all([
    supabase.from("orgs").select("name").eq("id", orgId).maybeSingle(),
    getMyRole(supabase, orgId, user.id),
    supabase
      .from("patterns")
      .select("id, name, current_version, updated_at")
      .eq("org_id", orgId)
      .is("archived_at", null)
      .order("updated_at", { ascending: false }),
  ]);
  if (!orgRes.data) notFound();
  const patterns = patternsRes.data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/painel/${orgId}`} className="text-sm text-tinta-suave hover:text-tinta">
          ← {orgRes.data.name}
        </Link>
        <h1 className={`mt-2 ${ui.h1}`}>Moldes</h1>
      </div>

      {canEditPatterns(role) && (
        <div className={ui.card}>
          <CreatePatternForm orgId={orgId} />
        </div>
      )}

      {patterns.length === 0 ? (
        <p className={ui.muted}>Nenhum molde ainda.</p>
      ) : (
        <ul className="divide-y divide-tinta/10 overflow-hidden rounded-lg border border-tinta/15 bg-white/70">
          {patterns.map((p) => (
            <li key={p.id}>
              <Link
                href={`/painel/${orgId}/moldes/${p.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-papel-escuro"
              >
                <span className="font-medium">{p.name}</span>
                <span className="text-right text-xs text-tinta-suave">
                  {p.current_version === 0 ? "sem versão salva" : `versão ${p.current_version}`}
                  <br />
                  {quando.format(new Date(p.updated_at))}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
