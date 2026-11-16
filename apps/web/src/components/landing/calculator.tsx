"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { formatMoney } from "@/lib/money";
import { EXAMPLE_NESTING, EXAMPLE_PILOTS, nestingPointSavings, parseBrNumber as num, pilotSavings } from "@/lib/landing/savings";
import {
  PRODUCTION_LABEL,
  TRIAL_DAYS,
  clampSeats,
  hasPrice,
  planMonthlyCents,
  recommendPlan,
  type PlanAnswers,
  type ProductionSize,
  type WhoModels,
} from "@/lib/plans";

const br = (n: number, digits = 1) => n.toLocaleString("pt-BR", { maximumFractionDigits: digits });
const meters = (mm: number) => `${br(mm / 1000)} m`;
const money0 = (cents: number) => formatMoney(Math.round(cents / 100) * 100).replace(/,00$/, "");

const WHO_MODELS: { id: WhoModels; label: string }[] = [
  { id: "eu-modelo", label: "Eu modelo" },
  { id: "colecao", label: "Desenvolvo a coleção, outra pessoa modela" },
  { id: "equipe", label: "Temos equipe de desenvolvimento" },
];

const fieldBox =
  "mt-1.5 flex items-center rounded-lg border border-tinta/20 bg-white px-3 focus-within:border-tinta focus-within:ring-2 focus-within:ring-tinta/10";

function Field({
  label,
  unit,
  value,
  onChange,
  prefix,
}: {
  label: string;
  unit?: string;
  prefix?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="text-sm">
        {label}
      </label>
      <div className={fieldBox}>
        {prefix && <span className="mr-1.5 font-mono text-sm text-tinta-suave">{prefix}</span>}
        <input
          id={id}
          inputMode="decimal"
          className="w-full bg-transparent py-2.5 font-mono text-[15px] outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {unit && <span className="ml-1.5 font-mono text-sm text-tinta-suave">{unit}</span>}
      </div>
    </div>
  );
}

/** Grupo de opções em botões (rádio de verdade por baixo, para teclado e leitor de tela). */
function Choice<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm">{legend}</legend>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.id}
            className="cursor-pointer rounded-lg border border-tinta/20 bg-white px-3 py-2 text-[14px] transition has-[:checked]:border-tinta has-[:checked]:bg-tinta has-[:checked]:text-papel has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-costura/40"
          >
            <input type="radio" name={name} value={o.id} checked={value === o.id} onChange={() => onChange(o.id)} className="sr-only" />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

interface Result {
  answers: PlanAnswers;
  pilots: ReturnType<typeof pilotSavings>;
  nest: ReturnType<typeof nestingPointSavings>;
  pricePerMeterCents: number;
  hourRateCents: number;
  fabric: string;
  hours: string;
}

/**
 * A agulha pesponta o alinhavo vermelho de ponta a ponta enquanto a conta "fecha" (cerca de 2 s).
 * Avisa quando termina; "Pular" encurta. Quem pede menos movimento nem chega a ver (ver `calculate`).
 */
function Sewing({ onDone }: { onDone: () => void }) {
  return (
    <div className="flex h-full min-h-[22rem] flex-col items-center justify-center gap-6 rounded-2xl bg-tinta p-8 text-papel" role="status">
      <svg viewBox="0 0 320 140" className="lp-costurando w-full max-w-sm" aria-hidden="true">
        <rect x="8" y="34" width="304" height="72" rx="6" fill="var(--papel)" opacity="0.08" />
        <path d="M8 34h304M8 106h304" stroke="var(--papel)" strokeOpacity="0.25" strokeDasharray="2 6" />
        <g className="lp-costura-linha" onAnimationEnd={onDone}>
          <path d="M20 70 C80 56 120 84 170 70 S260 58 300 70" fill="none" stroke="var(--linha)" strokeWidth="5" strokeLinecap="round" strokeDasharray="14 10" />
        </g>
        <g className="lp-agulha">
          <g className="lp-agulha-sobe">
            <rect x="-3" y="-6" width="6" height="64" rx="3" fill="var(--papel)" />
            <circle cx="0" cy="2" r="1.6" fill="var(--tinta)" />
            <path d="M0 2 C 20 -18 40 -10 60 -30" fill="none" stroke="var(--linha)" strokeWidth="2" />
          </g>
        </g>
      </svg>
      <p className="font-mono text-[13px] tracking-[0.12em] text-papel/80 uppercase">Costurando as suas contas…</p>
      <button type="button" onClick={onDone} className="text-sm text-papel/70 underline underline-offset-4 hover:text-papel">
        Pular
      </button>
    </div>
  );
}

