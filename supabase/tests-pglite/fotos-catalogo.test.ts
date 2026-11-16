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

type Cenario = { orgId: string; productId: string; outroProduto: string; dono: User; modelista: User; estilista: User; leitura: User; fora: User };

let seq = 0;
async function cenario(): Promise<Cenario> {
  const n = ++seq;
  const dono = await createUser(db, `fdono${n}@f.com`);
  const modelista = await createUser(db, `fmodelista${n}@f.com`);
  const estilista = await createUser(db, `festilista${n}@f.com`);
  const leitura = await createUser(db, `fleitura${n}@f.com`);
  const fora = await createUser(db, `ffora${n}@f.com`);
  const { id: orgId } = await novaOrg(db, dono);
  const { id: outraOrg } = await novaOrg(db, fora, "Outra");
  await entrarComo(db, dono, orgId, modelista, "modelista");
  await entrarComo(db, dono, orgId, estilista, "estilista");
  await entrarComo(db, dono, orgId, leitura, "leitura");
  const productId = await as(
    db,
    dono,
    async (q) => (await q.query<{ id: string }>("insert into public.products (org_id, name) values ($1, 'Saia') returning id", [orgId])).rows[0]!.id,
  );
  const outroProduto = await as(
    db,
    fora,
    async (q) =>
      (await q.query<{ id: string }>("insert into public.products (org_id, name) values ($1, 'Calça') returning id", [outraOrg])).rows[0]!.id,
  );
  return { orgId, productId, outroProduto, dono, modelista, estilista, leitura, fora };
}

const reservar = (u: User, productId: string, kind = "foto_catalogo") =>
  as(db, u, async (q) => (await q.query<{ id: string }>("select public.reserve_ai_generation($1, $2) as id", [productId, kind])).rows[0]!.id);

const encerrar = (u: User, id: string, ok: boolean) =>
  as(db, u, (q) => q.query("select public.finish_ai_generation($1, $2, 'gpt-image-teste', 10, 20)", [id, ok]));

/** Envia um "arquivo" como o Storage faria: insert em storage.objects com a sessão de quem envia. */
const enviar = (u: User | null, name: string) =>
  as(db, u, (q) => q.query("insert into storage.objects (bucket_id, name, metadata) values ('catalogo', $1, '{}')", [name]));

const registrar = (u: User, genId: string, ext = "jpg", settings: unknown = { cenario: "estudio" }) =>
  as(
    db,
    u,
    async (q) =>
      (
        await q.query<{ id: string; path: string }>("select * from public.create_catalog_photo($1, $2, $3, 'gpt-image-teste')", [
          genId,
          ext,
          JSON.stringify(settings),
        ])
      ).rows[0]!,
  );

const caminho = (c: Cenario, genId: string, ext = "jpg") => `${c.orgId}/${c.productId}/${genId}.${ext}`;

/** Fluxo inteiro, como a Server Action: reservar, enviar, registrar, encerrar. */
async function gerar(c: Cenario, u: User) {
  const id = await reservar(u, c.productId);
  await enviar(u, caminho(c, id));
  const photo = await registrar(u, id);
  await encerrar(u, id, true);
  return photo;
}

