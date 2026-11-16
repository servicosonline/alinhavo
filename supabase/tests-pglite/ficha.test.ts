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
const FICHA = { schema: 1, product: { name: "Calça" } };

type Cenario = { orgId: string; productId: string; patternId: string; dono: User; estilista: User; leitura: User; fora: User };

let seq = 0;
async function cenario(): Promise<Cenario> {
  const n = ++seq;
  const dono = await createUser(db, `dono${n}@f.com`);
  const estilista = await createUser(db, `estilista${n}@f.com`);
  const leitura = await createUser(db, `leitura${n}@f.com`);
  const fora = await createUser(db, `fora${n}@f.com`);
  const { id: orgId } = await novaOrg(db, dono);
  await entrarComo(db, dono, orgId, estilista, "estilista");
  await entrarComo(db, dono, orgId, leitura, "leitura");
  const { patternId, productId } = await as(db, dono, async (q) => {
    const pat = (await q.query<{ id: string }>("insert into public.patterns (org_id, name) values ($1, 'Calça') returning id", [orgId])).rows[0]!;
    await q.query("select public.save_pattern_version($1, $2, 'editor', 0)", [pat.id, JSON.stringify(DOC)]);
    const prod = (
      await q.query<{ id: string }>("insert into public.products (org_id, name, pattern_id) values ($1, 'Calça', $2) returning id", [orgId, pat.id])
    ).rows[0]!;
    return { patternId: pat.id, productId: prod.id };
  });
  return { orgId, productId, patternId, dono, estilista, leitura, fora };
}

const gerar = (u: User, productId: string, version = 1, data: unknown = FICHA) =>
  as(db, u, async (q) => (await q.query<{ number: number }>("select number from public.create_tech_pack($1, $2, $3)", [productId, version, JSON.stringify(data)])).rows[0]!);

describe("tecidos e aviamentos", () => {
  it("estilista cadastra tecido, liga ao produto e lista aviamentos; todo membro lê", async () => {
    const c = await cenario();
    const fab = await as(db, c.estilista, async (q) =>
      (
        await q.query<{ id: string }>(
          "insert into public.fabrics (org_id, name, composition, width_mm, weight_gsm, price_cents, preset) values ($1, 'Sarja', '98% algodão', 1500, 280, 3990, 'jeans') returning id",
          [c.orgId],
        )
      ).rows[0]!,
    );
    await as(db, c.estilista, (q) => q.query("update public.products set fabric_id = $1 where id = $2", [fab.id, c.productId]));
    await as(db, c.estilista, (q) =>
      q.query("insert into public.product_trims (org_id, product_id, name, quantity, unit, unit_price_cents) values ($1, $2, 'Zíper 15 cm', 1, 'un', 250)", [
        c.orgId,
        c.productId,
      ]),
    );
    expect(await contar(db, c.leitura, "select 1 from public.fabrics where id = $1", [fab.id])).toBe(1);
    expect(await contar(db, c.leitura, "select 1 from public.product_trims where product_id = $1", [c.productId])).toBe(1);
    expect(await contar(db, c.fora, "select 1 from public.fabrics where id = $1", [fab.id])).toBe(0);
  });

  it("só-leitura não cadastra; tecido de outra organização não liga; unidade e valores travados", async () => {
    const a = await cenario();
    const b = await cenario();
    await expect(
      as(db, a.leitura, (q) => q.query("insert into public.fabrics (org_id, name) values ($1, 'Linho')", [a.orgId])),
    ).rejects.toThrow(/row-level security/);
    const fabB = await as(db, b.dono, async (q) => (await q.query<{ id: string }>("insert into public.fabrics (org_id, name) values ($1, 'Linho') returning id", [b.orgId])).rows[0]!);
    await expect(as(db, a.dono, (q) => q.query("update public.products set fabric_id = $1 where id = $2", [fabB.id, a.productId]))).rejects.toThrow(
      /foreign key/,
    );
    await expect(
      as(db, a.dono, (q) =>
        q.query("insert into public.product_trims (org_id, product_id, name, quantity, unit) values ($1, $2, 'Botão', 2, 'caixa')", [a.orgId, a.productId]),
      ),
    ).rejects.toThrow(/check/);
    await expect(
      as(db, a.dono, (q) => q.query("insert into public.fabrics (org_id, name, width_mm) values ($1, 'Estreito', 50)", [a.orgId])),
    ).rejects.toThrow(/check/);
  });

  it("biblioteca: presets novos, propriedades da Prova e foto do tecido; só quem edita grava, todo membro lê", async () => {
    const c = await cenario();
    const foto = "data:image/jpeg;base64,/9j/4AAQSkZJRg==";
    const fab = await as(db, c.estilista, async (q) =>
      (
        await q.query<{ id: string }>(
          "insert into public.fabrics (org_id, name, preset, stretch_pct, drape, thickness_mm, texture, texture_cm) values ($1, 'Viscose estampada', 'viscose', 6, 5, 0.4, $2, 20) returning id",
          [c.orgId, foto],
        )
      ).rows[0]!,
    );
    await as(db, c.dono, (q) => q.query("update public.fabrics set drape = 4, stretch_pct = 8 where id = $1", [fab.id]));
    const row = await as(db, c.leitura, async (q) =>
      (await q.query<{ drape: number; stretch_pct: string; texture: string }>("select drape, stretch_pct, texture from public.fabrics where id = $1", [fab.id])).rows[0]!,
    );
    expect([row.drape, Number(row.stretch_pct), row.texture]).toEqual([4, 8, foto]);
    const up = await as(db, c.leitura, (q) => q.query("update public.fabrics set drape = 1 where id = $1", [fab.id]));
    expect(up.affectedRows).toBe(0);

    const bad = (col: string, value: unknown) =>
      as(db, c.dono, (q) => q.query(`insert into public.fabrics (org_id, name, ${col}) values ($1, 'X', $2)`, [c.orgId, value]));
    await expect(bad("preset", "lycra")).rejects.toThrow(/check/);
    await expect(bad("drape", 6)).rejects.toThrow(/check/);
    await expect(bad("thickness_mm", 3)).rejects.toThrow(/check/);
    await expect(bad("stretch_pct", 0)).rejects.toThrow(/check/);
    await expect(bad("texture", "https://exemplo.com/foto.jpg")).rejects.toThrow(/check/);
    await expect(bad("texture", "data:image/jpeg;base64," + "A".repeat(200_000))).rejects.toThrow(/check/);
    await expect(bad("texture_cm", 0)).rejects.toThrow(/check/);
  });
});

