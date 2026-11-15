import { describe, expect, it } from "vitest";
import { eventLabel, pickEvents, webhookUrlProblem } from "./webhooks";

describe("webhooks no painel", () => {
  it("aceita só https por nome público", () => {
    expect(webhookUrlProblem(" https://erp.exemplo.com.br/alinhavo?x=1 ")).toBeNull();
    expect(webhookUrlProblem("")).toMatch(/Informe/);
    expect(webhookUrlProblem("http://erp.exemplo.com")).toMatch(/https/);
    expect(webhookUrlProblem("https://u:s@erp.exemplo.com")).toMatch(/usuário/);
    expect(webhookUrlProblem("https://10.0.0.1/x")).toMatch(/IP/);
    expect(webhookUrlProblem("https://[::1]/x")).toMatch(/IP/);
    expect(webhookUrlProblem("https://localhost/x")).toMatch(/público/);
    expect(webhookUrlProblem("https://servidor/x")).toMatch(/público/);
    expect(webhookUrlProblem("https://api.internal/x")).toMatch(/público/);
    expect(webhookUrlProblem("nada")).toMatch(/inválida/);
    expect(webhookUrlProblem(`https://a.com/${"x".repeat(500)}`)).toMatch(/longa/);
  });

  it("filtra os eventos e dá os nomes", () => {
    expect(pickEvents(["risco.salvo", "x", "produto.aprovado", "risco.salvo", 3])).toEqual(["produto.aprovado", "risco.salvo"]);
    expect(pickEvents([])).toEqual([]);
    expect(eventLabel("ficha.gerada")).toBe("Ficha técnica gerada");
    expect(eventLabel("teste")).toBe("Teste");
  });
});
