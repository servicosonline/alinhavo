import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loading, NotConfigured } from "@/components/page-shell";
import { ScanStudio } from "@/components/scan/scan-studio";
import { ui } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { canEditPatterns, getMyRole } from "@/lib/org-access";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type Params = PageProps<"/painel/[orgId]/moldes/scan">["params"];

export default function ScanPage({ params }: PageProps<"/painel/[orgId]/moldes/scan">) {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Abrindo o Scan…" />}>
      <Scan params={params} />
    </Suspense>
  );
}

/** Scan no painel: o molde de papel fotografado vira um molde novo (versão 1, origem scan). */
async function Scan({ params }: { params: Params }) {
  const { orgId } = await params;
  if (!isUuid(orgId)) notFound();
  const back = `/painel/${orgId}/moldes`;
  const user = await requireUser(`${back}/scan`);
  const supabase = await createClient();
  const role = await getMyRole(supabase, orgId, user.id);
  if (!role) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href={back} className="text-sm text-tinta-suave hover:text-tinta">
          ← Moldes
        </Link>
        <h1 className={`mt-2 ${ui.h1}`}>Escanear molde de papel</h1>
        <p className={`mt-1 ${ui.muted}`}>A foto é lida no seu navegador; só o molde pronto vai para o servidor.</p>
      </div>
      {canEditPatterns(role) ? (
        <ScanStudio mode={{ kind: "panel", orgId }} />
      ) : (
        <p className={ui.error} role="alert">
          Só donos, admins e modelistas criam moldes.
        </p>
      )}
    </div>
  );
}
