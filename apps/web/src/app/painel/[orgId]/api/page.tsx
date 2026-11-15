import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loading, NotConfigured } from "@/components/page-shell";
import { SubmitButton } from "@/components/submit-button";
import { ui } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { getMyRole } from "@/lib/org-access";
import { getOrigin } from "@/lib/origin";
import { formatDate } from "@/lib/prova/approval";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { revokeApiKey } from "./actions";
import { CreateKey } from "./create-key";

export default function ApiPage({ params }: PageProps<"/painel/[orgId]/api">) {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Carregando a API…" />}>
      <Api params={params} />
    </Suspense>
  );
}

async function Api({ params }: { params: PageProps<"/painel/[orgId]/api">["params"] }) {
  const { orgId } = await params;
  if (!isUuid(orgId)) notFound();
  const user = await requireUser(`/painel/${orgId}/api`);
  const supabase = await createClient();
  const [orgRes, role] = await Promise.all([supabase.from("orgs").select("name").eq("id", orgId).maybeSingle(), getMyRole(supabase, orgId, user.id)]);
  if (!orgRes.data) notFound();
  const canManage = role === "owner" || role === "admin";
  const { data: keys } = canManage
    ? await supabase
        .from("api_keys")
        .select("id, name, prefix, created_at, last_used_at, revoked_at")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
    : { data: [] };
  const base = `${await getOrigin()}/api/v1`;

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/painel/${orgId}`} className="text-sm text-tinta-suave hover:text-tinta">
          ← {orgRes.data.name}
        </Link>
        <h1 className={`mt-2 ${ui.h1}`}>API</h1>
        <p className={`mt-1 ${ui.muted}`}>
          Para o ERP ou outro sistema ler os produtos, as fichas técnicas e os riscos desta organização. Só leitura, 60 pedidos por minuto por chave.
        </p>
      </div>

      {!canManage ? (
        <p className={ui.muted}>Só donos e admins gerenciam as chaves de API.</p>
      ) : (
        <>
          <section className={`${ui.card} space-y-4`} aria-labelledby="nova-chave">
            <h2 id="nova-chave" className={ui.h2}>
              Nova chave
            </h2>
            <CreateKey orgId={orgId} />
          </section>

          <section className={`${ui.card} space-y-3`} aria-labelledby="chaves">
            <h2 id="chaves" className={ui.h2}>
              Chaves
            </h2>
            {(keys ?? []).length === 0 ? (
              <p className={ui.muted}>Nenhuma chave ainda.</p>
            ) : (
              <ul className="divide-y divide-tinta/10 text-sm" data-api-keys>
                {(keys ?? []).map((k) => (
                  <li
                    key={k.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-2"
                    data-api-key={k.revoked_at ? "revogada" : "ativa"}
                  >
                    <span>
                      <strong>{k.name}</strong> <span className="font-mono text-xs text-tinta-suave">{k.prefix}…</span>
                      <span className="block text-xs text-tinta-suave">
                        Criada em {formatDate(k.created_at)}
                        {k.last_used_at ? ` · último uso em ${formatDate(k.last_used_at)}` : " · nunca usada"}
                        {k.revoked_at && ` · revogada em ${formatDate(k.revoked_at)}`}
                      </span>
                    </span>
                    {!k.revoked_at && (
                      <form action={revokeApiKey}>
                        <input type="hidden" name="orgId" value={orgId} />
                        <input type="hidden" name="keyId" value={k.id} />
                        <SubmitButton variant="ghost" pendingText="Revogando…">
                          Revogar
                        </SubmitButton>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <section className={`${ui.card} space-y-3 text-sm`} aria-labelledby="uso">
        <h2 id="uso" className={ui.h2}>
          Como usar
        </h2>
        <p>Mande a chave no cabeçalho de cada pedido. As respostas são JSON; medidas em mm, dinheiro em centavos.</p>
        <pre className="overflow-x-auto rounded-md bg-papel-escuro p-3 font-mono text-xs">{`curl -H "Authorization: Bearer alv_..." ${base}/produtos`}</pre>
        <ul className="list-disc space-y-1 pl-5 font-mono text-xs">
          <li>GET {base}/produtos?limite=50&amp;depois=&lt;proximo&gt;</li>
          <li>GET {base}/produtos/&lt;id&gt;</li>
          <li>GET {base}/produtos/&lt;id&gt;/ficha</li>
          <li>GET {base}/produtos/&lt;id&gt;/riscos</li>
          <li>GET {base}/colecoes</li>
        </ul>
      </section>
    </div>
  );
}
