/**
 * Indicação de amigos: o link `/i/<código>` guarda o código num cookie por `REFERRAL_DAYS` dias; no primeiro acesso
 * ao painel depois do cadastro, `claim_referral` liga a conta nova a quem indicou. O desconto só nasce no primeiro
 * pagamento (no banco, `referral_mark_paid`). Regras puras e textos da tela.
 */
import type { DiscountKind, ReferralSettingsRow, ReferralStatus } from "./supabase/database.types";
import { formatMoney, parseMoneyToCents } from "./money";

export const REFERRAL_COOKIE = "alv_indicacao";
export const REFERRAL_DAYS = 30;

/** Código como o banco guarda (8 letras e números, maiúsculo); null se não for um. */
export function normalizeReferralCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase();
  return /^[A-Z0-9]{8}$/.test(code) ? code : null;
}

/** "20% de desconto na próxima mensalidade", "R$ 30,00 de desconto nas próximas 3 mensalidades". */
export function describeDiscount(kind: DiscountKind, value: number, months: number, first = false): string {
  const amount = kind === "percentual" ? `${value}%` : formatMoney(value);
  const when = months <= 1 ? (first ? "na primeira mensalidade" : "na próxima mensalidade") : first ? `nas ${months} primeiras mensalidades` : `nas próximas ${months} mensalidades`;
  return `${amount} de desconto ${when}`;
}

/** As regras do momento em frases; null com o programa desligado (a tela não oferece o link). */
export function referralRules(s: Pick<ReferralSettingsRow, "enabled" | "referrer_kind" | "referrer_value" | "referrer_months" | "referred_kind" | "referred_value" | "referred_months"> | null) {
  if (!s || !s.enabled) return null;
  return {
    referrer: s.referrer_value > 0 ? `Você ganha ${describeDiscount(s.referrer_kind, s.referrer_value, s.referrer_months)} quando a pessoa indicada fizer o primeiro pagamento.` : null,
    referred: s.referred_value > 0 ? `Quem você indicar ganha ${describeDiscount(s.referred_kind, s.referred_value, s.referred_months, true)}.` : null,
  };
}

export const REFERRAL_STATUS_LABEL: Record<ReferralStatus, string> = {
  cadastrado: "Criou a conta",
  pagou: "Assinou",
  recusada: "Não vale (mesma pessoa)",
};

/** Mensagem pronta para o WhatsApp com o link. */
export function whatsappShareUrl(link: string): string {
  const text = `Estou usando o Alinhavo para modelar e provar as peças no 3D. Cria a sua conta por aqui: ${link}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export type DiscountInput = { kind: DiscountKind; value: number; months: number };

/**
 * Lê um desconto do formulário do superadmin: percentual (inteiro de 0 a 100) ou valor fixo em reais
 * ("30,00", até R$ 1.000,00, guardado em centavos), por 1 a 12 mensalidades. Inválido: a mensagem para a tela.
 */
export function parseDiscount(kindRaw: unknown, valueRaw: unknown, monthsRaw: unknown): DiscountInput | { error: string } {
  const kind = kindRaw === "fixo" ? "fixo" : kindRaw === "percentual" ? "percentual" : null;
  if (!kind) return { error: "Escolha percentual ou valor fixo." };
  const months = Number(monthsRaw);
  if (!Number.isInteger(months) || months < 1 || months > 12) return { error: "O desconto vale de 1 a 12 mensalidades." };
  const text = String(valueRaw ?? "").trim();
  if (kind === "percentual") {
    const value = Number(text.replace("%", "").replace(",", "."));
    if (!Number.isInteger(value) || value < 0 || value > 100) return { error: "Percentual inteiro de 0 a 100." };
    return { kind, value, months };
  }
  const cents = parseMoneyToCents(text === "" ? "0" : text);
  if (cents === null || cents === undefined || cents < 0 || cents > 100000) return { error: "Valor fixo de R$ 0,00 a R$ 1.000,00." };
  return { kind, value: cents, months };
}
