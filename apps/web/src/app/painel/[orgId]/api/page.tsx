import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loading, NotConfigured } from "@/components/page-shell";
import { SubmitButton } from "@/components/submit-button";
import { ui } from "@/components/ui";
import { DELIVERY_STATUS_LABEL, eventLabel, WEBHOOK_MAX } from "@/lib/api/webhooks";
import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { getMyRole } from "@/lib/org-access";
import { getOrigin } from "@/lib/origin";
import { formatDate } from "@/lib/prova/approval";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { revokeApiKey, webhookAction } from "./actions";
import { CreateKey } from "./create-key";
import { CreateWebhook } from "./create-webhook";

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
  const [{ data: hooks }, { data: deliveries }] = canManage
    ? await Promise.all([
        supabase.from("webhook_endpoints").select("id, url, events, active, created_at").eq("org_id", orgId).order("created_at"),
        supabase
          .from("webhook_deliveries")
          .select("id, endpoint_id, event, status, attempts, next_attempt_at, last_status_code, last_error, created_at")
          .eq("org_id", orgId)
          .order("created_at", { ascending: false })
          .limit(20),
      ])
    : [{ data: [] }, { data: [] }];
  const urlOf = new Map((hooks ?? []).map((h) => [h.id, h.url]));
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

          <section className={`${ui.card} space-y-4`} aria-labelledby="webhooks">
            <div>
              <h2 id="webhooks" className={ui.h2}>
                Webhooks
              </h2>
              <p className={`mt-1 text-sm ${ui.muted}`}>
                O Alinhavo avisa o seu sistema (POST com JSON assinado) quando um produto é aprovado, uma ficha técnica é gerada ou um risco é salvo.
                Falhou? Tenta de novo em 1 min, 5 min, 30 min, 2 h e 12 h. Até {WEBHOOK_MAX} por organização.
              </p>
            </div>
            <CreateWebhook orgId={orgId} disabled={(hooks ?? []).length >= WEBHOOK_MAX} />
            {(hooks ?? []).length > 0 && (
              <ul className="divide-y divide-tinta/10 text-sm" data-webhooks>
                {(hooks ?? []).map((h) => (
                  <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-2" data-webhook={h.active ? "ativo" : "desligado"}>
                    <span className="min-w-0">
                      <span className="block break-all font-mono text-xs">{h.url}</span>
                      <span className="block text-xs text-tinta-suave">
                        {h.events.map(eventLabel).join(", ")} · {h.active ? "ligado" : "desligado"} · desde {formatDate(h.created_at)}
                      </span>
                    </span>
                    <span className="flex flex-wrap gap-1">
                      {(
                        [
                          ["testar", "Mandar teste", "Enviando…"],
                          [h.active ? "desligar" : "ligar", h.active ? "Desligar" : "Ligar", "Salvando…"],
                          ["apagar", "Apagar", "Apagando…"],
                        ] as const
                      ).map(([op, label, pending]) => (
                        <form key={op} action={webhookAction}>
                          <input type="hidden" name="orgId" value={orgId} />
                          <input type="hidden" name="webhookId" value={h.id} />
                          <input type="hidden" name="op" value={op} />
                          <SubmitButton variant="ghost" pendingText={pending}>
                            {label}
                          </SubmitButton>
                        </form>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {(deliveries ?? []).length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Últimos envios</h3>
                <ul className="divide-y divide-tinta/10 text-xs" data-webhook-deliveries>
                  {(deliveries ?? []).map((d) => (
                    <li key={d.id} className="flex flex-wrap justify-between gap-2 py-1.5" data-delivery={d.status}>
                      <span className="min-w-0">
                        <strong>{eventLabel(d.event)}</strong> · {formatDate(d.created_at)}
                        <span className="block break-all text-tinta-suave">{urlOf.get(d.endpoint_id)}</span>
                      </span>
                      <span className="text-right">
                        {DELIVERY_STATUS_LABEL[d.status]}
                        {d.attempts > 1 && ` · ${d.attempts} tentativas`}
                        {d.last_error && d.status !== "entregue" && <span className="block text-tinta-suave">{d.last_error}</span>}
                        {d.status === "pendente" && d.attempts > 0 && (
                          <span className="block text-tinta-suave">Nova tentativa em {formatDate(d.next_attempt_at)}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
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
