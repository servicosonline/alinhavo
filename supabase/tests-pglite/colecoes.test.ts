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

type Equipe = { orgId: string; dono: User; modelista: User; estilista: User; leitura: User; fora: User };

let seq = 0;
async function equipe(): Promise<Equipe> {
  const n = ++seq;
  const dono = await createUser(db, `dono${n}@c.com`);
  const modelista = await createUser(db, `modelista${n}@c.com`);
  const estilista = await createUser(db, `estilista${n}@c.com`);
  const leitura = await createUser(db, `leitura${n}@c.com`);
  const fora = await createUser(db, `fora${n}@c.com`);
  const { id: orgId } = await novaOrg(db, dono);
  await entrarComo(db, dono, orgId, modelista, "modelista");
  await entrarComo(db, dono, orgId, estilista, "estilista");
  await entrarComo(db, dono, orgId, leitura, "leitura");
  return { orgId, dono, modelista, estilista, leitura, fora };
}

async function um<T>(user: User, sql: string, params: unknown[] = []): Promise<T> {
  return as(db, user, async (q) => (await q.query<T>(sql, params)).rows[0]!);
}

const novaColecao = (u: User, orgId: string, name = "Verão 27") =>
  um<{ id: string }>(u, "insert into public.collections (org_id, name, season) values ($1, $2, 'Verão') returning id", [orgId, name]);

const novoProduto = (u: User, orgId: string, collectionId: string | null, ref: string | null = null, patternId: string | null = null) =>
  um<{ id: string }>(
    u,
    "insert into public.products (org_id, collection_id, reference, name, pattern_id) values ($1, $2, $3, 'Calça reta', $4) returning id",
    [orgId, collectionId, ref, patternId],
  );

const novoMolde = (u: User, orgId: string) =>
  um<{ id: string }>(u, "insert into public.patterns (org_id, name) values ($1, 'Calça') returning id", [orgId]);

describe("coleções e produtos", () => {
  it("estilista cria coleção, produto e etapa; todo membro lê", async () => {
    const e = await equipe();
    const col = await novaColecao(e.estilista, e.orgId);
    const prod = await novoProduto(e.estilista, e.orgId, col.id, "CAL-001");
    await um(e.estilista, "insert into public.milestones (org_id, collection_id, title, due_on, assignee) values ($1, $2, 'Pilotagem', '2026-12-01', $3) returning id", [
      e.orgId,
      col.id,
      e.modelista.id,
    ]);
    expect(await contar(db, e.leitura, "select 1 from public.collections where id = $1", [col.id])).toBe(1);
    expect(await contar(db, e.leitura, "select 1 from public.products where id = $1", [prod.id])).toBe(1);
    expect(await contar(db, e.leitura, "select 1 from public.milestones where collection_id = $1", [col.id])).toBe(1);
    // Estilista muda o status do produto.
    await as(db, e.estilista, (q) => q.query("update public.products set status = 'modelagem' where id = $1", [prod.id]));
    expect((await um<{ status: string }>(e.leitura, "select status from public.products where id = $1", [prod.id])).status).toBe("modelagem");
  });

  it("só-leitura e quem é de fora não escrevem; quem é de fora não lê", async () => {
    const e = await equipe();
    const col = await novaColecao(e.dono, e.orgId);
    await expect(novaColecao(e.leitura, e.orgId)).rejects.toThrow(/row-level security/);
    await expect(novoProduto(e.leitura, e.orgId, col.id)).rejects.toThrow(/row-level security/);
    await expect(novaColecao(e.fora, e.orgId)).rejects.toThrow(/row-level security/);
    expect(await contar(db, e.fora, "select 1 from public.collections where id = $1", [col.id])).toBe(0);
    await expect(as(db, null, (q) => q.query("select * from public.products"))).rejects.toThrow(/permission denied/);
  });

  it("só dono e admin apagam coleção; os produtos ficam, sem coleção", async () => {
    const e = await equipe();
    const col = await novaColecao(e.dono, e.orgId);
    const prod = await novoProduto(e.modelista, e.orgId, col.id);
    await as(db, e.modelista, (q) => q.query("delete from public.collections where id = $1", [col.id]));
    expect(await contar(db, e.dono, "select 1 from public.collections where id = $1", [col.id])).toBe(1);
    await as(db, e.dono, (q) => q.query("delete from public.collections where id = $1", [col.id]));
    expect((await um<{ collection_id: string | null }>(e.dono, "select collection_id from public.products where id = $1", [prod.id])).collection_id).toBeNull();
  });

  it("referência única na organização (sem diferenciar maiúsculas) e um molde por produto", async () => {
    const e = await equipe();
    await novoProduto(e.dono, e.orgId, null, "CAL-001");
    await expect(novoProduto(e.dono, e.orgId, null, "cal-001")).rejects.toThrow(/duplicate key/);
    const molde = await novoMolde(e.modelista, e.orgId);
    await novoProduto(e.estilista, e.orgId, null, null, molde.id); // estilista liga o molde
    await expect(novoProduto(e.estilista, e.orgId, null, null, molde.id)).rejects.toThrow(/duplicate key/);
  });

  it("nada aponta para outra organização, nem para quem participa das duas", async () => {
    const a = await equipe();
    const b = await equipe();
    await entrarComo(db, b.dono, b.orgId, a.modelista, "modelista");
    const colB = await novaColecao(b.dono, b.orgId);
    const moldeB = await novoMolde(b.dono, b.orgId);
    await expect(novoProduto(a.modelista, a.orgId, colB.id)).rejects.toThrow(/foreign key/);
    await expect(novoProduto(a.modelista, a.orgId, null, null, moldeB.id)).rejects.toThrow(/foreign key/);
  });

  it("responsável da etapa precisa ser da organização; org_id não muda", async () => {
    const e = await equipe();
    const col = await novaColecao(e.dono, e.orgId);
    await expect(
      um(e.dono, "insert into public.milestones (org_id, collection_id, title, due_on, assignee) values ($1, $2, 'Corte', '2026-12-10', $3)", [
        e.orgId,
        col.id,
        e.fora.id,
      ]),
    ).rejects.toThrow(/row-level security/);
    const prod = await novoProduto(e.dono, e.orgId, col.id);
    const outra = await novaOrg(db, e.dono, "Outra");
    await expect(as(db, e.dono, (q) => q.query("update public.products set org_id = $1 where id = $2", [outra.id, prod.id]))).rejects.toThrow(
      /permission denied/,
    );
  });

  it("lançamento não pode vir antes do início", async () => {
    const e = await equipe();
    await expect(
      um(e.dono, "insert into public.collections (org_id, name, starts_on, launch_on) values ($1, 'Inverno', '2027-03-01', '2027-01-01')", [e.orgId]),
    ).rejects.toThrow(/check/);
  });
});
