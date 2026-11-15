import { describe, expect, it, vi } from "vitest";
import { badId, bearerKey, parseLimit, rpcErrorResponse, runApi, type Rpc } from "./v1";

const KEY = `alv_${"a".repeat(64)}`;
const req = (auth?: string) => new Request("https://app.test/api/v1/colecoes", { headers: auth ? { authorization: auth } : {} });

describe("bearerKey", () => {
  it("lê o Bearer e recusa o resto", () => {
    expect(bearerKey(`Bearer ${KEY}`)).toBe(KEY);
    expect(bearerKey(`bearer   ${KEY}  `)).toBe(KEY);
    expect(bearerKey(KEY)).toBeNull();
    expect(bearerKey("Basic abc")).toBeNull();
    expect(bearerKey(null)).toBeNull();
  });
});

describe("parseLimit", () => {
  it("padrão 50, de 1 a 100, só inteiro", () => {
    expect(parseLimit(null)).toBe(50);
    expect(parseLimit("")).toBe(50);
    expect(parseLimit("100")).toBe(100);
    for (const bad of ["0", "101", "-1", "2.5", "abc"]) expect(parseLimit(bad)).toBeNull();
  });
});

describe("respostas", () => {
  it("chave inválida: 401; limite: 429 com Retry-After; outro erro: 500 sem detalhe", async () => {
    const r401 = rpcErrorResponse({ code: "28000", message: "x" });
    expect(r401.status).toBe(401);
    expect(r401.headers.get("WWW-Authenticate")).toBe("Bearer");
    const r429 = rpcErrorResponse({ code: "54000", message: "Limite de 60 pedidos por minuto por chave." });
    expect(r429.status).toBe(429);
    expect(r429.headers.get("Retry-After")).toBe("60");
    expect(await r429.json()).toEqual({ erro: "Limite de 60 pedidos por minuto por chave." });
    const r500 = rpcErrorResponse({ code: "XX000", message: "relation secreta não existe" });
    expect(r500.status).toBe(500);
    expect(JSON.stringify(await r500.json())).not.toMatch(/secreta/);
  });

  it("id que não é uuid: 404 sem ir ao banco", () => {
    expect(badId("1 or 1=1")?.status).toBe(404);
    expect(badId("11111111-1111-4111-8111-111111111111")).toBeNull();
  });
});

describe("runApi", () => {
  it("passa a chave e os argumentos ao banco e devolve o JSON, sem cache", async () => {
    const rpc = vi.fn<Rpc>(async () => ({ data: [{ nome: "Verão" }], error: null }));
    const res = await runApi(req(`Bearer ${KEY}`), rpc, "api_collections", {});
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(await res.json()).toEqual([{ nome: "Verão" }]);
    expect(rpc).toHaveBeenCalledWith("api_collections", { p_key: KEY });
  });

  it("sem chave: 401 sem ir ao banco; null do banco: 404; sem Supabase: 503; exceção: 500", async () => {
    const rpc = vi.fn<Rpc>(async () => ({ data: null, error: null }));
    expect((await runApi(req(), rpc, "api_collections", {})).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
    expect((await runApi(req(`Bearer ${KEY}`), rpc, "api_product", { p_id: "x" })).status).toBe(404);
    expect((await runApi(req(`Bearer ${KEY}`), null, "api_collections", {})).status).toBe(503);
    const boom: Rpc = async () => {
      throw new Error("rede");
    };
    expect((await runApi(req(`Bearer ${KEY}`), boom, "api_collections", {})).status).toBe(500);
  });
});
