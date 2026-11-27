import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Loading, NotConfigured, PageHeader } from "@/components/page-shell";
import { ui } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/ids";
import { formatMoney } from "@/lib/money";
import { getMyRole } from "@/lib/org-access";
import { planName } from "@/lib/account";
import { lastMonths, monthKey, monthLabel, roiFee, roiMonth, type RoiBaseline } from "@/lib/roi";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { BaselineForm, PilotsCutForm, type BaselineValues } from "./forms";

export const metadata: Metadata = { title: "Resultados · Alinhavo" };

export default function ResultadosPage({ params }: PageProps<"/painel/[orgId]/resultados">) {
  if (!getSupabaseConfig()) return <NotConfigured />;
  return (
    <Suspense fallback={<Loading label="Somando os resultados…" />}>
      <Resultados params={params} />
    </Suspense>
  );
}

const br = (n: number, digits = 1) => n.toLocaleString("pt-BR", { maximumFractionDigits: digits });
const money0 = (cents: number) => formatMoney(Math.round(cents / 100) * 100).replace(/,00$/, "");
const MONTHS = 6;

/**
 * Resultados da organização: como era antes (os números da equipe), os pilotos cortados por mês e o que o
 * app mediu (ajustes na Prova, aprovações, aproveitamento dos riscos). A economia é sempre estimativa.
 */
