import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { getSupabaseConfig, SupabaseNotConfiguredError } from "./config";
import type { Database } from "./database.types";

/**
 * Cliente do Supabase para Server Components, Server Actions e Route Handlers.
 * Usa a sessão do usuário (cookies), então toda consulta passa pela RLS.
 * Crie um por requisição; nunca guarde em variável de módulo.
 */
export async function createClient() {
  const config = getSupabaseConfig();
  if (!config) throw new SupabaseNotConfiguredError();

  const cookieStore = await cookies();
  // O cliente lê o relógio (Date.now) para conferir a validade do token em
  // getClaims e antes de cada consulta. Com cacheComponents, isso só pode
  // acontecer depois de um acesso dinâmico: cookies() não basta, porque o
  // prerender de runtime já o resolve. connection() adia para a requisição.
  await connection();
  return createServerClient<Database>(config.url, config.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components não podem gravar cookies. Tudo bem: o proxy
          // (src/proxy.ts) já renova a sessão antes de a página renderizar.
        }
      },
    },
  });
}
