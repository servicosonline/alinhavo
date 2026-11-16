import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { as, createDb, createUser, type User } from "./db";
import { novaOrg } from "./helpers";

let db: PGlite;

beforeAll(async () => {
  db = await createDb();
}, 60_000);

afterAll(async () => {
  await db?.close();
});

let seq = 0;
const rpc = <T = Record<string, unknown>>(u: User, sql: string, params: unknown[] = []) => as(db, u, (q) => q.query<T>(sql, params)).then((r) => r.rows);

async function setup() {
  const n = ++seq;
  const dono = await createUser(db, `ldono${n}@a.com`);
  const suporte = await createUser(db, `lsup${n}@a.com`);
  const cliente = await createUser(db, `lcli${n}@a.com`);
  await db.query("insert into public.platform_admins (user_id, role) values ($1, 'dono'), ($2, 'suporte')", [dono.id, suporte.id]);
  const { id: orgId } = await novaOrg(db, cliente, "Confecção Limite");
  const [p] = await rpc<{ id: string }>(cliente, "insert into public.products (org_id, name) values ($1, 'Saia') returning id", [orgId]);
  return { dono, suporte, cliente, orgId, productId: p!.id };
}

const reservar = (u: User, productId: string) => rpc<{ id: string }>(u, "select public.reserve_ai_generation($1, 'textos_produto') as id", [productId]).then((r) => r[0]!.id);
const encerrar = (u: User, id: string, model: string) => rpc(u, "select public.finish_ai_generation($1, true, $2, 100, 50)", [id, model]);

describe("limite de IA por cliente", () => {
  it("sem limite próprio vale o padrão; com limite próprio a reserva respeita o novo número", async () => {
    const s = await setup();
    const limite = async () => (await rpc<{ n: number }>(s.cliente, "select public.ai_limit_for($1, 'textos_produto') as n", [s.orgId]))[0]!.n;
    expect(await limite()).toBe(50);
    await rpc(s.dono, "select public.platform_set_ai_limit($1, 'textos_produto', 1)", [s.orgId]);
    expect(await limite()).toBe(1);
    await encerrar(s.cliente, await reservar(s.cliente, s.productId), "claude-opus-5-5");
    await expect(reservar(s.cliente, s.productId)).rejects.toThrow(/usou as 1 gerações/);
    await rpc(s.dono, "select public.platform_set_ai_limit($1, 'textos_produto', null)", [s.orgId]);
    expect(await limite()).toBe(50);
    const audit = await rpc<{ action: string }>(s.dono, "select action from public.platform_audit_list(20)");
    expect(audit.filter((a) => a.action === "limite_ia_mudou")).toHaveLength(2);
  });

  it("só o dono da plataforma muda; ninguém lê a tabela direto; quem não é membro não vê o limite", async () => {
    const s = await setup();
    await expect(rpc(s.suporte, "select public.platform_set_ai_limit($1, 'textos_produto', 500)", [s.orgId])).rejects.toThrow();
    await expect(rpc(s.cliente, "select public.platform_set_ai_limit($1, 'textos_produto', 500)", [s.orgId])).rejects.toThrow();
    await expect(rpc(s.cliente, "select * from public.ai_limit_overrides")).rejects.toThrow(/permission denied/);
    expect((await rpc<{ n: number | null }>(s.suporte, "select public.ai_limit_for($1, 'textos_produto') as n", [s.orgId]))[0]!.n).toBeNull();
    await expect(rpc(s.dono, "select public.platform_set_ai_limit($1, 'textos_produto', -1)", [s.orgId])).rejects.toThrow(/0 a 10.000/);
  });

  it("uso do mês: separa Claude e OpenAI e soma os tokens; só o superadmin lê", async () => {
    const s = await setup();
    await encerrar(s.cliente, await reservar(s.cliente, s.productId), "claude-opus-5-5");
    await encerrar(s.cliente, await reservar(s.cliente, s.productId), "gpt-texto-teste");
    const [u] = await rpc<{ used: number; by_claude: number; by_openai: number; input_tokens: string; monthly_limit: number; custom_limit: boolean }>(
      s.suporte,
      "select * from public.platform_ai_usage($1) where kind = 'textos_produto'",
      [s.orgId],
    );
    expect(u).toMatchObject({ used: 2, by_claude: 1, by_openai: 1, monthly_limit: 50, custom_limit: false });
    expect(Number(u!.input_tokens)).toBe(200);
    const fotos = await rpc<{ used: number }>(s.suporte, "select * from public.platform_ai_usage($1) where kind = 'foto_catalogo'", [s.orgId]);
    expect(fotos[0]!.used).toBe(0);
    await expect(rpc(s.cliente, "select * from public.platform_ai_usage(null)")).rejects.toThrow(/superadmin/);
  });
});
