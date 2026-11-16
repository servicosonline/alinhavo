import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { describe, expect, it, vi } from "vitest";
import type { AiClient } from "./call";
import { generateProductTexts } from "./generate-texts";
import { callProductTextsOpenAi, type OpenAiTextClient } from "./openai-text-call";
import { AI_TEXT_MODEL, productFacts } from "./product-text";

const FACTS = productFacts({ product: { name: "Saia", reference: null, collection: null }, fabric: null, trims: [], doc: null });
const JSON_OK = JSON.stringify({ venda: "Saia leve.", tecnica: "Tecido: a confirmar" });

function claude(result: { stop_reason?: string; error?: Error }): AiClient & { create: ReturnType<typeof vi.fn> } {
  const create = vi.fn(async () => {
    if (result.error) throw result.error;
    return {
      id: "m",
      type: "message",
      role: "assistant",
      model: AI_TEXT_MODEL,
      stop_reason: result.stop_reason ?? "end_turn",
      content: [{ type: "text", text: JSON_OK, citations: null }],
      usage: { input_tokens: 900, output_tokens: 120 },
    };
  });
  return { create, beta: { messages: { create: create as unknown as AiClient["beta"]["messages"]["create"] } } };
}

function openai(over: Partial<OpenAI.Responses.Response> & { refusal?: boolean } = {}): OpenAiTextClient & { create: ReturnType<typeof vi.fn> } {
  const { refusal, ...rest } = over;
  const create = vi.fn(async () => ({
    model: "gpt-texto-teste",
    status: "completed",
    output_text: JSON_OK,
    output: refusal ? [{ type: "message", content: [{ type: "refusal", refusal: "não" }] }] : [{ type: "message", content: [{ type: "output_text", text: JSON_OK }] }],
    usage: { input_tokens: 700, output_tokens: 90 },
    ...rest,
  }));
  return { create, responses: { create: create as unknown as OpenAiTextClient["responses"]["create"] } };
}

const sdkError = <T extends object>(cls: abstract new (...args: never[]) => T): Error => Object.assign(Object.create(cls.prototype), { message: "x" });

describe("generateProductTexts", () => {
  it("Claude respondeu: a reserva nem é chamada", async () => {
    const o = openai();
    const r = await generateProductTexts({ claude: claude({}), openai: { client: o, model: "gpt-texto-teste" } }, FACTS);
    expect(r).toMatchObject({ ok: true, model: AI_TEXT_MODEL, usedFallback: false });
    expect(o.create).not.toHaveBeenCalled();
  });

  it("Claude (ou o gateway) fora do ar: a OpenAI responde, com o mesmo esquema, e os tokens somam", async () => {
    for (const err of [sdkError(Anthropic.InternalServerError), sdkError(Anthropic.APIConnectionError), sdkError(Anthropic.RateLimitError)]) {
      const o = openai();
      const r = await generateProductTexts({ claude: claude({ error: err }), openai: { client: o, model: "gpt-texto-teste" } }, FACTS);
      expect(r).toMatchObject({ ok: true, model: "gpt-texto-teste", usedFallback: true, inputTokens: 700 });
      const [params] = o.create.mock.calls[0] as unknown as [Record<string, unknown>];
      expect(params).toMatchObject({ model: "gpt-texto-teste", text: { format: { type: "json_schema", strict: true } } });
    }
    const cortado = await generateProductTexts({ claude: claude({ stop_reason: "max_tokens" }), openai: { client: openai(), model: "gpt-texto-teste" } }, FACTS);
    expect(cortado).toMatchObject({ ok: true, inputTokens: 1600, outputTokens: 210 });
  });

  it("recusa do Claude não vai para a reserva", async () => {
    const o = openai();
    const r = await generateProductTexts({ claude: claude({ stop_reason: "refusal" }), openai: { client: o, model: "gpt-texto-teste" } }, FACTS);
    expect(r).toMatchObject({ ok: false, usedFallback: false });
    expect(o.create).not.toHaveBeenCalled();
  });

  it("só a OpenAI configurada responde sozinha; nenhuma, mensagem clara", async () => {
    expect(await generateProductTexts({ claude: null, openai: { client: openai(), model: "gpt-texto-teste" } }, FACTS)).toMatchObject({ ok: true, usedFallback: false });
    expect(await generateProductTexts({ claude: null, openai: null }, FACTS)).toMatchObject({ ok: false, error: expect.stringMatching(/não foi configurada/) });
  });

  it("as duas falham: erro da reserva, com o modelo configurado no registro", async () => {
    const o = { responses: { create: vi.fn(async () => Promise.reject(sdkError(OpenAI.InternalServerError))) as unknown as OpenAiTextClient["responses"]["create"] } };
    const r = await generateProductTexts({ claude: claude({ error: sdkError(Anthropic.InternalServerError) }), openai: { client: o, model: "gpt-texto-teste" } }, FACTS);
    expect(r).toMatchObject({ ok: false, model: "gpt-texto-teste", usedFallback: true, error: expect.stringMatching(/não respondeu/) });
  });
});

describe("callProductTextsOpenAi", () => {
  it("recusa, texto cortado e formato errado viram erro em português", async () => {
    expect(await callProductTextsOpenAi(openai({ refusal: true }), "m", FACTS)).toMatchObject({ ok: false, error: expect.stringMatching(/não quis/) });
    expect(await callProductTextsOpenAi(openai({ status: "incomplete" }), "m", FACTS)).toMatchObject({ ok: false, error: expect.stringMatching(/incompleto/) });
    expect(await callProductTextsOpenAi(openai({ output_text: "nada" }), "m", FACTS)).toMatchObject({ ok: false, error: expect.stringMatching(/formato/), inputTokens: 700 });
    expect(await callProductTextsOpenAi(openai({ output_text: "nada" }), "m", FACTS)).not.toHaveProperty("texts");
  });

  it("chave recusada aponta a variável certa, sem detalhe interno", async () => {
    const o = { responses: { create: vi.fn(async () => Promise.reject(sdkError(OpenAI.AuthenticationError))) as unknown as OpenAiTextClient["responses"]["create"] } };
    expect(await callProductTextsOpenAi(o, "m", FACTS)).toMatchObject({ ok: false, error: expect.stringMatching(/OPENAI_API_KEY/) });
  });
});
