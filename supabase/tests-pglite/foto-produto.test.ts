import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { as, createDb, createUser, type User } from "./db";
import { entrarComo, novaOrg } from "./helpers";

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
  const dono = await createUser(db, `pdono${n}@p.com`);
  const modelista = await createUser(db, `pmod${n}@p.com`);
  const estilista = await createUser(db, `pest${n}@p.com`);
  const leitura = await createUser(db, `pleit${n}@p.com`);
  const fora = await createUser(db, `pfora${n}@p.com`);
  const { id: orgId } = await novaOrg(db, dono);
  const { id: outraOrg } = await novaOrg(db, fora, "Outra");
  await entrarComo(db, dono, orgId, modelista, "modelista");
  await entrarComo(db, dono, orgId, estilista, "estilista");
  await entrarComo(db, dono, orgId, leitura, "leitura");
  const novo = (u: User, org: string, name: string) =>
    as(db, u, async (q) => (await q.query<{ id: string }>("insert into public.products (org_id, name) values ($1, $2) returning id", [org, name])).rows[0]!.id);
  const productId = await novo(dono, orgId, "Saia");
  const outroProduto = await novo(fora, outraOrg, "Calça");
  return { dono, modelista, estilista, leitura, fora, orgId, outraOrg, productId, outroProduto };
}

const enviar = (u: User | null, name: string) =>
  as(db, u, (q) => q.query("insert into storage.objects (bucket_id, name, metadata) values ('produtos', $1, '{}')", [name]));

const ver = (u: User, name: string) =>
  as(db, u, async (q) => (await q.query("select 1 from storage.objects where bucket_id = 'produtos' and name = $1", [name])).rows.length);

const apagar = (u: User, name: string) =>
  as(db, u, async (q) => (await q.query("delete from storage.objects where bucket_id = 'produtos' and name = $1 returning 1", [name])).rows.length);

describe("foto do produto", () => {
  it("bucket privado de imagem, até 300 KB", async () => {
    const { rows } = await db.query("select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'produtos'");
    expect(rows[0]).toEqual({ public: false, file_size_limit: 307200, allowed_mime_types: ["image/webp", "image/jpeg", "image/png"] });
  });

  it("quem edita produtos envia e apaga na pasta do produto; leitura e quem é de fora, não", async () => {
    const { dono, modelista, estilista, leitura, fora, orgId, productId } = await equipe();
    await enviar(dono, `${orgId}/${productId}/a1.webp`);
    await enviar(modelista, `${orgId}/${productId}/a2.jpg`);
    await enviar(estilista, `${orgId}/${productId}/a3.png`);
    for (const u of [leitura, fora, null]) {
      await expect(enviar(u, `${orgId}/${productId}/b.webp`)).rejects.toThrow(/row-level security|permission denied/);
    }
    expect(await apagar(leitura, `${orgId}/${productId}/a1.webp`)).toBe(0);
    expect(await apagar(fora, `${orgId}/${productId}/a1.webp`)).toBe(0);
    expect(await apagar(estilista, `${orgId}/${productId}/a1.webp`)).toBe(1);
  });

  it("o caminho precisa ser de um produto da própria organização, com nome e extensão válidos", async () => {
    const { dono, orgId, outraOrg, productId, outroProduto } = await equipe();
    await expect(enviar(dono, `${orgId}/${outroProduto}/x.webp`)).rejects.toThrow(/row-level security/);
    await expect(enviar(dono, `${outraOrg}/${outroProduto}/x.webp`)).rejects.toThrow(/row-level security/);
    await expect(enviar(dono, `${orgId}/${productId}/../x.webp`)).rejects.toThrow(/row-level security/);
    await expect(enviar(dono, `${orgId}/${productId}/x.gif`)).rejects.toThrow(/row-level security/);
    await expect(enviar(dono, `${orgId}/x.webp`)).rejects.toThrow(/row-level security/);
  });

  it("todo membro vê a foto; quem é de fora, não", async () => {
    const { dono, leitura, fora, orgId, productId } = await equipe();
    const name = `${orgId}/${productId}/v.webp`;
    await enviar(dono, name);
    expect(await ver(leitura, name)).toBe(1);
    expect(await ver(fora, name)).toBe(0);
  });

  it("products.photo_path: quem edita troca, só para a pasta do próprio produto; leitura não muda", async () => {
    const { dono, estilista, leitura, orgId, productId, outroProduto } = await equipe();
    const { productId: irmao } = await equipe();
    await as(db, estilista, (q) => q.query("update public.products set photo_path = $1 where id = $2", [`${orgId}/${productId}/f.webp`, productId]));
    for (const bad of [`${orgId}/${outroProduto}/f.webp`, `${orgId}/${irmao}/f.webp`, `outra/${productId}/f.webp`]) {
      await expect(
        as(db, dono, (q) => q.query("update public.products set photo_path = $1 where id = $2", [bad, productId])),
      ).rejects.toThrow(/products_photo_own/);
    }
    await as(db, leitura, (q) => q.query("update public.products set photo_path = null where id = $1", [productId]));
    const { rows } = await db.query<{ photo_path: string }>("select photo_path from public.products where id = $1", [productId]);
    expect(rows[0]!.photo_path).toBe(`${orgId}/${productId}/f.webp`);
  });
});
