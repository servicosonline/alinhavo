import type { OtpError } from "./login-errors";

/**
 * Regras do login com e-mail e senha. Puras, para testar sem Supabase. A
 * senha nunca aparece em mensagem nem em log.
 */

export const MIN_PASSWORD = 8;
export const MAX_PASSWORD = 72; // limite do bcrypt usado pelo Supabase Auth

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_IN_TEXT = /[^\s@"']+@[^\s@"']+/g;

export type Credentials = { email: string; password: string };

/**
 * Confere o que veio do formulário. `confirm` só no cadastro. Devolve o
 * e-mail normalizado e a senha, ou a mensagem de erro.
 */
export function readCredentials(
  rawEmail: unknown,
  rawPassword: unknown,
  rawConfirm?: unknown,
): { ok: true; value: Credentials } | { ok: false; error: string } {
  const email = String(rawEmail ?? "").trim().toLowerCase();
  const password = typeof rawPassword === "string" ? rawPassword : "";
  if (!EMAIL_RE.test(email) || email.length > 254) return { ok: false, error: "Digite um e-mail válido." };
  if (!password) return { ok: false, error: "Digite a senha." };
  if (rawConfirm !== undefined) {
    if (password.length < MIN_PASSWORD) return { ok: false, error: `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.` };
    if (password.length > MAX_PASSWORD) return { ok: false, error: `A senha pode ter no máximo ${MAX_PASSWORD} caracteres.` };
    if (password !== rawConfirm) return { ok: false, error: "As duas senhas não são iguais." };
  }
  return { ok: true, value: { email, password } };
}

/** Mensagem para a tela a partir do erro do Supabase Auth (entrar ou criar conta). */
export function passwordErrorMessage(error: OtpError): string {
  const code = error.code ?? "";
  if (error.status === 429 || code === "over_request_rate_limit" || code === "over_email_send_rate_limit") {
    return "Muitas tentativas seguidas. Espere um minuto e tente de novo.";
  }
  if (code === "invalid_credentials") return "E-mail ou senha incorretos.";
  if (code === "email_not_confirmed") return "Confirme seu e-mail pelo link que enviamos antes de entrar.";
  if (code === "user_already_exists" || code === "email_exists") return "Esse e-mail já tem conta. Use a aba Entrar.";
  if (code === "weak_password") return "Senha fraca. Use uma senha mais longa, misturando letras e números.";
  if (code === "signup_disabled" || code === "email_provider_disabled") {
    return "O cadastro com senha está desligado no Supabase. Fale com quem administra o Alinhavo.";
  }
  if (code === "email_address_invalid") return "Digite um e-mail válido.";
  return "Não conseguimos entrar agora. Tente de novo em instantes.";
}

/** Linha para o log do servidor, sem e-mail (e a senha nunca chega aqui). */
export function passwordErrorLog(kind: "entrar" | "cadastro", error: OtpError): string {
  const reason = (error.message ?? "").replace(EMAIL_IN_TEXT, "<e-mail>");
  return `[${kind}] Falhou: status=${error.status ?? "?"} code=${error.code ?? "?"} motivo="${reason}"`;
}