async function Resultados({ params }: { params: PageProps<"/painel/[orgId]/resultados">["params"] }) {
  const { orgId } = await params;
  if (!isUuid(orgId)) notFound();
  const user = await requireUser(`/painel/${orgId}/resultados`);
  const supabase = await createClient();
  const months = lastMonths(MONTHS, monthKey());
  const since = `${months[months.length - 1]}T00:00:00-03:00`;

  const [orgRes, role, setRes, monthRes, verRes, apRes, mkRes, planRes, teamRes] = await Promise.all([
    supabase.from("orgs").select("name").eq("id", orgId).maybeSingle(),
    getMyRole(supabase, orgId, user.id),
    supabase.from("roi_settings").select("*").eq("org_id", orgId).maybeSingle(),
    supabase.from("roi_months").select("month, pilots_cut").eq("org_id", orgId).gte("month", months[months.length - 1]!),
    supabase.from("pattern_versions").select("created_at").eq("org_id", orgId).eq("origin", "prova").gte("created_at", since),
    supabase.from("approvals").select("decided_at, status").eq("org_id", orgId).eq("status", "aprovado").gte("decided_at", since),
    supabase.from("markers").select("created_at, efficiency").eq("org_id", orgId).gte("created_at", since),
    supabase.rpc("org_plan_status", { p_org_id: orgId }),
    supabase.from("org_members").select("role").eq("org_id", orgId),
  ]);
  // Mensalidade de hoje (plano que vale e equipe atual), descontada de todos os meses: estimativa.
  const fee = roiFee(planRes.data?.[0] ?? null, (teamRes.data ?? []).map((m) => m.role));
  if (!orgRes.data) notFound();
  const canEdit = role === "owner" || role === "admin";
  const s = setRes.data;
  const baseline: RoiBaseline | null = s
    ? {
        pilotsPerMonth: s.pilots_per_month,
        fabricPerPilotMm: s.fabric_per_pilot_mm,
        pricePerMeterCents: s.price_per_meter_cents,
        hoursPerPilot: Number(s.hours_per_pilot),
        hourRateCents: s.hour_rate_cents,
        monthlyFabricMm: Number(s.monthly_fabric_mm),
        efficiencyPct: s.efficiency_pct === null ? null : Number(s.efficiency_pct),
        goalMonthlyCents: s.goal_monthly_cents,
      }
    : null;

  // O que o app mediu, por mês (no fuso de São Paulo).
  const inMonth = (iso: string | null, m: string) => !!iso && monthKey(new Date(iso)) === m;
  const rows = months.map((m) => {
    const effs = (mkRes.data ?? []).filter((x) => inMonth(x.created_at, m)).map((x) => Number(x.efficiency));
    const avgEfficiency = effs.length ? effs.reduce((a, b) => a + b, 0) / effs.length : null;
    const pilotsCut = (monthRes.data ?? []).find((x) => x.month === m)?.pilots_cut ?? null;
    return {
      month: m,
      pilotsCut,
      provaAdjustments: (verRes.data ?? []).filter((x) => inMonth(x.created_at, m)).length,
      approvals: (apRes.data ?? []).filter((x) => inMonth(x.decided_at, m)).length,
      markers: effs.length,
      avgEfficiency,
      roi: baseline ? roiMonth(baseline, { pilotsCut, avgEfficiency, feeCents: fee.cents }) : null,
    };
  });
  const now = rows[0]!;
  const yearProjection = now.roi ? now.roi.netCents * 12 : null;
  const feeNote =
    fee.cents === null
      ? `O plano ${planName(fee.plan)} ainda não tem preço: a conta mostra só a economia bruta.`
      : fee.charging
        ? `Mensalidade do plano ${planName(fee.plan)} com a equipe de hoje.`
        : `Plano ${planName(fee.plan)} com a equipe de hoje, pelo valor de quando assinar (ainda não é cobrado).`;

  const fmt = (n: number | null | undefined, digits = 2) => (n ? br(n, digits) : "");
  const values: BaselineValues = {
    pilots: s ? String(s.pilots_per_month) : "",
    fabric: fmt(s && s.fabric_per_pilot_mm / 1000),
    price: fmt(s && s.price_per_meter_cents / 100),
    hours: fmt(s && Number(s.hours_per_pilot)),
    rate: fmt(s && s.hour_rate_cents / 100),
    monthly: fmt(s && Number(s.monthly_fabric_mm) / 1000, 0),
    efficiency: fmt(s && s.efficiency_pct === null ? null : s && Number(s.efficiency_pct), 1),
    goal: fmt(s && s.goal_monthly_cents !== null ? s.goal_monthly_cents / 100 : null, 0),
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Resultados"
        description="Quanto o Alinhavo está deixando no caixa, comparado com como era antes. A conta usa os números que vocês informam: é uma estimativa, não uma medição."
      />

      <div className="grid items-start gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section aria-labelledby="este-mes" className="rounded-2xl bg-tinta p-6 text-papel sm:p-8">
            <h2 id="este-mes" className="font-mono text-[11px] tracking-[0.14em] text-papel/60 uppercase">
              Economia líquida estimada em {monthLabel(now.month)}
            </h2>
            {!baseline ? (
              <p className="mt-4 font-display text-2xl leading-snug font-semibold">
                Preencha &ldquo;Como era antes&rdquo; para o Alinhavo calcular a economia de cada mês.
              </p>
            ) : (
              <>
                <p className="mt-3 font-display text-[clamp(2.4rem,7vw,4rem)] leading-none font-semibold tracking-tight text-fita tabular-nums" data-economia>
                  {money0(now.roi!.netCents)}
                </p>
                <p className="mt-2 text-sm text-papel/70">
                  no mês, já tirada a mensalidade · projeção de <b className="font-mono text-papel">{money0(yearProjection!)}</b> em 12 meses
                </p>
                <dl className="mt-5 grid grid-cols-3 gap-4 rounded-xl bg-papel/5 p-4 text-sm" data-mensalidade>
                  <div>
                    <dt className="text-xs text-papel/60">Economia bruta</dt>
                    <dd className="font-mono text-papel">{money0(now.roi!.totalCents)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-papel/60">Mensalidade</dt>
                    <dd className="font-mono text-papel">{now.roi!.feeCents === null ? "—" : `− ${money0(now.roi!.feeCents)}`}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-papel/60">Retorno</dt>
                    <dd className="font-mono text-papel">{now.roi!.paybackMultiple === null ? "—" : `${br(now.roi!.paybackMultiple)}× a mensalidade`}</dd>
                  </div>
                </dl>
                <p className="mt-2 text-xs text-papel/60">{feeNote}</p>
                {now.roi!.goalProgress !== null && (
                  <div className="mt-6 space-y-1.5">
                    <div className="flex justify-between text-sm text-papel/80">
                      <span>Meta do mês: {money0(baseline.goalMonthlyCents!)}</span>
                      <span className="font-mono">{Math.round(now.roi!.goalProgress * 100)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-papel/15" aria-hidden="true">
                      <div className="h-full rounded-full bg-fita" style={{ width: `${Math.min(100, now.roi!.goalProgress * 100)}%` }} />
                    </div>
                  </div>
                )}
                <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-papel/15 pt-5 sm:grid-cols-4">
                  <div>
                    <dt className="text-xs text-papel/60">Pilotos evitados</dt>
                    <dd className="font-display text-2xl font-semibold">{now.roi!.pilotsAvoided ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-papel/60">Tecido dos pilotos</dt>
                    <dd className="font-display text-2xl font-semibold">{br(now.roi!.fabricMm / 1000)} m</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-papel/60">Horas da equipe</dt>
                    <dd className="font-display text-2xl font-semibold">{br(now.roi!.hours)} h</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-papel/60">Tecido no encaixe</dt>
                    <dd className="font-display text-2xl font-semibold">{br(now.roi!.nestingFabricMm / 1000)} m</dd>
                  </div>
                </dl>
                {now.pilotsCut === null && <p className="mt-4 text-sm text-papel/70">Informe os pilotos cortados neste mês para contar a economia dos pilotos.</p>}
              </>
            )}
          </section>

          <section aria-labelledby="medido" className={`${ui.card} space-y-4`}>
            <h2 id="medido" className={ui.eyebrow}>
              O que o Alinhavo mediu
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] text-sm">
                <thead className="text-left font-mono text-[11px] tracking-wide text-tinta-suave uppercase">
                  <tr>
                    <th className="py-2 pr-3 font-normal">Mês</th>
                    <th className="py-2 pr-3 font-normal">Pilotos cortados</th>
                    <th className="py-2 pr-3 font-normal">Ajustes na Prova</th>
                    <th className="py-2 pr-3 font-normal">Aprovações</th>
                    <th className="py-2 pr-3 font-normal">Aproveitamento</th>
                    <th className="py-2 font-normal">Economia líquida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-tinta/10">
                  {rows.map((r) => (
                    <tr key={r.month}>
                      <td className="py-2.5 pr-3 capitalize">{monthLabel(r.month)}</td>
                      <td className="py-2.5 pr-3 font-mono">{r.pilotsCut ?? "—"}</td>
                      <td className="py-2.5 pr-3 font-mono">{r.provaAdjustments}</td>
                      <td className="py-2.5 pr-3 font-mono">{r.approvals}</td>
                      <td className="py-2.5 pr-3 font-mono">{r.avgEfficiency ? `${br(r.avgEfficiency * 100)}%` : "—"}</td>
                      <td className="py-2.5 font-mono">{r.roi ? money0(r.roi.netCents) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-tinta-suave">
              Ajustes na Prova: versões do molde salvas pela Prova. Aprovações: links aprovados pela cliente. Aproveitamento: média dos riscos salvos no
              mês. Economia líquida: a bruta menos a mensalidade de hoje.
            </p>
          </section>
        </div>

        <div className="space-y-6">
          {canEdit && (
            <section className={`${ui.card} space-y-4`} aria-labelledby="pilotos-mes">
              <h2 id="pilotos-mes" className={ui.eyebrow}>
                Este mês
              </h2>
              <PilotsCutForm orgId={orgId} month={now.month} label={monthLabel(now.month)} value={now.pilotsCut} />
              {rows[1] && rows[1].pilotsCut === null && (
                <PilotsCutForm orgId={orgId} month={rows[1].month} label={monthLabel(rows[1].month)} value={null} />
              )}
            </section>
          )}
          <section className={`${ui.card} space-y-4`} aria-labelledby="antes">
            <h2 id="antes" className={ui.eyebrow}>
              Como era antes do Alinhavo
            </h2>
            <p className="text-sm text-tinta-suave">Os números de um mês normal antes de usar o Alinhavo. Servem de base para a comparação.</p>
            <BaselineForm orgId={orgId} v={values} readOnly={!canEdit} />
            {!canEdit && <p className={ui.muted}>Só dono e admin mudam estes números.</p>}
          </section>
        </div>
      </div>
    </div>
  );
}
