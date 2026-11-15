import OpenAI from "openai";
import { describe, expect, it } from "vitest";
import { CATALOG_PHOTO_MODEL } from "./catalog-photo";
import { callCatalogPhoto, type ImageClient, type ImageRequest } from "./image-call";

const REQ: ImageRequest = { image: new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), mime: "image/jpeg", prompt: "foto", quality: "medium", safetyId: "abc" };
const JPEG_OUT = Buffer.from([0xff, 0xd8, 0xff, 0xdb, 9, 9]).toString("base64");
const USAGE = { input_tokens: 1200, output_tokens: 1600, total_tokens: 2800, input_tokens_details: { image_tokens: 1000, text_tokens: 200 } };

type Sent = { body: Record<string, unknown>; options: Record<string, unknown> };

function client(reply: () => unknown): ImageClient & { sent: Sent[] } {
  const sent: Sent[] = [];
  return {
    sent,
    images: {
      edit: (async (body: Record<string, unknown>, options: Record<string, unknown>) => {
        sent.push({ body, options });
        return reply();
      }) as unknown as ImageClient["images"]["edit"],
    },
  };
}

/** Como o SDK monta o erro a partir da resposta ({ error: { code, message } }). */
const apiError = (status: number, code?: string) => OpenAI.APIError.generate(status, { error: { code, message: "x" } }, "x", new Headers());

describe("chamada da foto de catálogo", () => {
  it("manda a captura com as opções certas e devolve o JPEG com os tokens", async () => {
    const c = client(() => ({ created: 1, data: [{ b64_json: JPEG_OUT }], usage: USAGE }));
    const r = await callCatalogPhoto(c, REQ);
    expect(r).toMatchObject({ ok: true, ext: "jpg", mime: "image/jpeg", model: CATALOG_PHOTO_MODEL, inputTokens: 1200, outputTokens: 1600 });
    expect(r.ok && [...r.bytes]).toEqual([0xff, 0xd8, 0xff, 0xdb, 9, 9]);
    const { body, options } = c.sent[0]!;
    expect(body).toMatchObject({
      model: CATALOG_PHOTO_MODEL,
      prompt: "foto",
      n: 1,
      size: "1024x1536",
      quality: "medium",
      output_format: "jpeg",
      safety_identifier: "abc",
    });
    expect((body.image as File).type).toBe("image/jpeg");
    expect(options).toMatchObject({ maxRetries: 0 });
  });

  it("erros da OpenAI viram mensagens em português", async () => {
    const cases: [unknown, RegExp][] = [
      [apiError(401), /chave da OpenAI/],
      [apiError(403), /verificar a organização/],
      [apiError(429), /muitos pedidos/],
      [apiError(400, "moderation_blocked"), /filtro de segurança/],
      [apiError(400), /recusou o pedido/],
      [apiError(500), /não respondeu/],
      [new OpenAI.APIConnectionTimeoutError(), /demorou demais/],
      [new Error("rede"), /Não foi possível falar/],
    ];
    for (const [err, msg] of cases) {
      const r = await callCatalogPhoto(
        client(() => {
          throw err;
        }),
        REQ,
      );
      expect(r).toMatchObject({ ok: false, error: expect.stringMatching(msg), inputTokens: 0 });
    }
  });

  it("resposta sem foto ou fora de JPEG falha, mas guarda os tokens", async () => {
    const vazia = await callCatalogPhoto(
      client(() => ({ created: 1, data: [], usage: USAGE })),
      REQ,
    );
    expect(vazia).toMatchObject({ ok: false, inputTokens: 1200, outputTokens: 1600 });
    const png = await callCatalogPhoto(
      client(() => ({ created: 1, data: [{ b64_json: Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString("base64") }], usage: USAGE })),
      REQ,
    );
    expect(png).toMatchObject({ ok: false, error: expect.stringMatching(/formato inesperado/) });
  });
});
