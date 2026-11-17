import { describe, expect, it } from "vitest";
import { describeDiscount, normalizeReferralCode, parseDiscount, referralRules, whatsappShareUrl } from "./referral";

const base = { enabled: true, referrer_kind: "percentual", referrer_value: 20, referrer_months: 1, referred_kind: "fixo", referred_value: 3000, referred_months: 3 } as const;

describe("indicação", () => {
  it("código: 8 letras e números, vira maiúsculo; outra coisa, null", () => {
    expect(normalizeReferralCode(" abcd2345 ")).toBe("ABCD2345");
    expect(normalizeReferralCode("ABC")).toBeNull();
    expect(normalizeReferralCode("ABCD-234")).toBeNull();
    expect(normalizeReferralCode(undefined)).toBeNull();
  });

  it("desconto em frase: percentual ou valor fixo, uma ou várias mensalidades", () => {
    expect(describeDiscount("percentual", 20, 1)).toBe("20% de desconto na próxima mensalidade");
    expect(describeDiscount("fixo", 3000, 3, true)).toMatch(/^R\$\s?30,00 de desconto nas 3 primeiras mensalidades$/);
  });

  it("regras: desligado não oferece; desconto zerado não aparece", () => {
    expect(referralRules({ ...base, enabled: false })).toBeNull();
    const r = referralRules(base)!;
    expect(r.referrer).toMatch(/^Você ganha 20% de desconto na próxima mensalidade quando/);
    expect(r.referred).toMatch(/^Quem você indicar ganha R\$\s?30,00/);
    expect(referralRules({ ...base, referred_value: 0 })!.referred).toBeNull();
  });

  it("WhatsApp com o link na mensagem", () => {
    expect(whatsappShareUrl("https://alinhavo.app/i/ABCD2345")).toContain(encodeURIComponent("https://alinhavo.app/i/ABCD2345"));
  });

  it("formulário do superadmin: percentual inteiro, valor fixo em reais vira centavos, limites", () => {
    expect(parseDiscount("percentual", "20", "1")).toEqual({ kind: "percentual", value: 20, months: 1 });
    expect(parseDiscount("fixo", "30,00", "3")).toEqual({ kind: "fixo", value: 3000, months: 3 });
    expect(parseDiscount("fixo", "", "1")).toEqual({ kind: "fixo", value: 0, months: 1 });
    expect(parseDiscount("percentual", "101", "1")).toHaveProperty("error");
    expect(parseDiscount("percentual", "12,5", "1")).toHaveProperty("error");
    expect(parseDiscount("fixo", "2000", "1")).toHaveProperty("error");
    expect(parseDiscount("fixo", "10", "13")).toHaveProperty("error");
    expect(parseDiscount("outro", "10", "1")).toHaveProperty("error");
  });
});
