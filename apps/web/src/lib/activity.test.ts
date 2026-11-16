import { describe, expect, it } from "vitest";
import { activityText, activityWho } from "./activity";

describe("registro de atividade na tela", () => {
  it("frases para as ações dos gatilhos", () => {
    expect(activityText("molde_criado", { nome: "Saia" })).toBe("criou o molde Saia");
    expect(activityText("versao_salva", { versao: 3, origem: "prova" })).toBe("salvou a versão 3 de um molde (ajuste da Prova)");
    expect(activityText("produto_status", { de: "prova", para: "producao" })).toBe("mudou um produto de prova para produção");
    expect(activityText("aprovacao_decidida", { status: "aprovado" })).toBe("aprovou a peça pelo link");
    expect(activityText("aprovacao_decidida", { status: "ajustes" })).toBe("pediu ajustes pelo link");
    expect(activityText("acao_nova", {})).toBe("acao nova");
  });

  it("quem fez", () => {
    const emails = new Map([["u1", "rita@ateliê.com"]]);
    expect(activityWho("u1", emails)).toBe("rita");
    expect(activityWho(null, emails)).toBe("A cliente");
    expect(activityWho("u2", emails)).toBe("Alguém");
  });
});
