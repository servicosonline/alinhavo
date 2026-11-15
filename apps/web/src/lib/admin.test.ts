import { describe, expect, it } from "vitest";
import { auditText, matchesFilter, packageMonthlyCents, potentialMonthlyCents, readClientDetail } from "./admin";

describe("valor do pacote", () => {
  it("assentos cheios e estilistas pelo preço de lib/plans.ts; leitura não paga", () => {
    expect(packageMonthlyCents("confeccao", "ativa", 2, 3)).toBe(2 * 11900 + 3 * 5900);
    expect(packageMonthlyCents("modelista", "ativa", 1, 0)).toBe(6900);
  });

  it("teste, cortesia, encerrado e cancelado não pagam; mas mostram o potencial", () => {
    expect(packageMonthlyCents("confeccao", "trial", 2, 0)).toBe(0);
    expect(packageMonthlyCents("confeccao", "cortesia", 2, 0)).toBe(0);
    expect(potentialMonthlyCents("confeccao", 2, 0)).toBe(23800);
  });

  it("plano desconhecido ou sem plano: sem valor", () => {
    expect(packageMonthlyCents("xyz", "ativa", 1, 0)).toBeNull();
    expect(packageMonthlyCents(null, "ativa", 1, 0)).toBeNull();
  });
});

describe("filtros de clientes", () => {
  const agora = new Date("2026-11-30T12:00:00Z").getTime();
  it("por status e os parados há 14 dias", () => {
    expect(matchesFilter({ status: "trial", last_activity: null }, "trial", agora)).toBe(true);
    expect(matchesFilter({ status: "ativa", last_activity: "2026-11-29T00:00:00Z" }, "parados", agora)).toBe(false);
    expect(matchesFilter({ status: "ativa", last_activity: "2026-11-10T00:00:00Z" }, "parados", agora)).toBe(true);
    expect(matchesFilter({ status: "ativa", last_activity: null }, "parados", agora)).toBe(true);
  });
});

describe("ficha do cliente", () => {
  it("lê o JSON do banco sem confiar no formato", () => {
    const d = readClientDetail({
      id: "o1",
      name: "Ateliê",
      plan: { plan_id: "confeccao", status: "trial", trial_ends_at: "2026-12-01" },
      members: [{ user_id: "u1", email: "a@b.com", role: "owner" }, "lixo"],
      usage: { molde_criado: "3" },
      ai: { textos_produto: { n: 2, input_tokens: 100, output_tokens: 50 } },
    })!;
    expect(d.plan?.status).toBe("trial");
    expect(d.members).toHaveLength(2);
    expect(d.members[0]!.email).toBe("a@b.com");
    expect(d.usage.molde_criado).toBe(3);
    expect(d.ai.textos_produto).toEqual({ n: 2, inputTokens: 100, outputTokens: 50 });
    expect(readClientDetail(null)).toBeNull();
  });

  it("texto da auditoria", () => {
    expect(auditText("plano_mudou", { status: "trial", dias: 30 })).toBe("mudou o plano para trial (30 dias)");
    expect(auditText("membro_removido", {})).toBe("tirou uma pessoa da organização");
  });
});
