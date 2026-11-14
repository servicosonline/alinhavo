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

type Cenario = { orgId: string; productId: string; dono: User; modelista: User; leitura: User; fora: User };

let seq = 0;
async function cenario(): Promise<Cenario> {
  const n = ++seq;
  const dono = await createUser(db, `dono${n}@k.com`);
  const modelista = await createUser(db, `modelista${n}@k.com`);
  const leitura = await createUser(db, `leitura${n}@k.com`);
  const fora = await createUser(db, `fora${n}@k.com`);
  const { id: orgId } = await novaOrg(db, dono);
  await entrarComo(db, dono, orgId, modelista, "modelista");
  await entrarComo(db, dono, orgId, leitura, "leitura");
  const productId = await as(db, dono, async (q) =>
    (await q.query<{ id: string }>("insert into public.products (org_id, name) values ($1, 'Calça') returning id", [orgId])).rows[0]!.id,
  );
  return { orgId, productId, dono, modelista, leitura, fora };
}

const comentar = (u: User, orgId: string, productId: string, body: string) =>
  as(db, u, async (q) =>
    (await q.query<{ id: string; author: string }>("insert into public.comments (org_id, product_id, body) values ($1, $2, $3) returning id, author", [orgId, productId, body])).rows[0]!,
  );

describe("comentários", () => {
  it("todo membro comenta (até só-leitura), o autor é quem está logado, e todos leem", async () => {
    const c = await cenario();
    const a = await comentar(c.leitura, c.orgId, c.productId, "A barra ficou ótima.");
    expect(a.author).toBe(c.leitura.id);
    await comentar(c.modelista, c.orgId, c.productId, "Vou subir 1 cm na cintura.");
    expect(await contar(db, c.dono, "select 1 from public.comments where product_id = $1", [c.productId])).toBe(2);
  });

  it("quem é de fora não lê nem comenta; visitante não acessa", async () => {
    const c = await cenario();
    await comentar(c.dono, c.orgId, c.productId, "Interno.");
    expect(await contar(db, c.fora, "select 1 from public.comments where product_id = $1", [c.productId])).toBe(0);
    await expect(comentar(c.fora, c.orgId, c.productId, "Oi")).rejects.toThrow(/row-level security/);
    await expect(as(db, null, (q) => q.query("select * from public.comments"))).rejects.toThrow(/permission denied/);
  });

  it("ninguém comenta em nome de outro nem edita", async () => {
    const c = await cenario();
    await expect(
      as(db, c.modelista, (q) =>
        q.query("insert into public.comments (org_id, product_id, body, author) values ($1, $2, 'Falso', $3)", [c.orgId, c.productId, c.dono.id]),
      ),
    ).rejects.toThrow(/permission denied/);
    const a = await comentar(c.modelista, c.orgId, c.productId, "Original.");
    await expect(as(db, c.modelista, (q) => q.query("update public.comments set body = 'Editado' where id = $1", [a.id]))).rejects.toThrow(
      /permission denied/,
    );
  });

  it("cada um apaga o seu; dono e admin apagam qualquer um", async () => {
    const c = await cenario();
    const doLeitura = await comentar(c.leitura, c.orgId, c.productId, "Meu.");
    const daModelista = await comentar(c.modelista, c.orgId, c.productId, "Dela.");
    await as(db, c.leitura, (q) => q.query("delete from public.comments where id = $1", [daModelista.id]));
    expect(await contar(db, c.dono, "select 1 from public.comments where id = $1", [daModelista.id])).toBe(1); // não apagou o alheio
    await as(db, c.leitura, (q) => q.query("delete from public.comments where id = $1", [doLeitura.id]));
    expect(await contar(db, c.dono, "select 1 from public.comments where id = $1", [doLeitura.id])).toBe(0);
    await as(db, c.dono, (q) => q.query("delete from public.comments where id = $1", [daModelista.id]));
    expect(await contar(db, c.dono, "select 1 from public.comments where id = $1", [daModelista.id])).toBe(0);
  });

  it("texto vazio ou longo demais é recusado", async () => {
    const c = await cenario();
    await expect(comentar(c.dono, c.orgId, c.productId, "   ")).rejects.toThrow(/check/);
    await expect(comentar(c.dono, c.orgId, c.productId, "x".repeat(4001))).rejects.toThrow(/check/);
  });
});