describe("ficha técnica", () => {
  it("gera fichas numeradas 1, 2… apontando para a versão do molde; todo membro lê", async () => {
    const c = await cenario();
    expect((await gerar(c.estilista, c.productId)).number).toBe(1);
    expect((await gerar(c.dono, c.productId)).number).toBe(2);
    const row = await as(db, c.leitura, async (q) =>
      (await q.query<{ pattern_id: string; pattern_version: number }>("select pattern_id, pattern_version from public.tech_packs where product_id = $1 and number = 2", [c.productId])).rows[0]!,
    );
    expect(row).toEqual({ pattern_id: c.patternId, pattern_version: 1 });
  });

  it("recusa sem permissão, sem molde ligado, versão inexistente e dados fora do formato", async () => {
    const c = await cenario();
    await expect(gerar(c.leitura, c.productId)).rejects.toThrow(/sem permissão/);
    await expect(gerar(c.fora, c.productId)).rejects.toThrow(/sem permissão/);
    await expect(gerar(c.dono, c.productId, 9)).rejects.toThrow(/versão do molde não existe/);
    await expect(gerar(c.dono, c.productId, 1, { schema: 2 })).rejects.toThrow(/check/);
    await as(db, c.dono, (q) => q.query("update public.products set pattern_id = null where id = $1", [c.productId]));
    await expect(gerar(c.dono, c.productId)).rejects.toThrow(/Ligue um molde/);
  });

  it("ficha não muda nem se escreve direto", async () => {
    const c = await cenario();
    await gerar(c.dono, c.productId);
    await expect(as(db, c.dono, (q) => q.query("update public.tech_packs set data = '{}' where product_id = $1", [c.productId]))).rejects.toThrow(
      /permission denied/,
    );
    await expect(
      as(db, c.dono, (q) =>
        q.query("insert into public.tech_packs (org_id, product_id, number, data) values ($1, $2, 9, $3)", [c.orgId, c.productId, JSON.stringify(FICHA)]),
      ),
    ).rejects.toThrow(/permission denied/);
    await expect(db.query("update public.tech_packs set number = 99 where product_id = $1", [c.productId])).rejects.toThrow(/não podem ser alteradas/);
  });
});
