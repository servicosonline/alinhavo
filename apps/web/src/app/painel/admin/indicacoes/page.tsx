import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading, NotConfigured, PageHeader } from "@/components/page-shell";
import { ui } from "@/components/ui";
import { requirePlatform } from "@/lib/admin-server";
import { REFERRAL_STATUS_LABEL } from "@/lib/referral";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { ReferralSettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Indicações · Superadmin · Alinhavo" };

export default function AdminIndicacoesPage() {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Carregando as indicações…" />}>
      <Indicacoes />
    </Suspense>
  );
}

const dia = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

/** Regras do programa de indicação (o dono muda) e todas as indicações, com o status de cada uma. */
async function Indicacoes() {
  const { supabase, role } = await requirePlatform("/painel/admin/indicacoes");
  const [{ data: settings }, { data: referrals, error }] = await Promise.all([
    supabase.from("referral_settings").select("*").maybeSingle(),
    supabase.rpc("platform_referrals", { p_limit: 200 }),
  ]);
  const rows = referrals ?? [];
  const paid = rows.filter((r) => r.status === "pagou").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Superadmin"
        title="Indicações"
        description="O desconto de quem indica e de quem é indicado. Sem meio de pagamento ainda: os descontos ficam registrados e entram quando a cobrança existir."
      />
      {settings && <ReferralSettingsForm settings={settings} canEdit={role === "dono"} />}
      <section className="space-y-3" aria-labelledby="lista-indicacoes">
        <h2 id="lista-indicacoes" className={ui.eyebrow}>
          {rows.length} {rows.length === 1 ? "indicação" : "indicações"} · {paid} {paid === 1 ? "assinou" : "assinaram"}
        </h2>
        {error ? (
          <p className={ui.error}>Não foi possível carregar as indicações.</p>
        ) : rows.length === 0 ? (
          <p className={ui.muted}>Ninguém criou conta por um link de indicação ainda.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-tinta/10 bg-white">
            <table className="w-full text-left text-sm" data-referrals>
              <thead className="text-xs text-tinta-suave">
                <tr>
                  <th className="px-4 py-2 font-normal">Quem indicou</th>
                  <th className="px-4 py-2 font-normal">Indicado</th>
                  <th className="px-4 py-2 font-normal">Status</th>
                  <th className="px-4 py-2 font-normal">Desde</th>
                  <th className="px-4 py-2 font-normal">Descontos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tinta/10">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2">{r.referrer_email ?? "(conta apagada)"}</td>
                    <td className="px-4 py-2">{r.referred_email ?? "—"}</td>
                    <td className="px-4 py-2">
                      <span className={r.status === "recusada" ? ui.tagAlert : ui.tag} title={r.reason ?? undefined}>
                        {REFERRAL_STATUS_LABEL[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-tinta-suave">{dia.format(new Date(r.created_at))}</td>
                    <td className="px-4 py-2 text-tinta-suave">{r.rewards}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
