import Link from "next/link";
import { Suspense } from "react";
import { Container } from "@/components/page-shell";
import { trialNotice } from "@/lib/account";
import { isUuid } from "@/lib/ids";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { ModuleNav } from "./module-nav";

/** Painel de uma organização: barra com o nome e os módulos, e a coluna de conteúdo. */
export default function OrgLayout({ children, params }: LayoutProps<"/painel/[orgId]">) {
  return (
    <>
      {getSupabaseConfig() && (
        <Suspense fallback={<div className="h-[6.25rem] border-b border-tinta/10 bg-papel sm:h-[3.25rem]" />}>
          <OrgBar params={params} />
        </Suspense>
      )}
      <Container>{children}</Container>
    </>
  );
}

async function OrgBar({ params }: { params: LayoutProps<"/painel/[orgId]">["params"] }) {
  const { orgId } = await params;
  if (!isUuid(orgId)) return null;
  const supabase = await createClient();
  // Organização alheia some na RLS: a página mostra o 404, a barra não aparece.
  const [{ data }, { data: plan }] = await Promise.all([
    supabase.from("orgs").select("name").eq("id", orgId).maybeSingle(),
    supabase.rpc("org_plan_status", { p_org_id: orgId }),
  ]);
  const notice = trialNotice(plan?.[0] ?? null);
  if (!data) return null;
  return (
    <div className="border-b border-tinta/10 bg-papel">
      <div className="flex w-full flex-col gap-x-6 px-4 sm:flex-row sm:items-center sm:px-6 lg:px-10">
        <div className="flex min-w-0 items-center gap-2 pt-3 sm:pt-0">
          <span className="truncate font-display text-lg font-semibold" data-org-name>
            {data.name}
          </span>
          <Link
            href="/painel"
            className="shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[11px] tracking-wide text-tinta-suave uppercase hover:bg-papel-escuro hover:text-tinta"
          >
            Trocar
          </Link>
        </div>
        <ModuleNav orgId={orgId} />
        {notice && (
          <Link
            href="/painel/conta"
            className={`mb-3 self-start rounded-full px-3 py-1 font-mono text-[11px] whitespace-nowrap sm:mb-0 sm:ml-auto sm:self-center ${notice.tone === "alerta" ? "bg-linha/10 text-linha" : "border border-tinta/15 text-tinta-suave hover:text-tinta"}`}
            data-trial
          >
            {notice.text}
          </Link>
        )}
      </div>
    </div>
  );
}
