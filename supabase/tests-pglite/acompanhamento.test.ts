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
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]).toString("base64");
const TUDO = { status: true, prazos: true, cronograma: true, imagens: true, molde: true };

let seq = 0;
async function cenario() {
  const n = ++seq;
  const dono = await createUser(db, `tdono${n}@a.com`);
  const estilista = await createUser(db, `test${n}@a.com`);
  const leitura = await createUser(db, `tleit${n}@a.com`);
  const fora = await createUser(db, `tfora${n}@a.com`);
  const { id: orgId } = await novaOrg(db, dono, "Ateliê Rita");
  await entrarComo(db, dono, orgId, estilista, "estilista");
  await entrarComo(db, dono, orgId, leitura, "leitura");
  const ids = await as(db, dono, async (q) => {
    const c = await q.query<{ id: string }>("insert into public.collections (org_id, name, launch_on) values ($1, 'Verão', '2027-01-20') returning id", [orgId]);
    const pt = await q.query<{ id: string }>("insert into public.patterns (org_id, name) values ($1, 'Saia evasê') returning id", [orgId]);
    await q.query("select public.save_pattern_version($1, $2, 'editor', 0)", [pt.rows[0]!.id, JSON.stringify(DOC)]);
    await q.query("select * from public.create_approval($1, 1, '{}', $2, 14)", [
      pt.rows[0]!.id,
      JSON.stringify([
        { angle: "frente", data: JPEG },
        { angle: "costas", data: JPEG },
      ]),
    ]);
    const p = await q.query<{ id: string }>(
      "insert into public.products (org_id, collection_id, name, reference, status, pattern_id, due_on) values ($1, $2, 'Saia Lia', 'SA-01', 'prova', $3, '2026-12-10') returning id",
      [orgId, c.rows[0]!.id, pt.rows[0]!.id],
    );
    await q.query("insert into public.products (org_id, collection_id, name) values ($1, $2, 'Blusa')", [orgId, c.rows[0]!.id]);
    await q.query("insert into public.milestones (org_id, collection_id, title, due_on) values ($1, $2, 'Pilotagem', '2026-12-01')", [orgId, c.rows[0]!.id]);
    return { collectionId: c.rows[0]!.id, productId: p.rows[0]!.id };
  });
  return { dono, estilista, leitura, fora, orgId, ...ids };
}

const criar = (u: User | null, kind: string, target: string, show: object, days: number | null = 14) =>
  as(db, u, (q) => q.query<{ id: string; token: string }>("select * from public.create_tracking_link($1, $2, $3, $4)", [kind, target, JSON.stringify(show), days])).then(
    (r) => r.rows[0]!,
  );
const ler = (token: string) =>
  as(db, null, (q) => q.query<{ j: Record<string, unknown> | null }>("select public.public_tracking($1) as j", [token])).then((r) => r.rows[0]!.j);

