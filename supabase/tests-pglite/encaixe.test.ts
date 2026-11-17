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

const DOC = { schema: 4, unit: "mm", sizes: ["M"], baseSize: "M", pieces: [], seams: [] };
const LAYOUT = { schema: 1, pieces: [], placements: [] };

type Cenario = {
  orgId: string;
  productId: string;
  patternId: string;
  dono: User;
  modelista: User;
  estilista: User;
  outra: User;
  leitura: User;
  fora: User;
};

let seq = 0;
async function cenario(): Promise<Cenario> {
  const n = ++seq;
  const dono = await createUser(db, `dono${n}@e.com`);
  const modelista = await createUser(db, `modelista${n}@e.com`);
  const estilista = await createUser(db, `estilista${n}@e.com`);
  const outra = await createUser(db, `outra${n}@e.com`);
  const leitura = await createUser(db, `leitura${n}@e.com`);
  const fora = await createUser(db, `fora${n}@e.com`);
  const { id: orgId } = await novaOrg(db, dono);
  await entrarComo(db, dono, orgId, modelista, "modelista");
  await entrarComo(db, dono, orgId, estilista, "estilista");
  await entrarComo(db, dono, orgId, outra, "modelista");
  await entrarComo(db, dono, orgId, leitura, "leitura");
  const { patternId, productId } = await as(db, dono, async (q) => {
    const pat = (await q.query<{ id: string }>("insert into public.patterns (org_id, name) values ($1, 'Saia') returning id", [orgId])).rows[0]!;
    await q.query("select public.save_pattern_version($1, $2, 'editor', 0)", [pat.id, JSON.stringify(DOC)]);
    const prod = (
      await q.query<{ id: string }>("insert into public.products (org_id, name, pattern_id) values ($1, 'Saia', $2) returning id", [orgId, pat.id])
    ).rows[0]!;
    return { patternId: pat.id, productId: prod.id };
  });
  return { orgId, productId, patternId, dono, modelista, estilista, outra, leitura, fora };
}

type Args = {
  version?: number;
  fabricId?: string | null;
  width?: number;
  demand?: unknown;
  length?: number;
  efficiency?: number;
  layout?: unknown;
};

const salvar = (u: User, productId: string, a: Args = {}) =>
  as(db, u, async (q) =>
    (
      await q.query<{ number: number; pattern_id: string; pattern_version: number }>(
        "select number, pattern_id, pattern_version from public.create_marker($1, $2, $3, $4, $5, $6, $7, $8)",
        [
          productId,
          a.version ?? 1,
          a.fabricId ?? null,
          a.width ?? 1500,
          JSON.stringify(a.demand ?? { M: 2 }),
          a.length ?? 1234.5,
          a.efficiency ?? 0.81,
          JSON.stringify(a.layout ?? LAYOUT),
        ],
      )
    ).rows[0]!,
  );

