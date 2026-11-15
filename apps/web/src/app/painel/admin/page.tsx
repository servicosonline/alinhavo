import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Loading, NotConfigured, PageHeader } from "@/components/page-shell";
import { ui } from "@/components/ui";
import { STATUS_LABEL, planName, type SubscriptionStatus } from "@/lib/account";
import { CLIENT_FILTERS, matchesFilter, packageMonthlyCents, potentialMonthlyCents, type ClientFilter } from "@/lib/admin";
import { requirePlatform } from "@/lib/admin-server";
import { formatMoney } from "@/lib/money";
import { getSupabaseConfig } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Superadmin · Alinhavo" };

export default function AdminClientesPage({ searchParams }: PageProps<"/painel/admin">) {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Abrindo a plataforma…" />}>
      <Clientes searchParams={searchParams} />
    </Suspense>
  );
}

const money0 = (cents: number) => formatMoney(cents).replace(/,00$/, "");
const dia = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

/** Todos os clientes: plano, status, pessoas por papel, valor do pacote e o último uso, com filtros. */
async function Clientes({ searchParams }: { searchParams: PageProps<"/painel/admin">["searchParams"] }) {
  const { supabase } = await requirePlatform("/painel/admin");
  const raw = (await searchParams).filtro;
  const filter: ClientFilter = CLIENT_FILTERS.some((f) => f.id === raw) ? (raw as ClientFilter) : "todos";
  const { data, error } = await supabase.rpc("platform_clients");
  const all = data ?? [];
  const clients = all.filter((c) => matchesFilter(c, filter));

  // Resumo da plataforma: receita mensal dos pagantes e quanto vale converter quem está em teste.
  const mrr = all.reduce((acc, c) => acc + (packageMonthlyCents(c.plan_id, c.status, c.full_seats, c.stylist_seats) ?? 0), 0);
  const inTrial = all.filter((c) => c.status === "trial");
  const trialValue = inTrial.reduce((acc, c) => acc + (potentialMonthlyCents(c.plan_id, c.full_seats, c.stylist_seats) ?? 0), 0);
  const people = all.reduce((acc, c) => acc + c.full_seats + c.stylist_seats + c.reader_seats, 0);

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Superadmin" title="Clientes" description="Todas as organizações da plataforma. Clique numa para ver a equipe, o uso e atender." />

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-resumo-plataforma>
        <div className="rounded-2xl bg-tinta p-4 text-papel">
          <dt className="font-mono text-[11px] tracking-[0.12em] text-papel/70 uppercase">Receita por mês</dt>
          <dd className="mt-1 font-display text-3xl font-semibold">{money0(mrr)}</dd>
        </div>
        <div className="rounded-2xl border border-tinta/10 bg-white p-4">
          <dt className="font-mono text-[11px] tracking-[0.12em] text-tinta-suave uppercase">Organizações</dt>
          <dd className="mt-1 font-display text-3xl font-semibold">{all.length}</dd>
        </div>
        <div className="rounded-2xl border border-tinta/10 bg-white p-4">
          <dt className="font-mono text-[11px] tracking-[0.12em] text-tinta-suave uppercase">Em teste</dt>
          <dd className="mt-1 font-display text-3xl font-semibold">{inTrial.length}</dd>
          <dd className="text-xs text-tinta-suave">valem {money0(trialValue)}/mês se converterem</dd>
        </div>
        <div className="rounded-2xl border border-tinta/10 bg-white p-4">
          <dt className="font-mono text-[11px] tracking-[0.12em] text-tinta-suave uppercase">Pessoas</dt>
          <dd className="mt-1 font-display text-3xl font-semibold">{people}</dd>
        </div>
      </dl>

      <nav aria-label="Filtrar clientes" className="flex flex-wrap gap-2">
        {CLIENT_FILTERS.map((f) => {
          const n = all.filter((c) => matchesFilter(c, f.id)).length;
          return (
            <Link
              key={f.id}
              href={f.id === "todos" ? "/painel/admin" : `/painel/admin?filtro=${f.id}`}
              aria-current={f.id === filter ? "page" : undefined}
              className={`rounded-full px-3 py-1.5 text-sm transition ${f.id === filter ? "bg-tinta text-papel" : "border border-tinta/15 bg-white text-tinta-suave hover:text-tinta"}`}
            >
              {f.label} <span className="font-mono text-xs opacity-70">{n}</span>
            </Link>
          );
        })}
      </nav>

      {error ? (
        <p className={ui.error} role="alert">
          Não foi possível carregar os clientes agora.
        </p>
      ) : clients.length === 0 ? (
        <p className={ui.muted}>Nenhum cliente neste filtro.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-tinta/10 bg-white">
          <table className="w-full min-w-[52rem] text-sm" data-clientes>
            <thead className="border-b border-tinta/10 text-left font-mono text-[11px] tracking-wide text-tinta-suave uppercase">
              <tr>
                <th className="px-4 py-3 font-normal">Organização</th>
                <th className="px-4 py-3 font-normal">Plano</th>
                <th className="px-4 py-3 font-normal">Pessoas</th>
                <th className="px-4 py-3 font-normal">Pacote/mês</th>
                <th className="px-4 py-3 font-normal">Uso 30 dias</th>
                <th className="px-4 py-3 font-normal">Último uso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tinta/10">
              {clients.map((c) => {
                const value = packageMonthlyCents(c.plan_id, c.status, c.full_seats, c.stylist_seats);
                const potential = potentialMonthlyCents(c.plan_id, c.full_seats, c.stylist_seats);
                return (
                  <tr key={c.id} className="hover:bg-papel/60">
                    <td className="px-4 py-3">
                      <Link href={`/painel/admin/clientes/${c.id}`} className="font-medium hover:underline">
                        {c.name}
                      </Link>
                      <span className="block text-xs text-tinta-suave">desde {dia.format(new Date(c.created_at))}</span>
                    </td>
                    <td className="px-4 py-3">
                      {c.plan_id ? planName(c.plan_id) : "—"}
                      {c.status && (
                        <span className={`ml-2 ${c.status === "vencida" || c.status === "cancelada" ? ui.tagAlert : ui.tag}`}>
                          {STATUS_LABEL[c.status as SubscriptionStatus]}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {c.full_seats} cheio · {c.stylist_seats} estil. · {c.reader_seats} leit.
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {value === null ? "—" : value > 0 ? money0(value) : <span className="text-tinta-suave">{potential ? `(${money0(potential)})` : "R$ 0"}</span>}
                    </td>
                    <td className="px-4 py-3 font-mono">{c.actions_30d}</td>
                    <td className="px-4 py-3 text-xs text-tinta-suave">{c.last_activity ? dia.format(new Date(c.last_activity)) : "nunca"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-tinta-suave">
        Pacote/mês pelo preço de lançamento e os assentos de hoje (leitura não paga). Entre parênteses: quanto o cliente pagaria se o teste ou a cortesia
        virasse assinatura. Ainda não há cobrança: a receita é o que os planos ativos valeriam.
      </p>
    </div>
  );
}
