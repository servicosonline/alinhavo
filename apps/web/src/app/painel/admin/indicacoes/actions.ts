"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { dbErrorMessage } from "@/lib/db-error";
import { parseDiscount } from "@/lib/referral";
import { createClient } from "@/lib/supabase/server";

const TEXTS = { noPermission: "Só o superadmin dono muda as regras da indicação.", fallback: "Não foi possível salvar agora. Tente de novo." };

/** Salva as regras do programa de indicação (a função do banco confere o dono e grava a auditoria). */
export async function saveReferralSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await getCurrentUser())) return { error: "Entre de novo para continuar." };
  const referrer = parseDiscount(formData.get("referrer_kind"), formData.get("referrer_value"), formData.get("referrer_months"));
  if ("error" in referrer) return { error: `Quem indica: ${referrer.error}` };
  const referred = parseDiscount(formData.get("referred_kind"), formData.get("referred_value"), formData.get("referred_months"));
  if ("error" in referred) return { error: `Quem é indicado: ${referred.error}` };
  const supabase = await createClient();
  const { error } = await supabase.rpc("platform_set_referral_settings", {
    p_enabled: formData.get("enabled") === "on",
    p_referrer_kind: referrer.kind,
    p_referrer_value: referrer.value,
    p_referrer_months: referrer.months,
    p_referred_kind: referred.kind,
    p_referred_value: referred.value,
    p_referred_months: referred.months,
  });
  if (error) return { error: dbErrorMessage(error, TEXTS) };
  revalidatePath("/painel/admin/indicacoes");
  revalidatePath("/painel/conta");
  return { ok: "Regras salvas." };
}
