import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Rpc } from "./v1";

/**
 * Chamada às funções api_* do banco com a chave publicável, sem sessão nem
 * cookie (quem autentica é a chave de API, conferida no banco). Nunca a
 * chave de serviço. Null se o Supabase não está configurado.
 */
export function apiRpc(): Rpc | null {
  const config = getSupabaseConfig();
  if (!config) return null;
  const supabase = createClient(config.url, config.key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  return (fn, args) => supabase.rpc(fn, args);
}
