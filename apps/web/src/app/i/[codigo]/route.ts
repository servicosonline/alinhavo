import { NextResponse } from "next/server";
import { normalizeReferralCode, REFERRAL_COOKIE, REFERRAL_DAYS } from "@/lib/referral";

/**
 * GET /i/<código>: link de indicação. Guarda o código no navegador por 30 dias e manda para a página inicial; quem
 * criar a conta nesse prazo fica ligado a quem indicou (no primeiro acesso ao painel). Não lê nem mostra dado
 * nenhum: código inválido só leva para a página inicial.
 */
export async function GET(request: Request, ctx: RouteContext<"/i/[codigo]">) {
  const { codigo } = await ctx.params;
  const code = normalizeReferralCode(codigo);
  const response = NextResponse.redirect(new URL("/", request.url));
  if (code) {
    response.cookies.set(REFERRAL_COOKIE, code, {
      httpOnly: true,
      sameSite: "lax",
      secure: new URL(request.url).protocol === "https:",
      path: "/",
      maxAge: REFERRAL_DAYS * 24 * 60 * 60,
    });
  }
  return response;
}
