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

const DOC = { schema: 5, unit: "mm", sizes: ["M"], baseSize: "M", pieces: [], seams: [] };

type Cenario = { orgId: string; outraOrg: string; productId: string; outroProduto: string; dono: User; admin: User; modelista: User; fora: User };

let seq = 0;
async function cenario(): Promise<Cenario> {
  const n = ++seq;
  const dono = await createUser(db, `adono${n}@a.com`);
  const admin = await createUser(db, `aadmin${n}@a.com`);
  const modelista = await createUser(db, `amodelista${n}@a.com`);
  const fora = await createUser(db, `afora${n}@a.com`);
  const { id: orgId } = await novaOrg(db, dono);
  const { id: outraOrg } = await novaOrg(db, fora, "Outra");
  await entrarComo(db, dono, orgId, admin, "admin");
  await entrarComo(db, dono, orgId, modelista, "modelista");
  const productId = await as(db, dono, async (q) => {
    const col = (await q.query<{ id: string }>("insert into public.collections (org_id, name) values ($1, 'Verão') returning id", [orgId])).rows[0]!
      .id;
    const pat = (await q.query<{ id: string }>("insert into public.patterns (org_id, name) values ($1, 'Saia') returning id", [orgId])).rows[0]!.id;
    await q.query("select public.save_pattern_version($1, $2, 'editor', 0)", [pat, JSON.stringify(DOC)]);
    const fab = (
      await q.query<{ id: string }>(
        "insert into public.fabrics (org_id, name, width_mm, price_cents) values ($1, 'Linho', 1400, 4590) returning id",
        [orgId],
      )
    ).rows[0]!.id;
    const prod = (
      await q.query<{ id: string }>(
        "insert into public.products (org_id, name, reference, collection_id, pattern_id, fabric_id) values ($1, 'Saia midi', 'SM-1', $2, $3, $4) returning id",
        [orgId, col, pat, fab],
      )
    ).rows[0]!.id;
    await q.query("insert into public.product_trims (org_id, product_id, name, quantity, unit) values ($1, $2, 'Zíper', 1, 'un')", [orgId, prod]);
    await q.query("select public.create_tech_pack($1, 1, $2)", [prod, JSON.stringify({ schema: 1, product: { name: "Saia midi" } })]);
    return prod;
  });
  const outroProduto = await as(
    db,
    fora,
    async (q) =>
      (await q.query<{ id: string }>("insert into public.products (org_id, name) values ($1, 'Outra calça') returning id", [outraOrg])).rows[0]!.id,
  );
  return { orgId, outraOrg, productId, outroProduto, dono, admin, modelista, fora };
}

const criarChave = (u: User, orgId: string, name = "ERP") =>
  as(
    db,
    u,
    async (q) =>
      (await q.query<{ id: string; secret: string; prefix: string }>("select * from public.create_api_key($1, $2)", [orgId, name])).rows[0]!,
  );

/** Chama uma função da API como a rota faz: sem login, com a chave publicável (papel anon). */
async function api<T>(fn: string, args: unknown[]): Promise<T> {
  const params = args.map((_, i) => `$${i + 1}`).join(", ");
  return as(db, null, async (q) => (await q.query<{ r: T }>(`select public.${fn}(${params}) as r`, args)).rows[0]!.r);
}

