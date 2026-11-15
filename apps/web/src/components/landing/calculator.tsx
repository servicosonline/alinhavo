"use client";

import { useId, useState } from "react";
import { formatMoney } from "@/lib/money";
import { EXAMPLE_NESTING, EXAMPLE_PILOTS, nestingPointSavings, parseBrNumber as num, pilotSavings } from "@/lib/landing/savings";

const br = (n: number, digits = 1) => n.toLocaleString("pt-BR", { maximumFractionDigits: digits });
const meters = (mm: number) => `${br(mm / 1000)} m`;
const money0 = (cents: number) => formatMoney(Math.round(cents / 100) * 100).replace(/,00$/, "");

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
      <div className="mt-1.5 flex items-center rounded-lg border border-tinta/20 bg-white px-3 focus-within:border-tinta focus-within:ring-2 focus-within:ring-tinta/10">
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

export function SavingsCalculator() {
  const [pilots, setPilots] = useState(String(EXAMPLE_PILOTS.pilotsPerMonth));
  const [fabric, setFabric] = useState(br(EXAMPLE_PILOTS.fabricPerPilotMm / 1000));
  const [price, setPrice] = useState(br(EXAMPLE_PILOTS.pricePerMeterCents / 100, 2));
  const [hours, setHours] = useState(String(EXAMPLE_PILOTS.hoursPerPilot));
  const [rate, setRate] = useState(br(EXAMPLE_PILOTS.hourRateCents / 100, 2));
  const [avoided, setAvoided] = useState(EXAMPLE_PILOTS.avoidedPilots);
  const [monthly, setMonthly] = useState(br(EXAMPLE_NESTING.monthlyFabricMm / 1000, 0));
  const [efficiency, setEfficiency] = useState(String(EXAMPLE_NESTING.efficiencyPct));
  const sliderId = useId();

  const pilotCount = Math.min(200, Math.floor(num(pilots)));
  const avoidedNow = Math.min(avoided, pilotCount);
  const pricePerMeterCents = Math.round(num(price) * 100);
  const s = pilotSavings({
    pilotsPerMonth: pilotCount,
    avoidedPilots: avoidedNow,
    fabricPerPilotMm: num(fabric) * 1000,
    pricePerMeterCents,
    hoursPerPilot: num(hours),
    hourRateCents: Math.round(num(rate) * 100),
  });
  const nest = nestingPointSavings({
    monthlyFabricMm: num(monthly) * 1000,
    efficiencyPct: num(efficiency),
    pricePerMeterCents,
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.05fr]">
      <div className="rounded-2xl border border-tinta/10 bg-white p-6 sm:p-8">
        <p className="font-mono text-[11px] tracking-[0.14em] text-linha uppercase">Valores de exemplo · troque pelos seus</p>
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
      </div>

      <div className="flex flex-col gap-6">
        <div className="rounded-2xl bg-tinta p-6 text-papel sm:p-8" aria-live="polite">
          <p className="font-mono text-[11px] tracking-[0.14em] text-papel/60 uppercase">Por mês</p>
          <dl className="mt-4 grid grid-cols-3 gap-4">
            <div>
              <dd className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">{meters(s.fabricMm)}</dd>
              <dt className="mt-1 text-sm text-papel/70">de tecido</dt>
            </div>
            <div>
              <dd className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">{br(s.hours)} h</dd>
              <dt className="mt-1 text-sm text-papel/70">de corte e costura</dt>
            </div>
            <div>
              <dd className="font-display text-3xl font-semibold tracking-tight text-fita sm:text-5xl">{money0(s.monthlyCents)}</dd>
              <dt className="mt-1 text-sm text-papel/70">que ficam no caixa</dt>
            </div>
          </dl>
          <span className="alinhavo mt-6 mb-4 w-32" aria-hidden="true" />
          <p className="font-mono text-[13px] leading-7 text-papel/80">
            {s.avoided} pilotos × {fabric || 0} m = {meters(s.fabricMm)} × {formatMoney(pricePerMeterCents)} = {formatMoney(s.fabricCents)}
            <br />
            {s.avoided} pilotos × {hours || 0} h = {br(s.hours)} h × {formatMoney(Math.round(num(rate) * 100))} = {formatMoney(s.laborCents)}
            <br />
            Em 12 meses: <b className="text-fita">{formatMoney(s.yearlyCents)}</b>
          </p>
        </div>

        <div className="rounded-2xl border border-tinta/10 bg-white p-6 sm:px-8">
          <p className="font-mono text-[11px] tracking-[0.14em] text-tinta-suave uppercase">E no encaixe?</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Tecido na produção por mês" unit="m" value={monthly} onChange={setMonthly} />
            <Field label="Aproveitamento do risco hoje" unit="%" value={efficiency} onChange={setEfficiency} />
          </div>
          <p className="mt-4 text-[15px] leading-relaxed">
            {nest ? (
              <>
                <b>Cada ponto a mais</b> de aproveitamento poupa <b className="font-mono">{meters(nest.fabricMm)}</b> (
                <b className="font-mono">{money0(nest.cents)}</b>) por mês. O Alinhavo mede o aproveitamento de cada risco.
              </>
            ) : (
              <span className="text-tinta-suave">Digite o tecido do mês e um aproveitamento entre 1 e 99%.</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
