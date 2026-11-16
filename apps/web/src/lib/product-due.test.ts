import { describe, expect, it } from "vitest";
import { productDueState } from "./collection";

describe("prazo de entrega do produto", () => {
  const hoje = "2026-11-20";

  it("sem prazo, nada a mostrar", () => {
    expect(productDueState(null, "ideia", hoje)).toBeNull();
  });

  it("atrasado, vence em breve e no prazo, enquanto não foi entregue", () => {
    expect(productDueState("2026-11-18", "modelagem", hoje)).toBe("atrasada");
    expect(productDueState("2026-11-25", "prova", hoje)).toBe("proxima");
    expect(productDueState("2027-01-10", "ideia", hoje)).toBe("futura");
  });

  it("aprovado ou em produção conta como entregue: não atrasa", () => {
    expect(productDueState("2026-11-01", "aprovado", hoje)).toBe("concluida");
    expect(productDueState("2026-11-01", "producao", hoje)).toBe("concluida");
  });
});