describe("chaves de API", () => {
  it("dono e admin criam; o segredo sai uma vez e o banco guarda só o hash", async () => {
    const c = await cenario();
    const k = await criarChave(c.admin, c.orgId);
    expect(k.secret).toMatch(/^alv_[0-9a-f]{64}$/);
    expect(k.prefix).toBe(k.secret.slice(0, 12));
    const { rows } = await db.query<{ key_hash: string }>("select key_hash from public.api_keys where id = $1", [k.id]);
    expect(rows[0]!.key_hash).not.toContain(k.secret.slice(4));
    expect(rows[0]!.key_hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("modelista e quem é de fora não criam nem veem as chaves; ninguém lê o hash", async () => {
    const c = await cenario();
    const k = await criarChave(c.dono, c.orgId);
    await expect(criarChave(c.modelista, c.orgId)).rejects.toThrow(/donos e admins/);
    await expect(criarChave(c.fora, c.orgId)).rejects.toThrow(/donos e admins/);
    expect(await contar(db, c.modelista, "select 1 from public.api_keys where id = $1", [k.id])).toBe(0);
    expect(await contar(db, c.admin, "select id, name, prefix from public.api_keys where id = $1", [k.id])).toBe(1);
    await expect(as(db, c.dono, (q) => q.query("select key_hash from public.api_keys"))).rejects.toThrow(/permission denied/);
    await expect(as(db, c.dono, (q) => q.query("update public.api_keys set name = 'x'"))).rejects.toThrow(/permission denied/);
  });

  it("nome obrigatório e no máximo 20 ativas", async () => {
    const c = await cenario();
    await expect(criarChave(c.dono, c.orgId, "  ")).rejects.toThrow(/nome/);
    for (let i = 0; i < 20; i++) await criarChave(c.dono, c.orgId, `k${i}`);
    await expect(criarChave(c.dono, c.orgId, "mais uma")).rejects.toThrow(/20 chaves ativas/);
  });
});

describe("leitura pela API", () => {
  it("a chave lê os produtos, a ficha, os riscos e as coleções da sua organização", async () => {
    const c = await cenario();
    const { secret } = await criarChave(c.dono, c.orgId);
    const page = await api<{
      itens: { id: string; nome: string; tecido: { preco_centavos_metro: number }; aviamentos: unknown[] }[];
      proximo: string | null;
    }>("api_products", [secret, 50, null]);
    expect(page.itens.map((p) => p.nome)).toEqual(["Saia midi"]);
    expect(page.itens[0]!.tecido.preco_centavos_metro).toBe(4590);
    expect(page.itens[0]!.aviamentos).toHaveLength(1);
    expect(page.proximo).toBeNull();
    expect(await api<{ referencia: string }>("api_product", [secret, c.productId])).toMatchObject({ referencia: "SM-1", colecao: { nome: "Verão" } });
    expect(await api<{ numero: number }>("api_tech_pack", [secret, c.productId])).toMatchObject({ numero: 1, versao_molde: 1 });
    expect(await api<unknown[]>("api_markers", [secret, c.productId])).toEqual([]);
    expect(await api<{ nome: string }[]>("api_collections", [secret])).toEqual([expect.objectContaining({ nome: "Verão" })]);
  });

  it("não enxerga outra organização", async () => {
    const c = await cenario();
    const { secret } = await criarChave(c.dono, c.orgId);
    expect(await api("api_product", [secret, c.outroProduto])).toBeNull();
    expect(await api("api_tech_pack", [secret, c.outroProduto])).toBeNull();
    expect(await api("api_markers", [secret, c.outroProduto])).toBeNull();
    const page = await api<{ itens: { id: string }[] }>("api_products", [secret, 100, null]);
    expect(page.itens.map((p) => p.id)).not.toContain(c.outroProduto);
  });

  it("chave errada, de formato errado ou revogada: o mesmo erro", async () => {
    const c = await cenario();
    const k = await criarChave(c.dono, c.orgId);
    const outra = `alv_${"0".repeat(64)}`;
    for (const key of [outra, "abc", null]) {
      await expect(api("api_collections", [key])).rejects.toThrow(/inválida ou revogada/);
    }
    await as(db, c.admin, (q) => q.query("select public.revoke_api_key($1)", [k.id]));
    await expect(api("api_collections", [k.secret])).rejects.toThrow(/inválida ou revogada/);
    await expect(as(db, c.modelista, (q) => q.query("select public.revoke_api_key($1)", [k.id]))).rejects.toThrow(/sem permissão/);
  });

  it("páginas pelo cursor, de até 100", async () => {
    const c = await cenario();
    const { secret } = await criarChave(c.dono, c.orgId);
    await as(db, c.dono, (q) => q.query("insert into public.products (org_id, name) select $1, 'P' || g from generate_series(1, 4) g", [c.orgId]));
    const first = await api<{ itens: { id: string }[]; proximo: string | null }>("api_products", [secret, 3, null]);
    expect(first.itens).toHaveLength(3);
    expect(first.proximo).toBe(first.itens[2]!.id);
    const second = await api<{ itens: { id: string }[]; proximo: string | null }>("api_products", [secret, 3, first.proximo]);
    expect(second.itens).toHaveLength(2);
    expect(second.proximo).toBeNull();
    expect(new Set([...first.itens, ...second.itens].map((p) => p.id)).size).toBe(5);
  });

  it("para no limite de 60 pedidos por minuto e marca o último uso", async () => {
    const c = await cenario();
    const k = await criarChave(c.dono, c.orgId);
    for (let i = 0; i < 60; i++) await api("api_collections", [k.secret]);
    await expect(api("api_collections", [k.secret])).rejects.toThrow(/60 pedidos por minuto/);
    const { rows } = await db.query<{ last_used_at: string | null }>("select last_used_at from public.api_keys where id = $1", [k.id]);
    expect(rows[0]!.last_used_at).not.toBeNull();
    // Outra chave da mesma organização tem o seu próprio limite.
    const k2 = await criarChave(c.dono, c.orgId, "Outra");
    expect(await api("api_collections", [k2.secret])).toHaveLength(1);
  });
});
