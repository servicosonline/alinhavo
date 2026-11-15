import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  checkUrl,
  DISPATCH_BATCH,
  deliveryBody,
  handle,
  isPrivateIp,
  sameSecret,
  signatureHeader,
  type Claimed,
  type Deps,
} from "../functions/webhooks-dispatch/handler";

const SECRET = "segredo-do-cron";
const WH = `whsec_${"ab".repeat(32)}`;
const NOW = 1_800_000_000_000;

function item(over: Partial<Claimed> = {}): Claimed {
  return {
    id: "8a0c7c38-2b0e-4d36-9a52-6a1c2f3e4b5d",
    url: "https://erp.exemplo.com.br/alinhavo",
    secret: WH,
    event: "produto.aprovado",
    payload: { produto: { id: "p1", nome: "Saia" } },
    attempt: 1,
    created_at: "2026-11-15T12:00:00+00:00",
    ...over,
  };
}

type Call = { url: string; init: RequestInit };
type Finished = {
  id: string;
  ok: boolean;
  status: number | null;
  error: string | null;
};

function deps(items: Claimed[], over: Partial<Deps> = {}, reply: (url: string) => Response | Promise<Response> = () => new Response("ok")) {
  const calls: Call[] = [];
  const finished: Finished[] = [];
  const asked: number[] = [];
  const d: Deps = {
    dispatchSecret: SECRET,
    async claim(limit) {
      asked.push(limit);
      return items;
    },
    async finish(id, ok, status, error) {
      finished.push({ id, ok, status, error });
    },
    async resolve() {
      return ["203.0.113.10"]; // de documentação: aqui vale como público
    },
    async fetch(url, init) {
      calls.push({ url, init });
      return reply(url);
    },
    now: () => NOW,
    ...over,
  };
  return { d, calls, finished, asked };
}

const post = (secret: string | null = SECRET) =>
  new Request("https://fn/webhooks-dispatch", {
    method: "POST",
    headers: secret === null ? {} : { Authorization: `Bearer ${secret}` },
  });

describe("webhooks-dispatch", () => {
  it("sem o segredo do Cron, ou com a função sem segredo, responde 401 e não lê a fila", async () => {
    for (const [req, secret] of [
      [post(null), SECRET],
      [post("errado"), SECRET],
      [post(""), ""],
      [post("qualquer"), ""],
    ] as const) {
      const t = deps([item()], { dispatchSecret: secret });
      expect((await handle(req, t.d)).status).toBe(401);
      expect(t.asked).toEqual([]);
    }
    expect((await handle(new Request("https://fn/x"), deps([]).d)).status).toBe(405);
  });

  it("envia assinado e encerra como entregue", async () => {
    const t = deps([item()]);
    const res = await handle(post(), t.d);
    expect(await res.json()).toEqual({ enviados: 1, entregues: 1 });
    expect(t.asked).toEqual([DISPATCH_BATCH]);
    const [call] = t.calls;
    expect(call!.url).toBe(item().url);
    expect(call!.init.method).toBe("POST");
    expect(call!.init.redirect).toBe("manual");
    const h = call!.init.headers as Record<string, string>;
    expect(h["X-Alinhavo-Event"]).toBe("produto.aprovado");
    expect(h["X-Alinhavo-Delivery"]).toBe(item().id);
    expect(h["X-Alinhavo-Attempt"]).toBe("1");
    const body = call!.init.body as string;
    expect(JSON.parse(body)).toEqual({
      id: item().id,
      evento: "produto.aprovado",
      criado_em: item().created_at,
      dados: item().payload,
    });
    // O ERP confere assim (com uma biblioteca independente da nossa):
    const t0 = Math.floor(NOW / 1000);
    const expected = createHmac("sha256", WH).update(`${t0}.${body}`).digest("hex");
    expect(h["X-Alinhavo-Signature"]).toBe(`t=${t0},v1=${expected}`);
    expect(t.finished).toEqual([{ id: item().id, ok: true, status: 200, error: null }]);
  });

  it("a assinatura muda com o corpo, o segredo e o horário", async () => {
    const base = await signatureHeader(WH, 1, "{}");
    expect(await signatureHeader(WH, 1, '{"a":1}')).not.toBe(base);
    expect(await signatureHeader(`whsec_${"cd".repeat(32)}`, 1, "{}")).not.toBe(base);
    expect(await signatureHeader(WH, 2, "{}")).not.toBe(base);
    expect(deliveryBody(item({ attempt: 3 }))).toBe(deliveryBody(item())); // a tentativa não muda o corpo
  });

  it("resposta fora de 2xx, redirecionamento, erro de rede e tempo esgotado: falha com o motivo", async () => {
    const urls = ["https://a.exemplo.com/", "https://b.exemplo.com/", "https://c.exemplo.com/", "https://d.exemplo.com/"];
    const t = deps(
      urls.map((url, i) => item({ id: String(i), url })),
      {},
      (url) => {
        if (url === urls[0]) return new Response("x", { status: 500 });
        if (url === urls[1])
          return new Response(null, {
            status: 302,
            headers: { Location: "https://169.254.169.254/" },
          });
        if (url === urls[2]) throw new TypeError("fetch failed");
        throw Object.assign(new Error("timeout"), { name: "TimeoutError" });
      },
    );
    expect(await (await handle(post(), t.d)).json()).toEqual({
      enviados: 4,
      entregues: 0,
    });
    const by = Object.fromEntries(t.finished.map((f) => [f.id, f]));
    expect(by["0"]).toMatchObject({
      ok: false,
      status: 500,
      error: "O servidor respondeu 500.",
    });
    expect(by["1"]).toMatchObject({
      ok: false,
      status: 302,
      error: "Redirecionamento não é seguido.",
    });
    expect(by["2"]).toMatchObject({
      ok: false,
      status: null,
      error: "Não foi possível conectar.",
    });
    expect(by["3"]).toMatchObject({
      ok: false,
      status: null,
      error: "Sem resposta em 10 s.",
    });
  });

  it("não envia para nome que resolve para rede interna", async () => {
    const t = deps([item()], {
      resolve: async () => ["93.184.216.34", "10.0.0.7"],
    });
    await handle(post(), t.d);
    expect(t.calls).toEqual([]);
    expect(t.finished[0]).toMatchObject({
      ok: false,
      error: "O nome aponta para uma rede interna.",
    });
  });

  it("fila vazia ou erro ao ler a fila", async () => {
    expect(await (await handle(post(), deps([]).d)).json()).toEqual({
      enviados: 0,
      entregues: 0,
    });
    const t = deps([], {
      claim: async () => {
        throw new Error("db");
      },
    });
    expect((await handle(post(), t.d)).status).toBe(500);
  });
});

