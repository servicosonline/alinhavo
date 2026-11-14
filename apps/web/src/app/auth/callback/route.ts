import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/safe-next";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Destino do link de acesso enviado por e-mail.
 * Aceita os dois formatos do Supabase: ?code= (PKCE, padrão) e ?token_hash=&type=.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"));
  const falhou = NextResponse.redirect(new URL(`/entrar?erro=link&next=${encodeURIComponent(next)}`, origin));

  if (!getSupabaseConfig()) return falhou;
  const supabase = await createClient();

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("sem código") };

  if (error) return falhou;
  return NextResponse.redirect(new URL(next, origin));
}
