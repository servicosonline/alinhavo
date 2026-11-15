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
  const dono = await createUser(db, `cdono${n}@a.com`);
  const admin = await createUser(db, `cadmin${n}@a.com`);
  const estilista = await createUser(db, `cest${n}@a.com`);
  const leitura = await createUser(db, `cleit${n}@a.com`);
  const fora = await createUser(db, `cfora${n}@a.com`);
  const { id: orgId } = await novaOrg(db, dono);
  await entrarComo(db, dono, orgId, admin, "admin");
  await entrarComo(db, dono, orgId, estilista, "estilista");
  await entrarComo(db, dono, orgId, leitura, "leitura");
  return { dono, admin, estilista, leitura, fora, orgId };
}

const enviar = (user: User | null, name: string) =>
  as(db, user, (q) => q.query("insert into storage.objects (bucket_id, name, metadata) values ('org-capas', $1, '{}')", [name]));

describe("capa da organização", () => {
  it("bucket público de imagem, até 300 KB", async () => {
    const { rows } = await db.query("select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'org-capas'");
    expect(rows[0]).toEqual({ public: true, file_size_limit: 307200, allowed_mime_types: ["image/webp", "image/jpeg", "image/png"] });
  });

  it("só dono e admin enviam na pasta da organização", async () => {
    const { dono, admin, estilista, leitura, fora, orgId } = await equipe();
    await enviar(dono, `${orgId}/capa1.webp`);
    await enviar(admin, `${orgId}/capa2.webp`);
    for (const u of [estilista, leitura, fora, null]) {
      await expect(enviar(u, `${orgId}/capa3.webp`)).rejects.toThrow(/row-level security|permission denied/);
    }
    await expect(enviar(dono, `${orgId}/../x.webp`)).rejects.toThrow(/row-level security/);
    await expect(enviar(dono, `${orgId}/capa.gif`)).rejects.toThrow(/row-level security/);
  });

  it("orgs.thumbnail_path: só dono e admin trocam, e só para a pasta da própria organização", async () => {
    const { dono, admin, estilista, orgId } = await equipe();
    const { orgId: outra } = await equipe();
    await as(db, admin, (q) => q.query("update public.orgs set thumbnail_path = $1 where id = $2", [`${orgId}/capa.webp`, orgId]));
    await expect(
      as(db, dono, (q) => q.query("update public.orgs set thumbnail_path = $1 where id = $2", [`${outra}/capa.webp`, orgId])),
    ).rejects.toThrow(/orgs_thumbnail_own/);
    // Estilista: a RLS de orgs não deixa atualizar (nada muda).
    await as(db, estilista, (q) => q.query("update public.orgs set thumbnail_path = null where id = $1", [orgId]));
    const { rows } = await db.query<{ thumbnail_path: string }>("select thumbnail_path from public.orgs where id = $1", [orgId]);
    expect(rows[0]!.thumbnail_path).toBe(`${orgId}/capa.webp`);
  });
});

describe("prazo de entrega do produto", () => {
  it("quem edita produtos define; todo membro lê; só-leitura não muda", async () => {
    const { dono, estilista, leitura, fora, orgId } = await equipe();
    const productId = await as(db, estilista, async (q) => {
      const c = await q.query<{ id: string }>("insert into public.collections (org_id, name) values ($1, 'Verão') returning id", [orgId]);
      const p = await q.query<{ id: string }>(
        "insert into public.products (org_id, collection_id, name, due_on) values ($1, $2, 'Vestido', '2026-12-20') returning id",
        [orgId, c.rows[0]!.id],
      );
      return p.rows[0]!.id;
    });
    await as(db, dono, (q) => q.query("update public.products set due_on = '2027-01-10' where id = $1", [productId]));
    await as(db, leitura, (q) => q.query("update public.products set due_on = '2030-01-01' where id = $1", [productId]));
    const sql = "select due_on::text as d from public.products where id = $1";
    const { rows } = await as(db, leitura, (q) => q.query<{ d: string }>(sql, [productId]));
    expect(rows[0]!.d).toBe("2027-01-10");
    expect(await contar(db, fora, sql, [productId])).toBe(0);
  });
});
