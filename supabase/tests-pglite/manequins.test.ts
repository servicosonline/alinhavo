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

let seq = 0;
async function equipe() {
  const n = ++seq;
  const dono = await createUser(db, `mdono${n}@a.com`);
  const modelista = await createUser(db, `mmod${n}@a.com`);
  const estilista = await createUser(db, `mest${n}@a.com`);
  const leitura = await createUser(db, `mleit${n}@a.com`);
  const fora = await createUser(db, `mfora${n}@a.com`);
  const { id: orgId } = await novaOrg(db, dono);
  await entrarComo(db, dono, orgId, modelista, "modelista");
  await entrarComo(db, dono, orgId, estilista, "estilista");
  await entrarComo(db, dono, orgId, leitura, "leitura");
  return { dono, modelista, estilista, leitura, fora, orgId };
}

const MEDIDAS = JSON.stringify({ busto: 900, cintura: 720, quadril: 960 });
const salvar = (user: User, orgId: string, name: string, conditions = "{}") =>
  as(db, user, (q) =>
    q.query<{ id: string }>("insert into public.body_presets (org_id, name, measurements, conditions) values ($1, $2, $3, $4) returning id", [
      orgId,
      name,
      MEDIDAS,
      conditions,
    ]),
  ).then((r) => r.rows[0]!.id);

describe("manequins salvos", () => {
  it("quem edita moldes salva; estilista, leitura e quem é de fora não", async () => {
    const t = await equipe();
    await salvar(t.dono, t.orgId, "Maria 42");
    await salvar(t.modelista, t.orgId, "Gestante 38", JSON.stringify({ belly: 1100, heel: 80 }));
    for (const u of [t.estilista, t.leitura, t.fora]) {
      await expect(salvar(u, t.orgId, `X ${u.email}`)).rejects.toThrow(/row-level security/);
    }
  });

  it("todo membro lê os da organização; quem é de fora não vê nada", async () => {
    const t = await equipe();
    await salvar(t.dono, t.orgId, "Ana");
    for (const u of [t.dono, t.modelista, t.estilista, t.leitura]) {
      expect(await contar(db, u, "select 1 from public.body_presets")).toBe(1);
    }
    expect(await contar(db, t.fora, "select 1 from public.body_presets")).toBe(0);
  });

  it("atualiza medidas e nome, apaga; quem só lê não muda nada", async () => {
    const t = await equipe();
    const id = await salvar(t.dono, t.orgId, "Bia");
    await as(db, t.leitura, (q) => q.query("update public.body_presets set name = 'X' where id = $1", [id]));
    await as(db, t.leitura, (q) => q.query("delete from public.body_presets where id = $1", [id]));
    await as(db, t.modelista, (q) =>
      q.query("update public.body_presets set name = 'Bia 40', measurements = $2 where id = $1", [id, JSON.stringify({ busto: 880 })]),
    );
    const { rows } = await as(db, t.dono, (q) =>
      q.query<{ name: string; measurements: Record<string, number> }>("select name, measurements from public.body_presets where id = $1", [id]),
    );
    expect(rows).toEqual([{ name: "Bia 40", measurements: { busto: 880 } }]);
    await as(db, t.modelista, (q) => q.query("delete from public.body_presets where id = $1", [id]));
    expect(await contar(db, t.dono, "select 1 from public.body_presets")).toBe(0);
  });

  it("não troca de organização nem de autor", async () => {
    const t = await equipe();
    const outra = await novaOrg(db, t.dono, "Outra");
    const id = await salvar(t.dono, t.orgId, "Cris");
    await expect(as(db, t.dono, (q) => q.query("update public.body_presets set org_id = $2 where id = $1", [id, outra.id]))).rejects.toThrow(
      /permission denied/,
    );
    await expect(
      as(db, t.dono, (q) => q.query("update public.body_presets set created_by = $2 where id = $1", [id, t.modelista.id])),
    ).rejects.toThrow(/permission denied/);
  });

  it("nome único na organização, de 1 a 60 letras, e formato de objeto", async () => {
    const t = await equipe();
    await salvar(t.dono, t.orgId, "Duda");
    await expect(salvar(t.dono, t.orgId, "Duda")).rejects.toThrow(/duplicate key/);
    await expect(salvar(t.dono, t.orgId, "  ")).rejects.toThrow(/check constraint/);
    await expect(salvar(t.dono, t.orgId, "x".repeat(61))).rejects.toThrow(/check constraint/);
    await expect(
      as(db, t.dono, (q) => q.query("insert into public.body_presets (org_id, name, measurements) values ($1, 'L', '[1]')", [t.orgId])),
    ).rejects.toThrow(/check constraint/);
    // Outra organização pode usar o mesmo nome.
    const outra = await novaOrg(db, t.dono, "Outra 2");
    await salvar(t.dono, outra.id, "Duda");
  });

  it("até 100 por organização", async () => {
    const t = await equipe();
    await as(db, t.dono, (q) =>
      q.query("insert into public.body_presets (org_id, name, measurements) select $1, 'M' || g, '{}' from generate_series(1, 100) g", [t.orgId]),
    );
    await expect(salvar(t.dono, t.orgId, "Mais um")).rejects.toThrow(/Limite de 100 manequins/);
  });
});
