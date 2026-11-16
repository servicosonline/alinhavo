"use client";

import { useActionState, useId } from "react";
import { ActionForm } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { ui, type FormState } from "@/components/ui";
import { savePilotsCut, saveRoiSettings } from "./actions";

function Message({ state }: { state: FormState }) {
  if (state?.error)
    return (
      <p className={ui.error} role="alert">
        {state.error}
      </p>
    );
  if (state?.ok)
    return (
      <p className={ui.success} role="status">
        {state.ok}
      </p>
    );
  return null;
}

function Field({ name, label, unit, prefix, value }: { name: string; label: string; unit?: string; prefix?: string; value: string }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="text-sm">
        {label}
      </label>
      <div className="mt-1.5 flex items-center rounded-lg border border-tinta/20 bg-white px-3 focus-within:border-tinta focus-within:ring-2 focus-within:ring-tinta/10">
        {prefix && <span className="mr-1.5 font-mono text-sm text-tinta-suave">{prefix}</span>}
        <input id={id} name={name} inputMode="decimal" defaultValue={value} className="w-full bg-transparent py-2.5 font-mono text-[15px] outline-none" />
        {unit && <span className="ml-1.5 font-mono text-sm text-tinta-suave">{unit}</span>}
      </div>
    </div>
  );
}

export interface BaselineValues {
  pilots: string;
  fabric: string;
  price: string;
  hours: string;
  rate: string;
  monthly: string;
  efficiency: string;
  goal: string;
}

/** "Como era antes": os mesmos campos do simulador da página inicial, e a meta. */
export function BaselineForm({ orgId, v, readOnly }: { orgId: string; v: BaselineValues; readOnly: boolean }) {
  const [state, action, pending] = useActionState(saveRoiSettings.bind(null, orgId), undefined);
  return (
    <ActionForm action={action} state={state} pending={pending} resetOnOk={false} className="space-y-5">
      <fieldset disabled={readOnly} className="grid gap-4 sm:grid-cols-2">
        <Field name="pilots_per_month" label="Pilotos cortados por mês" value={v.pilots} />
        <Field name="fabric_per_pilot_m" label="Tecido por piloto" unit="m" value={v.fabric} />
        <Field name="price_per_meter" label="Preço do metro" prefix="R$" value={v.price} />
        <Field name="hours_per_pilot" label="Horas por piloto" unit="h" value={v.hours} />
        <Field name="hour_rate" label="Valor da hora" prefix="R$" value={v.rate} />
        <Field name="monthly_fabric_m" label="Tecido da produção por mês" unit="m" value={v.monthly} />
        <Field name="efficiency_pct" label="Aproveitamento do risco" unit="%" value={v.efficiency} />
        <Field name="goal" label="Meta de economia por mês" prefix="R$" value={v.goal} />
      </fieldset>
      {!readOnly && <SubmitButton pendingText="Salvando…">Salvar números</SubmitButton>}
      <Message state={state} />
    </ActionForm>
  );
}

/** Pilotos cortados num mês (a pessoa informa). */
export function PilotsCutForm({ orgId, month, label, value }: { orgId: string; month: string; label: string; value: number | null }) {
  const [state, action, pending] = useActionState(savePilotsCut.bind(null, orgId), undefined);
  const id = useId();
  return (
    <ActionForm action={action} state={state} pending={pending} resetOnOk={false} className="space-y-2">
      <input type="hidden" name="month" value={month} />
      <label htmlFor={id} className="text-sm">
        Pilotos cortados em {label}
      </label>
      <div className="flex items-center gap-2">
        <input id={id} name="pilots_cut" inputMode="numeric" defaultValue={value ?? ""} placeholder="0" className={`${ui.input} mt-0 w-28 font-mono`} />
        <SubmitButton variant="ghost" pendingText="…">
          Salvar
        </SubmitButton>
      </div>
      <Message state={state} />
    </ActionForm>
  );
}