function ResultCard({ r, stale }: { r: Result; stale: boolean }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);
  const { plan, reason } = recommendPlan(r.answers);
  const seats = clampSeats(plan, r.answers.users);
  const planCents = planMonthlyCents(plan, seats);
  const s = r.pilots;
  const net = planCents === null ? null : s.monthlyCents - planCents;

  return (
    <div className={`flex flex-col gap-6 transition-opacity ${stale ? "opacity-60" : ""}`} aria-live="polite">
      <div className="rounded-2xl bg-tinta p-6 text-papel sm:p-8">
        <h3 ref={headingRef} tabIndex={-1} className="font-mono text-[11px] tracking-[0.14em] text-papel/60 uppercase outline-none">
          Sua economia estimada
        </h3>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5">
          <div className="col-span-2 min-w-0">
            <dd className="font-display text-[clamp(2.25rem,9vw,3.75rem)] leading-none font-semibold tracking-tight break-words text-fita tabular-nums">
              {money0(s.monthlyCents)}
            </dd>
            <dt className="mt-2 text-sm text-papel/70">
              por mês · <b className="font-mono text-papel">{money0(s.yearlyCents)}</b> por ano
            </dt>
          </div>
          <div className="min-w-0">
            <dd className="font-display text-2xl font-semibold tracking-tight break-words tabular-nums sm:text-4xl">{br(s.hours)} h</dd>
            <dt className="mt-1 text-sm text-papel/70">da equipe por mês</dt>
          </div>
          <div className="min-w-0">
            <dd className="font-display text-2xl font-semibold tracking-tight break-words tabular-nums sm:text-4xl">{meters(s.fabricMm)}</dd>
            <dt className="mt-1 text-sm text-papel/70">de tecido por mês</dt>
          </div>
        </dl>

        <p className="mt-7 font-display text-[1.45rem] leading-snug font-semibold tracking-[-0.01em] sm:text-[1.7rem]">
          {s.monthlyCents > 0 ? (
            <>
              O que você faria com <span className="text-fita">{money0(s.monthlyCents)}</span> e{" "}
              <span className="text-fita">{br(s.hours)} horas</span> da sua equipe a mais todo mês?
            </>
          ) : (
            <>Com esses números a prova não evita nenhum piloto. Ajuste quantos ela evitaria.</>
          )}
        </p>

        <details className="mt-6 text-papel/80">
          <summary className="cursor-pointer text-sm">Ver a conta</summary>
          <p className="mt-3 font-mono text-[13px] leading-7 break-words">
            {s.avoided} pilotos × {r.fabric || 0} m = {meters(s.fabricMm)} × {formatMoney(r.pricePerMeterCents)} = {formatMoney(s.fabricCents)}
            <br />
            {s.avoided} pilotos × {r.hours || 0} h = {br(s.hours)} h × {formatMoney(r.hourRateCents)} = {formatMoney(s.laborCents)}
          </p>
        </details>
      </div>

      <div className="rounded-2xl border-2 border-linha bg-white p-6 sm:p-8">
        <p className="font-mono text-[11px] tracking-[0.14em] text-linha uppercase">Plano indicado</p>
        <p className="mt-2 font-display text-3xl font-semibold">{plan.nome}</p>
        <p className="mt-1 text-tinta-suave">{reason}</p>
        <p className="mt-4 text-[15px]">
          {planCents !== null && hasPrice(plan) ? (
            <>
              {money0(planCents)}/mês para {seats} {seats === 1 ? "usuário" : "usuários"}
              {net !== null && net > 0 && (
                <>
                  {" "}
                  · sobram <b>{money0(net)}</b> por mês
                </>
              )}
            </>
          ) : (
            <>
              Para {seats} {seats === 1 ? "usuário" : "usuários"} · preço em breve
            </>
          )}
        </p>
        {plan.precoEstilistaCents !== undefined && seats > 1 && (
          <p className="mt-1 text-sm text-tinta-suave">
            Conta com todos em assento cheio. Quem não modela sai por {money0(plan.precoEstilistaCents)} (estilista)
            {plan.leituraGratis && ", e quem só acompanha não paga"}.
          </p>
        )}
        {r.nest && (
          <p className="mt-3 text-[15px] leading-relaxed text-tinta-suave">
            No encaixe, cada ponto a mais de aproveitamento poupa <b className="font-mono text-tinta">{meters(r.nest.fabricMm)}</b> (
            <b className="font-mono text-tinta">{money0(r.nest.cents)}</b>) por mês.
          </p>
        )}
        <Link
          href="/entrar?modo=criar"
          className="mt-6 flex w-full items-center justify-center rounded-[10px] bg-linha px-6 py-4 font-medium text-white hover:bg-linha-escura"
        >
          Experimente grátis por {TRIAL_DAYS} dias
        </Link>
        <p className="mt-2 text-center font-mono text-[12px] text-tinta-suave">Sem cartão · cancele quando quiser</p>
      </div>
    </div>
  );
}