describe("link de acompanhamento", () => {
  it("quem edita produtos cria; só-leitura e quem é de fora não", async () => {
    const c = await cenario();
    await criar(c.estilista, "produto", c.productId, TUDO);
    await expect(criar(c.leitura, "produto", c.productId, TUDO)).rejects.toThrow(/sem permissão/);
    await expect(criar(c.fora, "produto", c.productId, TUDO)).rejects.toThrow(/sem permissão/);
    await expect(criar(null, "produto", c.productId, TUDO)).rejects.toThrow(/permission denied|logado/);
  });

  it("recusa opções desconhecidas, nada marcado e validade fora de 1 a 90 dias", async () => {
    const c = await cenario();
    await expect(criar(c.dono, "produto", c.productId, { status: true, preco: true })).rejects.toThrow(/pelo menos uma/);
    await expect(criar(c.dono, "produto", c.productId, { status: false })).rejects.toThrow(/pelo menos uma/);
    await expect(criar(c.dono, "produto", c.productId, TUDO, 120)).rejects.toThrow(/1 a 90/);
  });

  it("a cliente vê só o que foi marcado", async () => {
    const c = await cenario();
    const so = await criar(c.dono, "produto", c.productId, { status: true });
    const j = (await ler(so.token))!;
    const p = (j.products as Record<string, unknown>[])[0]!;
    expect(j.title).toBe("Saia Lia");
    expect(j.org_name).toBe("Ateliê Rita");
    expect(p.status).toBe("prova");
    expect(p).not.toHaveProperty("due_on");
    expect(p).not.toHaveProperty("images");
    expect(p).not.toHaveProperty("pattern");
    expect(j).not.toHaveProperty("milestones");
    expect(j).not.toHaveProperty("launch_on");
  });

  it("com tudo marcado: prazo, molde, imagens da última aprovação e cronograma", async () => {
    const c = await cenario();
    const t = await criar(c.dono, "produto", c.productId, TUDO);
    const j = (await ler(t.token))!;
    const p = (j.products as Record<string, unknown>[])[0]!;
    expect(p.due_on).toBe("2026-12-10");
    expect(p.pattern).toEqual({ name: "Saia evasê", version: 1 });
    expect((p.images as unknown[]).length).toBe(2);
    expect(j.milestones).toEqual([{ title: "Pilotagem", due_on: "2026-12-01", done: false }]);
    expect(j.launch_on).toBe("2027-01-20");
  });

  it("link de coleção: todos os produtos, só a primeira imagem de cada", async () => {
    const c = await cenario();
    const t = await criar(c.dono, "colecao", c.collectionId, { status: true, imagens: true });
    const j = (await ler(t.token))!;
    const ps = j.products as Record<string, unknown>[];
    expect(j.title).toBe("Verão");
    expect(ps.map((p) => p.name)).toEqual(["Saia Lia", "Blusa"]);
    expect((ps[0]!.images as unknown[]).length).toBe(1);
  });

  it("cancelado, vencido ou token errado não mostram nada", async () => {
    const c = await cenario();
    const t = await criar(c.dono, "produto", c.productId, TUDO);
    await as(db, c.leitura, (q) => q.query("select public.revoke_tracking_link($1)", [t.id])).catch(() => null);
    expect(await ler(t.token)).not.toBeNull(); // só-leitura não cancela
    await as(db, c.estilista, (q) => q.query("select public.revoke_tracking_link($1)", [t.id]));
    expect(await ler(t.token)).toBeNull();
    const v = await criar(c.dono, "produto", c.productId, TUDO, 1);
    await db.query("update public.tracking_links set expires_at = now() - interval '1 minute' where id = $1", [v.id]);
    expect(await ler(v.token)).toBeNull();
    expect(await ler("00000000-0000-0000-0000-000000000000")).toBeNull();
  });

  it("abrir marca quando; membros veem; ninguém escreve direto", async () => {
    const c = await cenario();
    const t = await criar(c.dono, "produto", c.productId, TUDO, null);
    await as(db, null, (q) => q.query("select public.touch_tracking($1)", [t.token]));
    const { rows } = await as(db, c.leitura, (q) => q.query<{ open_count: number; aberto: boolean }>("select open_count, last_opened_at is not null as aberto from public.tracking_links where id = $1", [t.id]));
    expect(rows[0]).toEqual({ open_count: 1, aberto: true });
    expect(await contar(db, c.fora, "select 1 from public.tracking_links where id = $1", [t.id])).toBe(0);
    await expect(as(db, c.dono, (q) => q.query("update public.tracking_links set revoked_at = null where id = $1", [t.id]))).rejects.toThrow(/permission denied/);
    // E a criação ficou no registro de atividade.
    expect(await contar(db, c.dono, "select 1 from public.activity_log where org_id = $1 and action = 'acompanhamento_criado'", [c.orgId])).toBe(1);
  });
});

describe("resultados (ROI)", () => {
  it("dono e admin escrevem; membros leem; de fora não", async () => {
    const c = await cenario();
    await as(db, c.dono, (q) =>
      q.query("insert into public.roi_settings (org_id, pilots_per_month, fabric_per_pilot_mm, goal_monthly_cents) values ($1, 8, 1800, 500000)", [c.orgId]),
    );
    await as(db, c.dono, (q) => q.query("insert into public.roi_months (org_id, month, pilots_cut) values ($1, '2026-11-01', 5)", [c.orgId]));
    expect(await contar(db, c.leitura, "select 1 from public.roi_settings where org_id = $1", [c.orgId])).toBe(1);
    expect(await contar(db, c.fora, "select 1 from public.roi_months where org_id = $1", [c.orgId])).toBe(0);
    await expect(
      as(db, c.estilista, (q) => q.query("insert into public.roi_months (org_id, month, pilots_cut) values ($1, '2026-10-01', 3)", [c.orgId])),
    ).rejects.toThrow(/row-level security/);
    await as(db, c.estilista, (q) => q.query("update public.roi_settings set pilots_per_month = 1 where org_id = $1", [c.orgId]));
    const { rows } = await db.query<{ n: number }>("select pilots_per_month as n from public.roi_settings where org_id = $1", [c.orgId]);
    expect(rows[0]!.n).toBe(8);
  });

  it("mês sempre no dia 1", async () => {
    const c = await cenario();
    await expect(as(db, c.dono, (q) => q.query("insert into public.roi_months (org_id, month, pilots_cut) values ($1, '2026-11-15', 5)", [c.orgId]))).rejects.toThrow(
      /check/,
    );
  });
});