describe("conferência de endereço", () => {
  it("IPs privados, locais e de metadados", () => {
    for (const ip of [
      "10.1.2.3",
      "127.0.0.1",
      "169.254.169.254",
      "172.16.0.1",
      "172.31.255.255",
      "192.168.0.1",
      "100.64.0.1",
      "0.0.0.0",
      "::1",
      "fd00::1",
      "fe80::1",
      "::ffff:10.0.0.1",
      "[::1]",
    ]) {
      expect(isPrivateIp(ip), ip).toBe(true);
    }
    for (const ip of ["93.184.216.34", "172.32.0.1", "8.8.8.8", "2606:4700::1111"]) {
      expect(isPrivateIp(ip), ip).toBe(false);
    }
  });

  it("URL: só https por nome público", async () => {
    const pub = async () => ["93.184.216.34"];
    expect(await checkUrl("https://erp.exemplo.com/x", pub)).toBeNull();
    expect(await checkUrl("http://erp.exemplo.com/x", pub)).toMatch(/https/);
    expect(await checkUrl("https://u:s@erp.exemplo.com/x", pub)).toMatch(/usuário/);
    expect(await checkUrl("https://8.8.8.8/x", pub)).toMatch(/IP/);
    expect(await checkUrl("https://[2606:4700::1111]/x", pub)).toMatch(/IP/);
    expect(await checkUrl("https://servidor/x", pub)).toMatch(/interno/);
    expect(await checkUrl("https://a.localhost/x", pub)).toMatch(/interno/);
    expect(await checkUrl("https://nao-existe.exemplo.com/x", async () => [])).toMatch(/não foi encontrado/);
    expect(await checkUrl("lixo", pub)).toMatch(/inválida/);
  });

  it("compara o segredo inteiro", () => {
    expect(sameSecret("abc", "abc")).toBe(true);
    expect(sameSecret("abc", "abd")).toBe(false);
    expect(sameSecret("abc", "abcd")).toBe(false);
    expect(sameSecret("", "a")).toBe(false);
  });
});