describe("encaixe (markers)", () => {
  it("quem edita produto salva riscos numerados 1, 2… presos à versão do molde; todo membro lê, quem é de fora não", async () => {
    const c = await cenario();
    const r1 = await salvar(c.modelista, c.productId);
    expect(r1).toEqual({ number: 1, pattern_id: c.patternId, pattern_version: 1 });
    expect((await salvar(c.outra, c.productId)).number).toBe(2);
    // O encaixe é da modelista: a estilista edita o produto, mas não salva risco.
    await expect(salvar(c.estilista, c.productId)).rejects.toThrow(/sem permissão/);
    expect((await salvar(c.dono, c.productId)).number).toBe(3);
    expect(await contar(db, c.leitura, "select 1 from public.markers where product_id = $1", [c.productId])).toBe(3);
    expect(await contar(db, c.fora, "select 1 from public.markers where product_id = $1", [c.productId])).toBe(0);
  });

  it("recusa sem permissão, sem molde, versão inexistente e tecido de outra organização", async () => {
    const a = await cenario();
    const b = await cenario();
    await expect(salvar(a.leitura, a.productId)).rejects.toThrow(/sem permissão/);
    await expect(salvar(a.fora, a.productId)).rejects.toThrow(/sem permissão/);
    await expect(salvar(a.dono, a.productId, { version: 7 })).rejects.toThrow(/versão do molde não existe/);
    const fabB = await as(db, b.dono, async (q) => (await q.query<{ id: string }>("insert into public.fabrics (org_id, name) values ($1, 'Sarja') returning id", [b.orgId])).rows[0]!);
    await expect(salvar(a.dono, a.productId, { fabricId: fabB.id })).rejects.toThrow(/Tecido não encontrado/);
    const fabA = await as(db, a.dono, async (q) => (await q.query<{ id: string }>("insert into public.fabrics (org_id, name) values ($1, 'Sarja') returning id", [a.orgId])).rows[0]!);
    expect((await salvar(a.dono, a.productId, { fabricId: fabA.id })).number).toBe(1);
    await as(db, a.dono, (q) => q.query("update public.products set pattern_id = null where id = $1", [a.productId]));
    await expect(salvar(a.dono, a.productId)).rejects.toThrow(/Ligue um molde/);
  });

  it("valores fora da faixa e layout fora do formato são recusados", async () => {
    const c = await cenario();
    await expect(salvar(c.dono, c.productId, { width: 50 })).rejects.toThrow(/check/);
    await expect(salvar(c.dono, c.productId, { efficiency: 1.2 })).rejects.toThrow(/check/);
    await expect(salvar(c.dono, c.productId, { efficiency: 0 })).rejects.toThrow(/check/);
    await expect(salvar(c.dono, c.productId, { length: 0 })).rejects.toThrow(/check/);
    await expect(salvar(c.dono, c.productId, { demand: {} })).rejects.toThrow(/check/);
    await expect(salvar(c.dono, c.productId, { demand: [1] })).rejects.toThrow(/check/);
    await expect(salvar(c.dono, c.productId, { layout: { schema: 2 } })).rejects.toThrow(/check/);
  });

  it("risco não muda nem se escreve direto; só quem edita apaga", async () => {
    const c = await cenario();
    await salvar(c.dono, c.productId);
    await salvar(c.dono, c.productId);
    await expect(as(db, c.dono, (q) => q.query("update public.markers set length_mm = 1 where product_id = $1", [c.productId]))).rejects.toThrow(
      /permission denied/,
    );
    await expect(
      as(db, c.dono, (q) =>
        q.query(
          "insert into public.markers (org_id, product_id, number, pattern_version, width_mm, demand, length_mm, efficiency, layout) values ($1, $2, 9, 1, 1500, '{\"M\":1}', 10, 0.5, $3)",
          [c.orgId, c.productId, JSON.stringify(LAYOUT)],
        ),
      ),
    ).rejects.toThrow(/permission denied/);
    await expect(db.query("update public.markers set number = 99 where product_id = $1", [c.productId])).rejects.toThrow(/não podem ser alteradas/);

    // Só-leitura e quem é de fora não apagam (a linha some da visão, nada acontece).
    await as(db, c.leitura, (q) => q.query("delete from public.markers where product_id = $1", [c.productId]));
    await as(db, c.fora, (q) => q.query("delete from public.markers where product_id = $1", [c.productId]));
    await as(db, c.estilista, (q) => q.query("delete from public.markers where product_id = $1", [c.productId]));
    expect(await contar(db, c.dono, "select 1 from public.markers where product_id = $1", [c.productId])).toBe(2);
    await as(db, c.outra, (q) => q.query("delete from public.markers where product_id = $1 and number = 1", [c.productId]));
    expect(await contar(db, c.dono, "select 1 from public.markers where product_id = $1", [c.productId])).toBe(1);
    // O próximo continua a numeração.
    expect((await salvar(c.dono, c.productId)).number).toBe(3);
  });

  it("apagar o produto leva os riscos junto", async () => {
    const c = await cenario();
    await salvar(c.dono, c.productId);
    await as(db, c.dono, (q) => q.query("delete from public.products where id = $1", [c.productId]));
    expect(await db.query("select 1 from public.markers where product_id = $1", [c.productId]).then((r) => r.rows.length)).toBe(0);
  });
});
