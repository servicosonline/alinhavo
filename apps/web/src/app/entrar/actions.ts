"use server";

import { redirect } from "next/navigation";
import type { FormState } from "@/components/ui";
import { otpErrorLog, otpErrorMessage } from "@/lib/login-errors";
import { getOrigin } from "@/lib/origin";
import { passwordErrorLog, passwordErrorMessage, readCredentials } from "@/lib/password-auth";
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

/** Entra com e-mail e senha e volta para onde a pessoa queria ir. */
export async function signInWithPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!getSupabaseConfig()) return { error: "O Supabase ainda não foi configurado neste ambiente." };
  const creds = readCredentials(formData.get("email"), formData.get("password"));
  if (!creds.ok) return { error: creds.error };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(creds.value);
  if (error) {
    if (error.code !== "invalid_credentials") console.error(passwordErrorLog("entrar", error));
    return { error: passwordErrorMessage(error) };
  }
  redirect(safeNext(formData.get("next")));
}

/**
 * Cria a conta com e-mail e senha. Se o Supabase não exige confirmação do
 * e-mail, já entra; se exige, avisa para confirmar pelo link enviado.
 */
export async function signUpWithPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!getSupabaseConfig()) return { error: "O Supabase ainda não foi configurado neste ambiente." };
  const creds = readCredentials(formData.get("email"), formData.get("password"), formData.get("confirm") ?? "");
  if (!creds.ok) return { error: creds.error };

  const next = safeNext(formData.get("next"));
  const origin = await getOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    ...creds.value,
    options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) {
    console.error(passwordErrorLog("cadastro", error));
    return { error: passwordErrorMessage(error) };
  }
  if (!data.session) {
    // Confirmação ligada no Supabase (ou e-mail já cadastrado: o Supabase não diz qual, de propósito).
    return { ok: `Conta criada. Confirme pelo link enviado para ${creds.value.email} e depois entre com a senha.` };
  }
  redirect(next);
}

/**
 * "Esqueci minha senha": o Supabase manda o link de recuperação, que entra pelo /auth/callback e cai em
 * Minha conta, no formulário de nova senha. A resposta é a mesma exista ou não a conta (não revela e-mails).
 */
export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!getSupabaseConfig()) return { error: "O Supabase ainda não foi configurado neste ambiente." };
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) return { error: "Digite um e-mail válido." };

  const origin = await getOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/painel/conta?senha=nova#senha")}`,
  });
  if (error) {
    console.error(otpErrorLog(error));
    if (error.status === 429) return { error: "Muitas tentativas seguidas. Espere um minuto e tente de novo." };
  }
  return { ok: `Se existe uma conta com ${email}, enviamos o link para criar a nova senha. Abra o e-mail neste mesmo navegador.` };
}

export async function signOut() {
  if (getSupabaseConfig()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/entrar");
}
