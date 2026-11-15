import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { NestQueue, type QueueJob } from "@/components/encaixe/nest-queue";
import { Loading, NotConfigured } from "@/components/page-shell";
import { ui } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { canEditProducts, getMyRole } from "@/lib/org-access";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type Params = PageProps<"/painel/[orgId]/encaixes">["params"];

export default function EncaixesPage({ params }: PageProps<"/painel/[orgId]/encaixes">) {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Abrindo a fila…" />}>
      <Encaixes params={params} />
    </Suspense>
  );
}

/** Fila de encaixes da organização: pedidos e o processador deste navegador. */
async function Encaixes({ params }: { params: Params }) {
  const { orgId } = await params;
  if (!isUuid(orgId)) notFound();
  const user = await requireUser(`/painel/${orgId}/encaixes`);
  const supabase = await createClient();

  const [role, jobsRes] = await Promise.all([
    getMyRole(supabase, orgId, user.id),
    supabase
      .from("nest_jobs")
      .select("id, product_id, status, progress, attempts, error, width_mm, demand, pattern_version, created_at, claimed_by, products(name, reference), markers(number)")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  if (!role) notFound();

  const jobs: QueueJob[] = (jobsRes.data ?? []).map((j) => {
    const product = j.products as unknown as { name: string; reference: string | null } | null;
    const marker = j.markers as unknown as { number: number } | null;
    return {
      id: j.id,
      productId: j.product_id,
      productName: product ? `${product.reference ? `${product.reference} · ` : ""}${product.name}` : "Produto",
      status: j.status,
      progress: Number(j.progress),
      attempts: j.attempts,
      error: j.error,
      widthMm: j.width_mm,
      demand: j.demand as Record<string, number>,
      version: j.pattern_version,
      createdAt: j.created_at,
      mine: j.claimed_by === user.id,
      markerNumber: marker?.number ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/painel/${orgId}`} className="text-sm text-tinta-suave hover:text-tinta">
          ← Painel
        </Link>
        <h1 className={`mt-2 ${ui.h1}`}>Fila de encaixes</h1>
        <p className={`mt-1 ${ui.muted}`}>
          Os pedidos rodam um de cada vez no navegador de quem liga o processador e viram riscos salvos no produto. Para pôr um pedido na fila, abra o
          encaixe de um produto.
        </p>
      </div>
      <NestQueue orgId={orgId} jobs={jobs} canProcess={canEditProducts(role)} />
    </div>
  );
}
