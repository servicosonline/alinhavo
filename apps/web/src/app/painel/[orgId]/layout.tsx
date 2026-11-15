import Link from "next/link";
import { Suspense } from "react";
import { Container } from "@/components/page-shell";
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
  const { data } = await supabase.from("orgs").select("name").eq("id", orgId).maybeSingle();
  if (!data) return null;
  return (
    <div className="border-b border-tinta/10 bg-papel">
      <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-x-6 px-4 sm:flex-row sm:items-center sm:px-6">
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
      </div>
    </div>
  );
}
