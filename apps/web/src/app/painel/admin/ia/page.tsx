import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Loading, NotConfigured, PageHeader } from "@/components/page-shell";
import { ui } from "@/components/ui";
import { AI_KIND_LABEL, aiUsageShare } from "@/lib/admin";
import { requirePlatform } from "@/lib/admin-server";
import { aiTextRoute } from "@/lib/ai/client";
import { getSupabaseConfig } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "IA · Superadmin · Alinhavo" };

export default function AdminIaPage() {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Somando o uso de IA…" />}>
      <UsoIa />
    </Suspense>
  );
}

const num = new Intl.NumberFormat("pt-BR");

/** Uso de IA do mês por cliente: quem está perto do limite, quanto passou pela reserva (OpenAI) e os erros. */
async function UsoIa() {
  const { supabase } = await requirePlatform("/painel/admin/ia");
  const { data, error } = await supabase.rpc("platform_ai_usage", { p_org_id: null });
  const rows = (data ?? []).filter((r) => r.used > 0 || r.errors > 0 || r.custom_limit);
  rows.sort((a, b) => aiUsageShare(b.used, b.monthly_limit) - aiUsageShare(a.used, a.monthly_limit));
  const total = (k: "used" | "by_claude" | "by_openai" | "errors") => rows.reduce((s, r) => s + r[k], 0);
  const tokens = rows.reduce((s, r) => s + Number(r.input_tokens) + Number(r.output_tokens), 0);
  const route = aiTextRoute();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Superadmin"
        title="IA"
        description="Uso do mês (desde o dia 1, UTC). O limite de cada cliente muda na ficha dele (só o dono da plataforma)."
      />
      <section className={`${ui.card} grid gap-4 sm:grid-cols-4`} aria-label="Resumo">
        <Numero label="Gerações" value={total("used")} />
        <Numero label="Pela reserva (OpenAI)" value={total("by_openai")} hint="textos e fotos" />
        <Numero label="Erros" value={total("errors")} />
        <Numero label="Tokens" value={tokens} />
        <p className="text-sm text-tinta-suave sm:col-span-4">
          Textos neste ambiente:{" "}
          {route.claude === "gateway" ? "Claude pelo gateway" : route.claude === "direto" ? "Claude direto" : "Claude não configurado"}
          {route.openai ? ", com a OpenAI de reserva." : ", sem reserva (OPENAI_TEXT_MODEL não definido)."}
        </p>
      </section>
      {error && (
        <p className={ui.error} role="alert">
          Não foi possível carregar agora.
        </p>
      )}
      {rows.length === 0 ? (
        <p className={ui.muted}>Ninguém usou a IA neste mês ainda.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-tinta/10 bg-white">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="text-left">
              <tr className={ui.eyebrow}>
                <th className="px-4 py-3 font-normal">Cliente</th>
                <th className="px-4 py-3 font-normal">Tipo</th>
                <th className="px-4 py-3 text-right font-normal">Usado</th>
                <th className="px-4 py-3 text-right font-normal">Claude</th>
                <th className="px-4 py-3 text-right font-normal">OpenAI</th>
                <th className="px-4 py-3 text-right font-normal">Erros</th>
                <th className="px-4 py-3 text-right font-normal">Tokens</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tinta/10">
              {rows.map((r) => {
                const share = aiUsageShare(r.used, r.monthly_limit);
                return (
                  <tr key={`${r.org_id}-${r.kind}`}>
                    <td className="px-4 py-2.5">
                      <Link href={`/painel/admin/clientes/${r.org_id}`} className={ui.link}>
                        {r.org_name}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">{AI_KIND_LABEL[r.kind]}</td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      <span className={share >= 0.8 ? "font-medium text-linha" : ""}>
                        {r.used} / {r.monthly_limit}
                      </span>
                      {r.custom_limit && <span className="ml-1 text-tinta-suave">*</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono">{r.by_claude}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{r.by_openai}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{r.errors}</td>
                    <td className="px-4 py-2.5 text-right font-mono">{num.format(Number(r.input_tokens) + Number(r.output_tokens))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="border-t border-tinta/10 px-4 py-2 text-xs text-tinta-suave">* limite próprio do cliente. Em vermelho: 80% ou mais do limite.</p>
        </div>
      )}
    </div>
  );
}

function Numero({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div>
      <p className={ui.eyebrow}>{label}</p>
      <p className="font-display text-3xl font-semibold">{num.format(value)}</p>
      {hint && <p className="text-xs text-tinta-suave">{hint}</p>}
    </div>
  );
}
