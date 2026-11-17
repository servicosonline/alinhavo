import { describe, expect, it } from "vitest";
import { inviteQuote, rolePriceCents, seatKind, teamMonthlyCents } from "./invite-price";
import { planById } from "./plans";

const confeccao = planById("confeccao");
const cheio = confeccao.precoPorUsuarioCents!;
const estilista = confeccao.precoEstilistaCents!;

describe("preço da equipe e do convite", () => {
  it("papel → assento: dono, admin e modelista cheios; estilista; leitura", () => {
    expect(["owner", "admin", "modelista"].map((r) => seatKind(r as "owner"))).toEqual(["cheio", "cheio", "cheio"]);
    expect(seatKind("estilista")).toBe("estilista");
    expect(seatKind("leitura")).toBe("leitura");
  });

  it("preço do papel vem de plans.ts; leitura é grátis; plano sem assento de estilista cobra cheio", () => {
    expect(rolePriceCents("confeccao", "modelista")).toBe(cheio);
    expect(rolePriceCents("confeccao", "estilista")).toBe(estilista);
    expect(rolePriceCents("confeccao", "leitura")).toBe(0);
    expect(rolePriceCents("modelista", "estilista")).toBe(planById("modelista").precoPorUsuarioCents);
    expect(rolePriceCents("estilista", "admin")).toBeNull(); // plano sem preço decidido
    expect(rolePriceCents("nao-existe", "admin")).toBeNull();
  });

  it("mensalidade da equipe soma os assentos", () => {
    expect(teamMonthlyCents("confeccao", ["owner", "modelista", "estilista", "leitura"])).toBe(2 * cheio + estilista);
  });

  it("o convite soma o assento do papel; os convites pendentes já contam antes", () => {
    const q = inviteQuote({ planId: "confeccao", status: "ativa", members: ["owner"], pending: ["estilista"], role: "modelista" })!;
    expect(q).toEqual({ roleCents: cheio, beforeCents: cheio + estilista, afterCents: 2 * cheio + estilista, deltaCents: cheio, charging: true });
    const leitura = inviteQuote({ planId: "confeccao", status: "ativa", members: ["owner"], pending: [], role: "leitura" })!;
    expect(leitura.deltaCents).toBe(0);
  });

  it("no teste e na cortesia a conta aparece, mas não é cobrada agora", () => {
    for (const status of ["trial", "cortesia", "vencida"] as const) {
      const q = inviteQuote({ planId: "confeccao", status, members: ["owner"], pending: [], role: "admin" })!;
      expect(q.charging).toBe(false);
      expect(q.deltaCents).toBe(cheio);
    }
  });

  it("sem preço decidido, não há conta", () => {
    expect(inviteQuote({ planId: "estilista", status: "ativa", members: ["owner"], pending: [], role: "admin" })).toBeNull();
  });
});
