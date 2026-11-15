import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { as, createDb, createUser, type User } from "./db";
import { contar, entrarComo, novaOrg } from "./helpers";

let db: PGlite;

beforeAll(async () => {
  db = await createDb();
}, 60_000);

afterAll(async () => {
  await db?.close();
});

type Cenario = { orgId: string; productId: string; dono: User; estilista: User; leitura: User; fora: User };

let seq = 0;
async function cenario(): Promise<Cenario> {
  const n = ++seq;
  const dono = await createUser(db, `idono${n}@a.com`);
  const estilista = await createUser(db, `iestilista${n}@a.com`);
  const leitura = await createUser(db, `ileitura${n}@a.com`);
  const fora = await createUser(db, `ifora${n}@a.com`);
  const { id: orgId } = await novaOrg(db, dono);
  await novaOrg(db, fora, "Outra");
  await entrarComo(db, dono, orgId, estilista, "estilista");
  await entrarComo(db, dono, orgId, leitura, "leitura");
  const productId = await as(
    db,
    dono,
    async (q) => (await q.query<{ id: string }>("insert into public.products (org_id, name) values ($1, 'Saia') returning id", [orgId])).rows[0]!.id,
  );
  return { orgId, productId, dono, estilista, leitura, fora };
}

const reservar = (u: User | null, productId: string, kind = "textos_produto") =>
  as(db, u, async (q) => (await q.query<{ id: string }>("select public.reserve_ai_generation($1, $2) as id", [productId, kind])).rows[0]!.id);
const encerrar = (u: User, id: string, ok = true) =>
  as(db, u, (q) => q.query("select public.finish_ai_generation($1, $2, 'claude-opus-5-5', 3000, 1500)", [id, ok]));
const doMes = (u: User, orgId: string) =>
  as(db, u, async (q) => (await q.query<{ n: number }>("select public.ai_generations_this_month($1) as n", [orgId])).rows[0]!.n);

describe("textos do produto", () => {
  it("quem edita produtos (inclusive a estilista) escreve os textos; todo membro lê", async () => {
    const c = await cenario();
    await as(db, c.estilista, (q) =>
      q.query("update public.products set sales_description = 'Saia midi em linho.', technical_description = 'Linho 100%.' where id = $1", [
        c.productId,
      ]),
    );
    const { rows } = await as(db, c.leitura, (q) =>
      q.query<{ sales_description: string }>("select sales_description from public.products where id = $1", [c.productId]),
    );
    expect(rows[0]!.sales_description).toBe("Saia midi em linho.");
  });

  it("só-leitura e quem é de fora não mudam; texto longo demais é recusado", async () => {
    const c = await cenario();
    for (const u of [c.leitura, c.fora]) {
      await as(db, u, (q) => q.query("update public.products set sales_description = 'x' where id = $1", [c.productId]));
    }
    expect(await contar(db, c.dono, "select 1 from public.products where id = $1 and sales_description is null", [c.productId])).toBe(1);
    await expect(
      as(db, c.dono, (q) => q.query("update public.products set sales_description = $1 where id = $2", ["x".repeat(2001), c.productId])),
    ).rejects.toThrow(/check/);
  });
});

describe("gerações por IA", () => {
  it("reserva, encerra com tokens e conta no mês; todo membro vê o registro", async () => {
    const c = await cenario();
    const id = await reservar(c.estilista, c.productId);
    expect(await doMes(c.leitura, c.orgId)).toBe(1);
    await encerrar(c.estilista, id);
    const { rows } = await as(db, c.leitura, (q) =>
      q.query<{ status: string; model: string; input_tokens: number }>(
        "select status, model, input_tokens from public.ai_generations where id = $1",
        [id],
      ),
    );
    expect(rows[0]).toEqual({ status: "pronta", model: "claude-opus-5-5", input_tokens: 3000 });
    expect(await contar(db, c.fora, "select 1 from public.ai_generations where id = $1", [id])).toBe(0);
  });

  it("só-leitura, quem é de fora e visitante não pedem; tipo desconhecido é recusado", async () => {
    const c = await cenario();
    for (const u of [c.leitura, c.fora]) await expect(reservar(u, c.productId)).rejects.toThrow(/sem permissão/);
    await expect(reservar(null, c.productId)).rejects.toThrow(/permission denied|logado/);
    await expect(reservar(c.dono, c.productId, "fotos")).rejects.toThrow(/desconhecido/);
  });

  it("só quem reservou encerra, e uma vez; falha não conta no limite", async () => {
    const c = await cenario();
    const id = await reservar(c.dono, c.productId);
    await expect(encerrar(c.estilista, id)).rejects.toThrow(/não encontrada/);
    await encerrar(c.dono, id, false);
    await expect(encerrar(c.dono, id)).rejects.toThrow(/já encerrada/);
    expect(await doMes(c.dono, c.orgId)).toBe(0);
  });

  it("ninguém escreve na tabela direto", async () => {
    const c = await cenario();
    await expect(
      as(db, c.dono, (q) =>
        q.query("insert into public.ai_generations (org_id, product_id, kind) values ($1, $2, 'textos_produto')", [c.orgId, c.productId]),
      ),
    ).rejects.toThrow(/permission denied/);
    const id = await reservar(c.dono, c.productId);
    await expect(as(db, c.dono, (q) => q.query("update public.ai_generations set status = 'erro' where id = $1", [id]))).rejects.toThrow(
      /permission denied/,
    );
  });

  it("para no limite do mês; as do mês passado não contam", async () => {
    const c = await cenario();
    // 199 gerações deste mês e 50 do mês passado, gravadas direto (como o banco faria).
    await db.query(
      `insert into public.ai_generations (org_id, product_id, kind, status, created_at)
       select $1, $2, 'textos_produto', 'pronta', now() from generate_series(1, 199)`,
      [c.orgId, c.productId],
    );
    await db.query(
      `insert into public.ai_generations (org_id, product_id, kind, status, created_at)
       select $1, $2, 'textos_produto', 'pronta', date_trunc('month', now()) - interval '1 day' from generate_series(1, 50)`,
      [c.orgId, c.productId],
    );
    await reservar(c.dono, c.productId); // a 200ª
    await expect(reservar(c.dono, c.productId)).rejects.toThrow(/200 gerações/);
    expect(await doMes(c.dono, c.orgId)).toBe(200);
  });
});
