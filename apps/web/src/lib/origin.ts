import "server-only";
import { headers } from "next/headers";

/**
 * Endereço público do app, para montar links (login e convites).
 * Usa NEXT_PUBLIC_SITE_URL se existir; senão, o host da requisição.
 * Os links de login só funcionam se o endereço estiver na lista de
 * Redirect URLs do Supabase, o que bloqueia host forjado.
 */
export async function getOrigin(): Promise<string> {
  const fixed = process.env.NEXT_PUBLIC_SITE_URL;
  if (fixed) return fixed.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}
