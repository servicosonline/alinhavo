import { describe, expect, it } from "vitest";
import { handle, VIDEO_URL_SECONDS, type Deps } from "../functions/aprovacao-video/handler";

const TOKEN = "5f0c7c38-2b0e-4d36-9a52-6a1c2f3e4b5d";
const PATH = "org/aprov/video.mp4";

function deps(over: Partial<Deps> = {}): Deps & { asked: string[] } {
  const asked: string[] = [];
  return {
    asked,
    async videoPath(token) {
      asked.push(token);
      return token === TOKEN ? PATH : null;
    },
    async signUrl(path, seconds) {
      return `https://exemplo/assinado/${path}?s=${seconds}`;
    },
    ...over,
  };
}
const get = (q: string) => new Request(`https://fn.local/aprovacao-video${q}`);

describe("Edge Function aprovacao-video", () => {
  it("token que vale: devolve o endereço assinado com a validade", async () => {
    const res = await handle(get(`?token=${TOKEN}`), deps());
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(await res.json()).toEqual({ url: `https://exemplo/assinado/${PATH}?s=${VIDEO_URL_SECONDS}`, expiresIn: VIDEO_URL_SECONDS });
  });

  it("token errado, vencido, sem vídeo ou que nem é uuid: a mesma resposta (404)", async () => {
    const d = deps();
    const bodies = [];
    for (const q of ["?token=00000000-0000-4000-8000-000000000000", "?token=nada", "", "?token=' or 1=1 --"]) {
      const res = await handle(get(q), d);
      expect(res.status).toBe(404);
      bodies.push(await res.json());
    }
    expect(new Set(bodies.map((b) => JSON.stringify(b))).size).toBe(1);
    // O que não é uuid nem chega ao banco.
    expect(d.asked).toEqual(["00000000-0000-4000-8000-000000000000"]);
  });

  it("não conseguiu assinar: 404; banco fora do ar: 500 sem detalhe", async () => {
    expect((await handle(get(`?token=${TOKEN}`), deps({ signUrl: async () => null }))).status).toBe(404);
    const res = await handle(
      get(`?token=${TOKEN}`),
      deps({
        videoPath: async () => {
          throw new Error("conexão recusada em 10.0.0.1");
        },
      }),
    );
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toMatch(/10\.0\.0\.1/);
  });

  it("CORS: responde ao preflight e recusa outros métodos", async () => {
    const pre = await handle(new Request("https://fn.local/aprovacao-video", { method: "OPTIONS" }), deps());
    expect(pre.status).toBe(204);
    expect(pre.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect((await handle(new Request(`https://fn.local/aprovacao-video?token=${TOKEN}`, { method: "POST" }), deps())).status).toBe(405);
  });
});
