import Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it, vi } from "vitest";
import { callProductTexts, type AiClient } from "./call";
import { AI_TEXT_MODEL, productFacts } from "./product-text";

const FACTS = productFacts({ product: { name: "Saia", reference: null, collection: null }, fabric: null, trims: [], doc: null });

function message(over: Partial<Anthropic.Beta.BetaMessage> & { text?: string }): Anthropic.Beta.BetaMessage {
  const { text = JSON.stringify({ venda: "Saia leve.", tecnica: "Tecido: a confirmar" }), ...rest } = over;
  return {
    id: "msg_1",
    type: "message",
    role: "assistant",
    model: AI_TEXT_MODEL,
    stop_reason: "end_turn",
    content: [{ type: "text", text, citations: null }],
    usage: { input_tokens: 900, output_tokens: 120 },
    ...rest,
  } as unknown as Anthropic.Beta.BetaMessage;
}

function client(result: Anthropic.Beta.BetaMessage | Error): AiClient & { create: ReturnType<typeof vi.fn> } {
  const create = vi.fn(async () => {
    if (result instanceof Error) throw result;
    return result;
  });
  return { create, beta: { messages: { create: create as unknown as AiClient["beta"]["messages"]["create"] } } };
}

/** Uma instância do erro do SDK, sem depender da assinatura do construtor. */
const sdkError = <T extends object>(cls: abstract new (...args: never[]) => T): Error =>
  Object.assign(Object.create(cls.prototype), { message: "x" });

describe("callProductTexts", () => {
  it("pede no formato do esquema, com esforço baixo e queda para outro modelo em recusa", async () => {
    const c = client(message({}));
    const r = await callProductTexts(c, FACTS);
    expect(r).toEqual({
      ok: true,
      texts: { sales: "Saia leve.", technical: "Tecido: a confirmar" },
      model: AI_TEXT_MODEL,
      inputTokens: 900,
      outputTokens: 120,
    });
    const [params] = c.create.mock.calls[0] as unknown as [Record<string, unknown>];
    expect(params.model).toBe(AI_TEXT_MODEL);
    expect(params.fallbacks).toBe("default");
    expect(params.betas).toEqual(["server-side-fallback-2026-07-01"]);
    expect(params.output_config).toMatchObject({ effort: "low", format: { type: "json_schema" } });
  });

  it("recusa, texto cortado ou formato errado: erro em português, com os tokens para o registro", async () => {
    for (const [msg, pattern] of [
      [message({ stop_reason: "refusal" }), /não quis/],
      [message({ stop_reason: "max_tokens" }), /incompleto/],
      [message({ text: "isto não é json" }), /formato inesperado/],
    ] as const) {
      const r = await callProductTexts(client(msg), FACTS);
      expect(r.ok).toBe(false);
      if (r.ok) continue;
      expect(r.error).toMatch(pattern);
      expect(r.inputTokens).toBe(900);
    }
  });

  it("erros da API viram mensagens sem detalhe interno", async () => {
    const cases: [Error, RegExp][] = [
      [sdkError(Anthropic.AuthenticationError), /chave da IA não foi aceita/],
      [sdkError(Anthropic.RateLimitError), /muitos pedidos/],
      [sdkError(Anthropic.BadRequestError), /recusou o pedido/],
      [sdkError(Anthropic.InternalServerError), /não respondeu/],
      [sdkError(Anthropic.APIConnectionError), /não respondeu/],
      [new Error("10.0.0.1 recusou"), /Não foi possível/],
    ];
    for (const [err, pattern] of cases) {
      const r = await callProductTexts(client(err), FACTS);
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.error).toMatch(pattern);
        expect(r.error).not.toMatch(/10\.0\.0\.1/);
        expect(r.inputTokens).toBe(0);
      }
    }
  });
});
