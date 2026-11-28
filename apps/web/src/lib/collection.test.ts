import { describe, expect, it } from "vitest";
import {
  collectionPhase,
  daysLate,
  formatDay,
  isProductStatus,
  matchesProductFilter,
  milestoneState,
  readCollectionPhase,
  readDay,
  readProductFilter,
  suggestApproved,
  todayInBrazil,
} from "./collection";

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

describe("abas e filtros das coleções", () => {
  it("fase: arquivada vence; entregue só com todos em produção; sem produto é em andamento", () => {
    expect(collectionPhase("2026-11-01T00:00:00Z", ["producao"])).toBe("arquivadas");
    expect(collectionPhase(null, ["producao", "producao"])).toBe("entregues");
    expect(collectionPhase(null, ["producao", "aprovado"])).toBe("andamento");
    expect(collectionPhase(null, [])).toBe("andamento");
    expect(readCollectionPhase("entregues")).toBe("entregues");
    expect(readCollectionPhase("x")).toBe("andamento");
  });

  it("filtro dos produtos: estágio, atrasados (entregue não atrasa) e valor estranho vira todos", () => {
    const today = "2026-11-17";
    expect(matchesProductFilter({ status: "prova", due_on: null }, "prova", today)).toBe(true);
    expect(matchesProductFilter({ status: "prova", due_on: null }, "ideia", today)).toBe(false);
    expect(matchesProductFilter({ status: "modelagem", due_on: "2026-11-10" }, "atrasados", today)).toBe(true);
    expect(matchesProductFilter({ status: "producao", due_on: "2026-11-10" }, "atrasados", today)).toBe(false);
    expect(readProductFilter("atrasados")).toBe("atrasados");
    expect(readProductFilter("aprovado")).toBe("aprovado");
    expect(readProductFilter("nada")).toBe("todos");
  });
});
