"use server";

import { redirect } from "next/navigation";
import type { FormState } from "@/components/ui";
import { otpErrorLog, otpErrorMessage } from "@/lib/login-errors";
import { getOrigin } from "@/lib/origin";
import { safeNext } from "@/lib/safe-next";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signInWithEmail(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!getSupabaseConfig()) return { error: "O Supabase ainda não foi configurado neste ambiente." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) return { error: "Digite um e-mail válido." };

  const next = safeNext(formData.get("next"));
  const origin = await getOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });

  if (error) {
    console.error(otpErrorLog(error));
    return { error: otpErrorMessage(error) };
  }
  return { ok: `Enviamos um link de acesso para ${email}. Abra o e-mail neste mesmo navegador.` };
}

export async function signOut() {
  if (getSupabaseConfig()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/entrar");
}
