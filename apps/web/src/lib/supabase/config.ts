export type SupabaseConfig = { url: string; key: string };

export type ConfigCheck =
  | { ok: true; config: SupabaseConfig }
  | { ok: false; missing: true }
  | { ok: false; missing: false; problem: string };

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);

/**
 * Confere o formato da URL e da chave do Supabase. Pura: não lê o ambiente,
 * para dar para testar. Nunca devolve os valores na mensagem de problema.
 */
export function checkSupabaseConfig(rawUrl: string | undefined, rawKey: string | undefined): ConfigCheck {
  const url = rawUrl?.trim() ?? "";
  const key = rawKey?.trim() ?? "";
  if (!url || !key) return { ok: false, missing: true };

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return {
      ok: false,
      missing: false,
      problem: "NEXT_PUBLIC_SUPABASE_URL não é um endereço válido (esperado https://<ref>.supabase.co).",
    };
  }
  const local = parsed.protocol === "http:" && LOCAL_HOSTS.has(parsed.hostname);
  if (parsed.protocol !== "https:" && !local) {
    return { ok: false, missing: false, problem: "NEXT_PUBLIC_SUPABASE_URL precisa começar com https://." };
  }

  if (key.startsWith("sb_secret_")) {
    return {
      ok: false,
      missing: false,
      problem:
        "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY recebeu a chave SECRETA. Troque pela publicável e gere uma secreta nova no Supabase.",
    };
  }
  if (!key.startsWith("sb_publishable_")) {
    return {
      ok: false,
      missing: false,
      problem: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY precisa começar com sb_publishable_.",
    };
  }

  return { ok: true, config: { url: url.replace(/\/+$/, ""), key } };
}

let reported = false;

/**
 * Lê as variáveis públicas do Supabase. Devolve null se o projeto ainda não
 * foi configurado ou se os valores estão num formato inválido; neste caso
 * registra no log qual variável está errada (uma vez por instância), e o app
 * mostra "não configurado" em vez de cair com erro 500.
 */
export function getSupabaseConfig(): SupabaseConfig | null {
  const check = checkSupabaseConfig(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  if (check.ok) return check.config;
  if (!check.missing && !reported) {
    reported = true;
    console.error(`[supabase] Configuração inválida: ${check.problem}`);
  }
  return null;
}

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "Supabase não configurado: preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY em apps/web/.env.local.",
    );
  }
}