/**
 * Simulador da página inicial: a pessoa conta como é a operação, clica em "Calcular", a agulha costura
 * a conta e aparece a economia por mês e por ano, o plano indicado e o convite para o teste.
 * A conta usa só os números digitados (lib/landing/savings.ts); o plano sai de lib/plans.ts.
 */
export function SavingsCalculator() {
  const [users, setUsers] = useState("1");
  const [whoModels, setWhoModels] = useState<WhoModels>("eu-modelo");
  const [production, setProduction] = useState<ProductionSize>("pequena");
  const [nesting, setNesting] = useState<"sim" | "nao">("nao");
  const [pilots, setPilots] = useState(String(EXAMPLE_PILOTS.pilotsPerMonth));
  const [fabric, setFabric] = useState(br(EXAMPLE_PILOTS.fabricPerPilotMm / 1000));
  const [price, setPrice] = useState(br(EXAMPLE_PILOTS.pricePerMeterCents / 100, 2));
  const [hours, setHours] = useState(String(EXAMPLE_PILOTS.hoursPerPilot));
  const [rate, setRate] = useState(br(EXAMPLE_PILOTS.hourRateCents / 100, 2));
  const [avoided, setAvoided] = useState(EXAMPLE_PILOTS.avoidedPilots);
  const [monthly, setMonthly] = useState(br(EXAMPLE_NESTING.monthlyFabricMm / 1000, 0));
  const [efficiency, setEfficiency] = useState(String(EXAMPLE_NESTING.efficiencyPct));
  const [phase, setPhase] = useState<"form" | "sewing" | "result">("form");
  const [result, setResult] = useState<Result | null>(null);
  const sliderId = useId();
  const productionId = useId();
  const usersId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  const pilotCount = Math.min(200, Math.floor(num(pilots)));
  const avoidedNow = Math.min(avoided, pilotCount);

  function current(): Result {
    const pricePerMeterCents = Math.round(num(price) * 100);
    const hourRateCents = Math.round(num(rate) * 100);
    return {
      answers: { users: Math.max(1, Math.floor(num(users)) || 1), whoModels, nesting: nesting === "sim", production },
      pilots: pilotSavings({
        pilotsPerMonth: pilotCount,
        avoidedPilots: avoidedNow,
        fabricPerPilotMm: num(fabric) * 1000,
        pricePerMeterCents,
        hoursPerPilot: num(hours),
        hourRateCents,
      }),
      nest:
        nesting === "sim"
          ? nestingPointSavings({ monthlyFabricMm: num(monthly) * 1000, efficiencyPct: num(efficiency), pricePerMeterCents })
          : null,
      pricePerMeterCents,
      hourRateCents,
      fabric,
      hours,
    };
  }

  // Mudou algum número depois de calcular: o resultado fica esmaecido e o botão vira "Recalcular".
  const stale = phase === "result" && result !== null && JSON.stringify(result) !== JSON.stringify(current());

  function calculate() {
    setResult(current());
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setPhase(reduce ? "result" : "sewing");
    // No celular o resultado fica embaixo do formulário: leva a pessoa até ele.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      panelRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.05fr]">
      <form
        className="rounded-2xl border border-tinta/10 bg-white p-6 sm:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          calculate();
        }}
      >
        <p className="font-mono text-[11px] tracking-[0.14em] text-linha uppercase">Sua operação</p>
        <div className="mt-5 grid gap-5">
          <div className="grid gap-5 sm:grid-cols-[10rem_1fr]">
            <div>
              <label htmlFor={usersId} className="text-sm">
                Quantas pessoas vão usar
              </label>
              <div className={fieldBox}>
                <input
                  id={usersId}
                  inputMode="numeric"
                  className="w-full bg-transparent py-2.5 font-mono text-[15px] outline-none"
                  value={users}
                  onChange={(e) => setUsers(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor={productionId} className="text-sm">
                Tamanho da produção
              </label>
              <select
                id={productionId}
                value={production}
                onChange={(e) => setProduction(e.target.value as ProductionSize)}
                className={`${fieldBox} w-full py-2.5 text-[15px] outline-none`}
              >
                {(Object.keys(PRODUCTION_LABEL) as ProductionSize[]).map((k) => (
                  <option key={k} value={k}>
                    {PRODUCTION_LABEL[k]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Choice legend="Quem modela os moldes?" name="quem-modela" options={WHO_MODELS} value={whoModels} onChange={setWhoModels} />
          <Choice
            legend="Vocês fazem o encaixe (risco) do corte?"
            name="encaixe"
            options={[
              { id: "nao", label: "Não" },
              { id: "sim", label: "Sim" },
            ]}
            value={nesting}
            onChange={setNesting}
          />
        </div>

        <p className="mt-9 font-mono text-[11px] tracking-[0.14em] text-linha uppercase">Seus pilotos · valores de exemplo, troque pelos seus</p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Pilotos cortados por mês" value={pilots} onChange={setPilots} />
          <Field label="Tecido por piloto" unit="m" value={fabric} onChange={setFabric} />
          <Field label="Preço do metro" prefix="R$" value={price} onChange={setPrice} />
          <Field label="Horas por piloto (corte e costura)" unit="h" value={hours} onChange={setHours} />
          <Field label="Valor da hora" prefix="R$" value={rate} onChange={setRate} />
        </div>
        <div className="mt-7">
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <label htmlFor={sliderId}>
              Quantos desses a prova 3D evitaria? <span className="text-tinta-suave">(sua estimativa)</span>
            </label>
            <b className="shrink-0 font-mono">
              {avoidedNow} de {pilotCount}
            </b>
          </div>
          <input
            id={sliderId}
            type="range"
            min={0}
            max={Math.max(1, pilotCount)}
            step={1}
            value={avoidedNow}
            onChange={(e) => setAvoided(Number(e.target.value))}
            className="mt-3 w-full accent-linha"
          />
        </div>

        {nesting === "sim" && (
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            <Field label="Tecido na produção por mês" unit="m" value={monthly} onChange={setMonthly} />
            <Field label="Aproveitamento do risco hoje" unit="%" value={efficiency} onChange={setEfficiency} />
          </div>
        )}

        <button
          type="submit"
          disabled={phase === "sewing"}
          className="mt-8 flex w-full items-center justify-center rounded-[10px] bg-tinta px-6 py-4 font-medium text-papel transition hover:bg-black disabled:opacity-60"
        >
          {phase === "result" ? (stale ? "Recalcular" : "Calcular de novo") : "Calcular minha economia"}
        </button>
      </form>

      <div ref={panelRef} className="scroll-mt-4 lg:sticky lg:top-6 lg:self-start">
        {phase === "sewing" && <Sewing onDone={() => setPhase("result")} />}
        {phase === "result" && result && <ResultCard r={result} stale={stale} />}
        {phase === "form" && (
          <div className="flex min-h-[22rem] flex-col justify-between gap-8 rounded-2xl bg-tinta p-8 text-papel">
            <p className="font-mono text-[11px] tracking-[0.14em] text-papel/60 uppercase">Por mês e por ano</p>
            <p className="font-display text-[1.7rem] leading-snug font-semibold tracking-[-0.01em] sm:text-[2rem]">
              Conte como é a sua operação e veja quanto fica no caixa, e qual plano serve para você.
            </p>
            <span className="alinhavo w-32" aria-hidden="true" />
            <p className="text-sm text-papel/70">A conta usa só os números que você digitar. Nada aqui é promessa de economia.</p>
          </div>
        )}
      </div>
    </div>
  );
}