describe("fotos de catálogo", () => {
  it("o bucket é privado e só aceita JPEG, PNG e WebP de até 5 MB", async () => {
    const { rows } = await db.query("select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'catalogo'");
    expect(rows[0]).toEqual({ public: false, file_size_limit: 5242880, allowed_mime_types: ["image/jpeg", "image/png", "image/webp"] });
  });

  it("quem edita produtos gera; o id da foto é o da geração; membros veem a foto e o arquivo", async () => {
    const c = await cenario();
    const photo = await gerar(c, c.estilista);
    expect(photo.path).toBe(caminho(c, photo.id));
    for (const u of [c.leitura, c.modelista, c.dono]) {
      expect(await contar(db, u, "select 1 from public.catalog_photos where id = $1", [photo.id])).toBe(1);
      expect(await contar(db, u, "select 1 from storage.objects where bucket_id = 'catalogo' and name = $1", [photo.path])).toBe(1);
    }
    expect(await contar(db, c.fora, "select 1 from public.catalog_photos where id = $1", [photo.id])).toBe(0);
    expect(await contar(db, c.fora, "select 1 from storage.objects where bucket_id = 'catalogo' and name = $1", [photo.path])).toBe(0);
    expect(await contar(db, null, "select 1 from storage.objects where bucket_id = 'catalogo' and name = $1", [photo.path])).toBe(0);
  });

  it("só-leitura e quem é de fora não reservam", async () => {
    const c = await cenario();
    await expect(reservar(c.leitura, c.productId)).rejects.toThrow(/sem permissão/);
    await expect(reservar(c.fora, c.productId)).rejects.toThrow(/sem permissão/);
    await expect(reservar(c.dono, c.productId, "video")).rejects.toThrow(/desconhecido/);
  });

  it("o arquivo só entra no caminho da geração reservada, por quem reservou", async () => {
    const c = await cenario();
    const id = await reservar(c.modelista, c.productId);
    const rls = /row-level security|permission denied/;
    await expect(enviar(c.estilista, caminho(c, id))).rejects.toThrow(rls); // outra pessoa, mesmo podendo editar
    await expect(enviar(c.leitura, caminho(c, id))).rejects.toThrow(rls);
    await expect(enviar(null, caminho(c, id))).rejects.toThrow(rls);
    await expect(enviar(c.modelista, `${c.orgId}/${c.outroProduto}/${id}.jpg`)).rejects.toThrow(rls); // produto errado
    await expect(enviar(c.modelista, `${c.orgId}/${c.productId}/${id}.gif`)).rejects.toThrow(rls);
    await expect(enviar(c.modelista, `${c.orgId}/${c.productId}/outro/${id}.jpg`)).rejects.toThrow(rls);
    const texto = await reservar(c.modelista, c.productId, "textos_produto");
    await expect(enviar(c.modelista, caminho(c, texto))).rejects.toThrow(rls); // geração de texto
    await enviar(c.modelista, caminho(c, id));
    await encerrar(c.modelista, id, true);
    await expect(enviar(c.modelista, caminho(c, id, "png"))).rejects.toThrow(rls); // já encerrada
  });

  it("registrar confere a geração, o formato e se o arquivo existe; ninguém insere direto", async () => {
    const c = await cenario();
    const id = await reservar(c.modelista, c.productId);
    await expect(registrar(c.modelista, id)).rejects.toThrow(/não foi enviada/);
    await enviar(c.modelista, caminho(c, id));
    await expect(registrar(c.estilista, id)).rejects.toThrow(/sem permissão/);
    await expect(registrar(c.modelista, id, "gif")).rejects.toThrow(/Formato/);
    await expect(
      as(db, c.modelista, (q) =>
        q.query("insert into public.catalog_photos (id, org_id, product_id, path) values ($1, $2, $3, 'x')", [id, c.orgId, c.productId]),
      ),
    ).rejects.toThrow(/permission denied/);
    const photo = await registrar(c.modelista, id);
    await encerrar(c.modelista, id, true);
    await expect(registrar(c.modelista, id)).rejects.toThrow(/encerrada/);
    await expect(as(db, c.dono, (q) => q.query("update public.catalog_photos set path = 'x' where id = $1", [photo.id]))).rejects.toThrow(
      /permission denied/,
    );
  });

  it("quem edita produtos apaga a foto e o arquivo; só-leitura não", async () => {
    const c = await cenario();
    const photo = await gerar(c, c.modelista);
    await as(db, c.leitura, (q) => q.query("delete from public.catalog_photos where id = $1", [photo.id]));
    await as(db, c.leitura, (q) => q.query("delete from storage.objects where bucket_id = 'catalogo' and name = $1", [photo.path]));
    expect(await contar(db, c.dono, "select 1 from public.catalog_photos where id = $1", [photo.id])).toBe(1);
    expect(await contar(db, c.dono, "select 1 from storage.objects where name = $1", [photo.path])).toBe(1);
    await as(db, c.estilista, (q) => q.query("delete from storage.objects where bucket_id = 'catalogo' and name = $1", [photo.path]));
    await as(db, c.estilista, (q) => q.query("delete from public.catalog_photos where id = $1", [photo.id]));
    expect(await contar(db, c.dono, "select 1 from public.catalog_photos where id = $1", [photo.id])).toBe(0);
    expect(await contar(db, c.dono, "select 1 from storage.objects where name = $1", [photo.path])).toBe(0);
  });

  it("limite próprio de 10 fotos por mês, separado do de textos; falha não conta", async () => {
    const c = await cenario();
    const falhou = await reservar(c.dono, c.productId);
    await encerrar(c.dono, falhou, false);
    await db.query(
      "insert into public.ai_generations (org_id, product_id, kind, status, created_by) select $1, $2, 'foto_catalogo', 'pronta', $3 from generate_series(1, 10)",
      [c.orgId, c.productId, c.dono.id],
    );
    await expect(reservar(c.dono, c.productId)).rejects.toThrow(/10 fotos de catálogo/);
    // Textos seguem livres, e cada tipo é contado à parte.
    await reservar(c.dono, c.productId, "textos_produto");
    const conta = (kind?: string) =>
      as(db, c.leitura, async (q) =>
        kind
          ? (await q.query<{ n: number }>("select public.ai_generations_this_month($1, $2) as n", [c.orgId, kind])).rows[0]!.n
          : (await q.query<{ n: number }>("select public.ai_generations_this_month($1) as n", [c.orgId])).rows[0]!.n,
      );
    expect(await conta("foto_catalogo")).toBe(10);
    expect(await conta()).toBe(1);
  });
});
