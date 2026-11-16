"use client";

import Link from "next/link";
import { useState } from "react";
import { formatMoney } from "@/lib/money";
import {
  ANNUAL_MONTHS,
  FOUNDER,
  SEAT_LIMIT,
  clampSeats,
  clampStylists,
  hasPrice,
  planChargeCents,
  publishedPlans,
  type Billing,
  type Plan,
} from "@/lib/plans";

const money0 = (cents: number) => formatMoney(cents).replace(/,00$/, "");
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/** − 2 usuários + : muda a quantidade e o total do cartão em tempo real. */
function Stepper({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: [string, string];
  onChange: (n: number) => void;
}) {
  const btn =
    "grid size-9 place-items-center rounded-lg border border-tinta/20 font-mono text-lg hover:border-tinta disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <div className="flex items-center justify-between gap-3" role="group" aria-label={label}>
      <span className="text-sm text-tinta-suave">{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" className={btn} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label={`Menos um: ${label}`}>
          −
        </button>
        <span className="min-w-[6.5rem] text-center font-mono text-[15px]" aria-live="polite">
          {plural(value, unit[0], unit[1])}
        </span>
        <button type="button" className={btn} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label={`Mais um: ${label}`}>
          +
        </button>
      </div>
    </div>
  );
}

function PlanCard({ plan, billing }: { plan: Plan; billing: Billing }) {
  const [full, setFull] = useState(plan.minUsuarios);
  const [stylists, setStylists] = useState(0);
  const paid = plan.id !== "gratis";
  const priced = paid && hasPrice(plan);
  const seats = { full, stylists };
  const total = planChargeCents(plan, seats, billing);
  const max = Math.min(plan.maxUsuarios ?? SEAT_LIMIT, SEAT_LIMIT);
  const withStylists = plan.precoEstilistaCents !== undefined;

  return (
    <div
      className={
        plan.destaque
          ? "flex flex-col rounded-2xl border-2 border-linha bg-white p-7 lg:-translate-y-3 lg:shadow-[0_24px_50px_-28px_rgb(196_58_38/0.6)]"
          : "flex flex-col rounded-2xl border border-tinta/10 bg-white p-7"
      }
      data-plano={plan.id}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-2xl font-semibold">{plan.nome}</p>
        {plan.trialDias > 0 && (
          <span
            className={
              plan.destaque
                ? "rounded-full bg-linha px-2.5 py-0.5 font-mono text-[11px] text-white"
                : "rounded-full border border-tinta/25 px-2.5 py-0.5 font-mono text-[11px] text-tinta-suave"
            }
          >
            {plan.trialDias} dias grátis
          </span>
        )}
      </div>
      <p className="mt-1 text-tinta-suave">{plan.publico}</p>

      {!paid ? (
        <p className="mt-6 font-display text-4xl font-semibold">R$ 0</p>
      ) : priced ? (
        <>
          <p className="mt-6 font-display text-4xl font-semibold tabular-nums">
            {money0(billing === "anual" ? plan.precoPorUsuarioCents * ANNUAL_MONTHS : plan.precoPorUsuarioCents)}
            <span className="ml-1 font-sans text-base font-normal text-tinta-suave">
              por usuário/{billing === "anual" ? "ano" : "mês"}
            </span>
          </p>
          {withStylists && (
            <p className="mt-1 text-sm text-tinta-suave">
              Estilista {money0(billing === "anual" ? plan.precoEstilistaCents! * ANNUAL_MONTHS : plan.precoEstilistaCents!)}
              {plan.leituraGratis && " · Leitura grátis, sem limite"}
            </p>
          )}
          <div className="mt-5 grid gap-2.5 rounded-xl bg-papel p-3.5">
            <Stepper
              label={withStylists ? "Modelagem e gestão" : "Usuários"}
              value={full}
              min={plan.minUsuarios}
              max={max}
              unit={["pessoa", "pessoas"]}
              onChange={(n) => setFull(clampSeats(plan, n))}
            />
            {withStylists && (
              <Stepper label="Estilistas" value={stylists} min={0} max={SEAT_LIMIT} unit={["pessoa", "pessoas"]} onChange={(n) => setStylists(clampStylists(plan, n))} />
            )}
            <p className="flex items-baseline justify-between gap-3 border-t border-tinta/10 pt-2.5">
              <span className="text-sm">Total</span>
              <span className="font-display text-2xl font-semibold tabular-nums" aria-live="polite">
                {money0(total ?? 0)}
                <span className="ml-1 font-sans text-sm font-normal text-tinta-suave">/{billing === "anual" ? "ano" : "mês"}</span>
              </span>
            </p>
          </div>
        </>
      ) : (
        <p className="mt-6 font-display text-4xl font-semibold">Em breve</p>
      )}

      <ul className="mt-6 grid gap-2 text-[15px]">
        {plan.recursos.map((r) => (
          <li key={r}>{r}</li>
        ))}
        {paid && !priced && <li>Preço por usuário</li>}
        {!paid && <li>1 usuário</li>}
      </ul>

      {paid && (
        <Link
          href="/entrar?modo=criar"
          className={`mt-auto pt-7 ${plan.destaque ? "text-linha" : "text-tinta"} font-medium underline decoration-current/30 underline-offset-4 hover:decoration-current`}
        >
          Testar {plan.trialDias} dias grátis →
        </Link>
      )}
    </div>
  );
}

/**
 * Os cartões de preço, lidos de lib/plans.ts: chave Mensal | Anual (anual = 10 mensalidades),
 * seletor de usuários (no Confecção, assentos cheios e de estilista) e o total em tempo real.
 */
export function PlanCards() {
  const plans = publishedPlans();
  const [billing, setBilling] = useState<Billing>("mensal");
  return (
    <>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex rounded-[10px] bg-white p-1 shadow-[inset_0_0_0_1px_rgb(29_27_24/0.1)]" role="radiogroup" aria-label="Forma de cobrança">
          {(["mensal", "anual"] as const).map((b) => (
            <button
              key={b}
              type="button"
              role="radio"
              aria-checked={billing === b}
              onClick={() => setBilling(b)}
              className={`rounded-lg px-4 py-2 text-sm transition ${billing === b ? "bg-tinta font-medium text-papel" : "text-tinta-suave hover:text-tinta"}`}
            >
              {b === "mensal" ? "Mensal" : "Anual · 2 meses grátis"}
            </button>
          ))}
        </div>
        <p className="font-mono text-[13px] text-tinta-suave">
          Preço de lançamento: os {FOUNDER.clientes} primeiros clientes mantêm o valor por {FOUNDER.meses} meses.
        </p>
      </div>
      <div className={`mt-8 grid gap-5 ${plans.length === 4 ? "md:grid-cols-2 xl:grid-cols-4" : "lg:grid-cols-3"}`}>
        {plans.map((p) => (
          <PlanCard key={p.id} plan={p} billing={billing} />
        ))}
      </div>
    </>
  );
}
