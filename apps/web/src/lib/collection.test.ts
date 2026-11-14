import { describe, expect, it } from "vitest";
import { daysLate, formatDay, isProductStatus, milestoneState, readDay, suggestApproved, todayInBrazil } from "./collection";

describe("cronograma", () => {
  it("situação da etapa pela data", () => {
    expect(milestoneState("2026-11-10", null, "2026-11-14")).toBe("atrasada");
    expect(milestoneState("2026-11-14", null, "2026-11-14")).toBe("proxima"); // no dia do prazo ainda não atrasou
    expect(milestoneState("2026-11-21", null, "2026-11-14")).toBe("proxima");
    expect(milestoneState("2026-11-22", null, "2026-11-14")).toBe("futura");
    expect(milestoneState("2026-11-10", "2026-11-12T10:00:00Z", "2026-11-14")).toBe("concluida");
  });

  it("dias de atraso", () => {
    expect(daysLate("2026-11-10", null, "2026-11-14")).toBe(4);
    expect(daysLate("2026-11-20", null, "2026-11-14")).toBe(0);
    expect(daysLate("2026-11-10", "2026-11-11", "2026-11-14")).toBe(0);
  });

  it("hoje no fuso de São Paulo, mesmo de madrugada em UTC", () => {
    expect(todayInBrazil(new Date("2026-11-15T02:00:00Z"))).toBe("2026-11-14");
    expect(todayInBrazil(new Date("2026-11-15T12:00:00Z"))).toBe("2026-11-15");
  });
});

describe("produto", () => {
  it("sugere aprovado só quando o cliente aprovou e o produto está antes disso", () => {
    expect(suggestApproved("prova", "aprovado")).toBe(true);
    expect(suggestApproved("ideia", "aprovado")).toBe(true);
    expect(suggestApproved("aprovado", "aprovado")).toBe(false);
    expect(suggestApproved("producao", "aprovado")).toBe(false);
    expect(suggestApproved("prova", "ajustes")).toBe(false);
    expect(suggestApproved("prova", null)).toBe(false);
  });

  it("status conhecido", () => {
    expect(isProductStatus("modelagem")).toBe(true);
    expect(isProductStatus("pronto")).toBe(false);
  });
});

describe("datas de formulário", () => {
  it("lê AAAA-MM-DD e recusa data impossível", () => {
    expect(readDay("2026-12-01")).toBe("2026-12-01");
    expect(readDay("")).toBeNull();
    expect(readDay("2026-02-30")).toBeUndefined();
    expect(readDay("01/12/2026")).toBeUndefined();
    expect(formatDay("2026-12-01")).toBe("01/12/2026");
    expect(formatDay(null)).toBe("");
  });
});
