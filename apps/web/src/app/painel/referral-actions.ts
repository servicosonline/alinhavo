"use server";

import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { normalizeReferralCode, REFERRAL_COOKIE } from "@/lib/referral";
import { createClient } from "@/lib/supabase/server";

/**
 * Liga a conta de quem está logado ao código guardado pelo link de indicação e apaga o cookie (dando certo ou não:
 * o banco decide se vale, `claim_referral`). Chamada uma vez, pelo painel, quando o cookie existe.
 */
export async function claimReferralFromCookie(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  const jar = await cookies();
  const code = normalizeReferralCode(jar.get(REFERRAL_COOKIE)?.value);
  jar.delete(REFERRAL_COOKIE);
  if (!code) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("claim_referral", { p_code: code });
  if (error) console.error("[indicação] não ligou:", error.code);
}
