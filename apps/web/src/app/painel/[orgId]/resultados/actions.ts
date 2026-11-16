"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { dbErrorMessage } from "@/lib/db-error";
import { isUuid } from "@/lib/ids";
import { parseBrNumber } from "@/lib/landing/savings";
import { createClient } from "@/lib/supabase/server";

// Permissão de verdade: RLS (dono e admin escrevem). Aqui: login, leitura dos números e mensagens.

const TEXTS = { noPermission: "Só dono e admin mudam os resultados.", fallback: "Não foi possível salvar agora. Tente de novo em instantes." };

/** Número do formulário ("1,8", "2.000"); vazio = 0. */
const num = (f: FormData, k: string) => parseBrNumber(String(f.get(k) ?? ""));
const int = (v: number) => Math.round(v);

/** Como era a operação antes do Alinhavo, e a meta de economia por mês. */
export async function saveRoiSettings(orgId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await getCurrentUser())) return { error: "Entre de novo para continuar." };
  if (!isUuid(orgId)) return { error: "Organização inválida." };
  const efficiency = num(formData, "efficiency_pct");
  if (efficiency && (efficiency <= 0 || efficiency >= 100)) return { error: "O aproveitamento vai de 1 a 99%." };
  const goal = num(formData, "goal");
  const row = {
    org_id: orgId,
    pilots_per_month: int(num(formData, "pilots_per_month")),
    fabric_per_pilot_mm: int(num(formData, "fabric_per_pilot_m") * 1000),
    price_per_meter_cents: int(num(formData, "price_per_meter") * 100),
    hours_per_pilot: Math.round(num(formData, "hours_per_pilot") * 100) / 100,
    hour_rate_cents: int(num(formData, "hour_rate") * 100),
    monthly_fabric_mm: int(num(formData, "monthly_fabric_m") * 1000),
    efficiency_pct: efficiency || null,
    goal_monthly_cents: goal ? int(goal * 100) : null,
  };
  if (row.pilots_per_month > 2000) return { error: "Até 2.000 pilotos por mês." };

  const supabase = await createClient();
  const { error } = await supabase.from("roi_settings").upsert(row, { onConflict: "org_id" });
  if (error) return { error: error.code === "23514" ? "Algum número está fora do limite. Confira os campos." : dbErrorMessage(error, TEXTS) };
  revalidatePath(`/painel/${orgId}/resultados`);
  return { ok: "Números salvos." };
}

/** Pilotos cortados num mês (AAAA-MM-01). */
export async function savePilotsCut(orgId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await getCurrentUser())) return { error: "Entre de novo para continuar." };
  const month = String(formData.get("month") ?? "");
  const raw = String(formData.get("pilots_cut") ?? "").trim();
  if (!isUuid(orgId) || !/^\d{4}-\d{2}-01$/.test(month)) return { error: "Pedido inválido." };
  if (!/^\d{1,4}$/.test(raw) || Number(raw) > 2000) return { error: "Digite quantos pilotos foram cortados (0 a 2.000)." };

  const supabase = await createClient();
  const { error } = await supabase.from("roi_months").upsert({ org_id: orgId, month, pilots_cut: Number(raw) }, { onConflict: "org_id,month" });
  if (error) return { error: dbErrorMessage(error, TEXTS) };
  revalidatePath(`/painel/${orgId}/resultados`);
  return { ok: "Mês atualizado." };
}
