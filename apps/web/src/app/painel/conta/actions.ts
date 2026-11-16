"use server";

import { revalidatePath } from "next/cache";
import type { FormState } from "@/components/ui";
import { cleanName } from "@/lib/account";
import { requireUser } from "@/lib/auth";
import { dbErrorMessage } from "@/lib/db-error";
import { parseDocument } from "@/lib/document";
import { MAX_PASSWORD, MIN_PASSWORD } from "@/lib/password-auth";
import { createClient } from "@/lib/supabase/server";

const TEXTS = { noPermission: "Você só pode mudar a sua própria conta.", fallback: "Não conseguimos salvar agora. Tente de novo em instantes." };
const AVATAR_PATH = /^[0-9a-f-]{36}\/[A-Za-z0-9_-]{1,64}\.(webp|jpg|png)$/;

/** Nome, sobrenome e CPF/CNPJ. O banco confere o documento de novo (dígito verificador). */
export async function saveProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser("/painel/conta");
  const first = cleanName(formData.get("first_name"), 60);
  const last = cleanName(formData.get("last_name"), 80);
  if (!first.ok) return { error: "O nome pode ter até 60 letras." };
  if (!last.ok) return { error: "O sobrenome pode ter até 80 letras." };
  const doc = parseDocument(String(formData.get("document") ?? ""));
  if (!doc.ok) return { error: doc.error };

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      first_name: first.value,
      last_name: last.value,
      document_type: doc.value?.type ?? null,
      document: doc.value?.digits ?? null,
    },
    { onConflict: "user_id" },
  );
  if (error) {
    console.error("[conta] perfil não salvo:", error.code);
    return { error: error.code === "23514" ? "O banco recusou um dos dados. Confira o documento." : dbErrorMessage(error, TEXTS) };
  }
  revalidatePath("/painel", "layout");
  return { ok: "Dados salvos." };
}

/**
 * Liga a foto já enviada pelo navegador (bucket `avatars`, pasta da pessoa) ao perfil e apaga a anterior.
 * `null` tira a foto.
 */
export async function setAvatar(path: string | null): Promise<{ error?: string }> {
  const user = await requireUser("/painel/conta");
  if (path !== null && (!AVATAR_PATH.test(path) || !path.startsWith(`${user.id}/`))) {
    return { error: "Caminho da foto inválido." };
  }
  const supabase = await createClient();
  const { data: before } = await supabase.from("profiles").select("avatar_path").eq("user_id", user.id).maybeSingle();
  const { error } = await supabase.from("profiles").upsert({ user_id: user.id, avatar_path: path }, { onConflict: "user_id" });
  if (error) {
    console.error("[conta] foto não salva:", error.code);
    return { error: error.code === "23514" ? "O banco recusou um dos dados. Confira o documento." : dbErrorMessage(error, TEXTS) };
  }
  const old = before?.avatar_path;
  if (old && old !== path) {
    const { error: rmError } = await supabase.storage.from("avatars").remove([old]);
    if (rmError) console.error("[conta] foto antiga não apagada");
  }
  revalidatePath("/painel", "layout");
  return {};
}

/** Troca a senha de quem está logado (também o fim do "Esqueci minha senha"). */
export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser("/painel/conta");
  const password = typeof formData.get("password") === "string" ? String(formData.get("password")) : "";
  const confirm = formData.get("confirm");
  if (password.length < MIN_PASSWORD) return { error: `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.` };
  if (password.length > MAX_PASSWORD) return { error: `A senha pode ter no máximo ${MAX_PASSWORD} caracteres.` };
  if (password !== confirm) return { error: "As duas senhas não são iguais." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    // Nunca a senha no log: só o código.
    console.error("[conta] senha não trocada:", error.code ?? error.status);
    if (error.code === "same_password") return { error: "A nova senha precisa ser diferente da atual." };
    if (error.code === "weak_password") return { error: "Senha fraca. Use uma senha mais longa, misturando letras e números." };
    if (error.code === "reauthentication_needed") return { error: "Por segurança, saia e entre de novo antes de trocar a senha." };
    return { error: "Não conseguimos trocar a senha agora. Tente de novo em instantes." };
  }
  return { ok: "Senha trocada." };
}

/** Primeiro acesso: as boas-vindas já foram vistas. */
export async function markWelcomeSeen(): Promise<void> {
  const user = await requireUser("/painel");
  const supabase = await createClient();
  await supabase.from("profiles").upsert({ user_id: user.id, welcome_seen_at: new Date().toISOString() }, { onConflict: "user_id" });
}

/** A pessoa fechou o cartão de primeiros passos. */
export async function closeOnboarding(): Promise<void> {
  const user = await requireUser("/painel");
  const supabase = await createClient();
  await supabase.from("profiles").upsert({ user_id: user.id, onboarding_closed_at: new Date().toISOString() }, { onConflict: "user_id" });
  revalidatePath("/painel");
}
