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

let seq = 0;
async function equipe() {
  const n = ++seq;
  const dono = await createUser(db, `adono${n}@a.com`);
  const admin = await createUser(db, `aadmin${n}@a.com`);
  const modelista = await createUser(db, `amod${n}@a.com`);
  const fora = await createUser(db, `afora${n}@a.com`);
  const { id: orgId } = await novaOrg(db, dono);
  await entrarComo(db, dono, orgId, admin, "admin");
  await entrarComo(db, dono, orgId, modelista, "modelista");
  return { dono, admin, modelista, fora, orgId };
}

const acoes = (user: User, orgId: string) =>
  as(db, user, (q) => q.query<{ action: string; user_id: string | null }>("select action, user_id from public.activity_log where org_id = $1 order by id", [orgId])).then(
    (r) => r.rows,
  );

describe("registro de atividade", () => {
  it("o banco registra as ações de negócio com quem fez", async () => {
    const { dono, modelista, orgId } = await equipe();
    const token = await as(db, modelista, async (q) => {
      const p = await q.query<{ id: string }>("insert into public.patterns (org_id, name) values ($1, 'Saia') returning id", [orgId]);
      await q.query("select public.save_pattern_version($1, $2, 'editor', 0)", [p.rows[0]!.id, JSON.stringify(DOC)]);
      const a = await q.query<{ token: string }>("select token from public.create_approval($1, 1, '{}', $2, 14)", [
        p.rows[0]!.id,
        JSON.stringify([{ angle: "frente", data: JPEG }]),
      ]);
      return a.rows[0]!.token;
    });
    // A cliente decide pelo link, sem conta.
    await as(db, null, (q) => q.query("select public.decide_approval($1, 'aprovado', 'Cliente', null)", [token]));

    const rows = await acoes(dono, orgId);
    const nomes = rows.map((r) => r.action);
    expect(nomes).toEqual(
      expect.arrayContaining(["membro_entrou", "convite_criado", "molde_criado", "versao_salva", "aprovacao_pedida", "aprovacao_decidida"]),
    );
    expect(rows.find((r) => r.action === "molde_criado")!.user_id).toBe(modelista.id);
    expect(rows.find((r) => r.action === "aprovacao_decidida")!.user_id).toBeNull();
  });

  it("produto: criado e mudança de status", async () => {
    const { dono, orgId } = await equipe();
    await as(db, dono, async (q) => {
      const c = await q.query<{ id: string }>("insert into public.collections (org_id, name) values ($1, 'Verão') returning id", [orgId]);
      const p = await q.query<{ id: string }>("insert into public.products (org_id, collection_id, name) values ($1, $2, 'Vestido') returning id", [
        orgId,
        c.rows[0]!.id,
      ]);
      await q.query("update public.products set status = 'modelagem' where id = $1", [p.rows[0]!.id]);
      await q.query("update public.products set name = 'Vestido Lia' where id = $1", [p.rows[0]!.id]);
    });
    const nomes = (await acoes(dono, orgId)).map((r) => r.action);
    expect(nomes).toEqual(expect.arrayContaining(["colecao_criada", "produto_criado", "produto_status"]));
    expect(nomes.filter((a) => a === "produto_status")).toHaveLength(1);
  });

  it("só dono e admin leem, e só da própria organização", async () => {
    const { dono, admin, modelista, fora, orgId } = await equipe();
    const sql = "select 1 from public.activity_log where org_id = $1";
    expect(await contar(db, dono, sql, [orgId])).toBeGreaterThan(0);
    expect(await contar(db, admin, sql, [orgId])).toBeGreaterThan(0);
    expect(await contar(db, modelista, sql, [orgId])).toBe(0);
    expect(await contar(db, fora, sql, [orgId])).toBe(0);
  });

  it("ninguém escreve direto na tabela", async () => {
    const { dono, orgId } = await equipe();
    await expect(
      as(db, dono, (q) => q.query("insert into public.activity_log (org_id, action) values ($1, 'molde_criado')", [orgId])),
    ).rejects.toThrow(/permission denied/);
    await expect(as(db, dono, (q) => q.query("delete from public.activity_log where org_id = $1", [orgId]))).rejects.toThrow(/permission denied/);
  });

  it("eventos de tela: lista fechada, só membros, com limite por minuto", async () => {
    const { dono, modelista, fora, orgId } = await equipe();
    await as(db, modelista, (q) => q.query("select public.log_event($1, 'prova_aberta')", [orgId]));
    await expect(as(db, modelista, (q) => q.query("select public.log_event($1, 'qualquer_coisa')", [orgId]))).rejects.toThrow(/Evento desconhecido/);
    await expect(as(db, fora, (q) => q.query("select public.log_event($1, 'prova_aberta')", [orgId]))).rejects.toThrow(/Sem permissão/);
    for (let i = 0; i < 40; i++) await as(db, modelista, (q) => q.query("select public.log_event($1, 'molde_exportado')", [orgId]));
    const n = (await acoes(dono, orgId)).filter((r) => r.user_id === modelista.id).length;
    expect(n).toBeLessThanOrEqual(30 + 1); // 30 por minuto (+ o membro_entrou dela)
  });

  it("primeiros passos marcam sozinhos pelo que a pessoa fez", async () => {
    const u = await createUser(db, `onb${++seq}@a.com`);
    const passo = () => as(db, u, (q) => q.query("select * from public.onboarding_progress()")).then((r) => r.rows[0]);
    expect(await passo()).toEqual({ has_profile: false, has_org: false, has_pattern: false, has_prova: false, has_approval: false, has_invite: false });
    await as(db, u, (q) => q.query("insert into public.profiles (first_name) values ('Rita')"));
    const { id: orgId } = await novaOrg(db, u);
    await as(db, u, (q) => q.query("insert into public.patterns (org_id, name) values ($1, 'Saia')", [orgId]));
    await as(db, u, (q) => q.query("select public.log_event($1, 'prova_aberta')", [orgId]));
    expect(await passo()).toMatchObject({ has_profile: true, has_org: true, has_pattern: true, has_prova: true, has_approval: false, has_invite: false });
  });

  it("apagar a organização não quebra no registro dos membros que saem", async () => {
    const { dono, orgId } = await equipe();
    await db.query("delete from public.orgs where id = $1", [orgId]);
    expect(await contar(db, dono, "select 1 from public.activity_log where org_id = $1", [orgId])).toBe(0);
  });
});
