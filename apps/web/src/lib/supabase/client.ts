"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";
import type { Database } from "./database.types";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Cliente do Supabase no navegador, com a sessão dos cookies (a RLS vale
 * como no servidor). Só a chave publicável. Usado no tempo real
 * (comentários); leituras e escritas continuam pelas Server Actions.
 * Null se o Supabase não estiver configurado.
 */
export function getBrowserClient() {
  if (client) return client;
  const config = getSupabaseConfig();
  if (!config) return null;
  client = createBrowserClient<Database>(config.url, config.key);
  return client;
}
