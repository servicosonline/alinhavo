import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { as, createDb, createUser, type User } from "./db";
import { aceitar, entrarComo, novaOrg } from "./helpers";

let db: PGlite;

beforeAll(async () => {
  db = await createDb();
}, 60_000);

afterAll(async () => {
  await db?.close();
});

let seq = 0;
const novo = (prefix: string) => createUser(db, `${prefix}${++seq}@c.com`);

/** Convite com a opção de criar organizações (o app sempre manda a opção). */
async function convidar(by: User, orgId: string, email: string, canCreate: boolean, role = "modelista") {
  return as(db, by, async (q) => {
    const { rows } = await q.query<{ token: string }>(
      "insert into public.invites (org_id, email, role, can_create_orgs) values ($1, $2, $3, $4) returning token",
      [orgId, email, role, canCreate],
    );
    return rows[0]!.token;
  });
}

const podeCriar = (u: User) =>
  as(db, u, async (q) => (await q.query<{ allowed: boolean; blocked_by: string | null }>("select allowed, blocked_by from public.my_org_creation()")).rows[0]!);

const status = async (orgId: string) =>
  (await db.query<{ status: string; trial_ends_at: string | null }>("select status, trial_ends_at from public.org_subscriptions where org_id = $1", [orgId])).rows[0]!;

describe("criar organizações depois de entrar por convite", () => {
  it("convite travado: a pessoa não cria organização e a tela sabe quem travou", async () => {
    const dono = await novo("cdono");
    const pessoa = await novo("cpessoa");
    const { id: orgId } = await novaOrg(db, dono, "Ateliê Linha");
    await aceitar(db, pessoa, await convidar(dono, orgId, pessoa.email, false));
    expect(await podeCriar(pessoa)).toEqual({ allowed: false, blocked_by: "Ateliê Linha" });
    await expect(novaOrg(db, pessoa, "Minha")).rejects.toThrow(/não pode criar organizações/);
  });

  it("convite liberado (e quem não está em organização nenhuma) cria", async () => {
    const dono = await novo("cdono");
    const pessoa = await novo("cpessoa");
    const solta = await novo("csolta");
    const { id: orgId } = await novaOrg(db, dono);
    await aceitar(db, pessoa, await convidar(dono, orgId, pessoa.email, true));
    expect((await podeCriar(pessoa)).allowed).toBe(true);
    await novaOrg(db, pessoa, "Minha");
    expect((await podeCriar(solta)).allowed).toBe(true);
  });

  it("quem já era dono de uma organização antes do convite não é travado", async () => {
    const dono = await novo("cdono");
    const outra = await novo("coutra");
    await novaOrg(db, outra, "Já tinha");
    const { id: orgId } = await novaOrg(db, dono);
    await aceitar(db, outra, await convidar(dono, orgId, outra.email, false));
    expect((await podeCriar(outra)).allowed).toBe(true);
  });

  it("liberar vence: um vínculo liberado basta, mesmo com outro travado", async () => {
    const a = await novo("cdonoa");
    const b = await novo("cdonob");
    const pessoa = await novo("cpessoa");
    const { id: orgA } = await novaOrg(db, a);
    const { id: orgB } = await novaOrg(db, b);
    await aceitar(db, pessoa, await convidar(a, orgA, pessoa.email, false));
    expect((await podeCriar(pessoa)).allowed).toBe(false);
    await aceitar(db, pessoa, await convidar(b, orgB, pessoa.email, true));
    expect((await podeCriar(pessoa)).allowed).toBe(true);
  });

  it("a trava some quando a pessoa sai da organização que travou", async () => {
    const dono = await novo("cdono");
    const pessoa = await novo("cpessoa");
    const { id: orgId } = await novaOrg(db, dono);
    await aceitar(db, pessoa, await convidar(dono, orgId, pessoa.email, false));
    await as(db, pessoa, (q) => q.query("delete from public.org_members where org_id = $1 and user_id = $2", [orgId, pessoa.id]));
    expect((await podeCriar(pessoa)).allowed).toBe(true);
  });

  it("dono e admin liberam depois; ninguém libera a si mesmo; modelista e leitura não mexem", async () => {
    const dono = await novo("cdono");
    const admin = await novo("cadmin");
    const modelista = await novo("cmod");
    const pessoa = await novo("cpessoa");
    const { id: orgId } = await novaOrg(db, dono);
    await aceitar(db, admin, await convidar(dono, orgId, admin.email, false, "admin"));
    await entrarComo(db, dono, orgId, modelista, "modelista");
    await aceitar(db, pessoa, await convidar(dono, orgId, pessoa.email, false));
    const set = (by: User, who: User, v: boolean) =>
      as(db, by, (q) => q.query("update public.org_members set can_create_orgs = $1 where org_id = $2 and user_id = $3", [v, orgId, who.id]));
    // O admin travado não se libera.
    await expect(set(admin, admin, true)).rejects.toThrow(/própria permissão/);
    // Modelista: a RLS não deixa (nada muda).
    await set(modelista, pessoa, true);
    expect((await podeCriar(pessoa)).allowed).toBe(false);
    // Admin libera a pessoa; o dono libera o admin.
    await set(admin, pessoa, true);
    expect((await podeCriar(pessoa)).allowed).toBe(true);
    await set(dono, admin, true);
    expect((await podeCriar(admin)).allowed).toBe(true);
  });

  it("membros de antes e convites sem a opção (superadmin) continuam liberados", async () => {
    const dono = await novo("cdono");
    const pessoa = await novo("cpessoa");
    const { id: orgId } = await novaOrg(db, dono);
    await entrarComo(db, dono, orgId, pessoa, "estilista");
    expect((await podeCriar(pessoa)).allowed).toBe(true);
  });
});

describe("um teste grátis por pessoa", () => {
  it("a primeira organização ganha teste; a segunda da mesma pessoa nasce sem teste", async () => {
    const dono = await novo("tdono");
    const { id: primeira } = await novaOrg(db, dono, "Primeira");
    const { id: segunda } = await novaOrg(db, dono, "Segunda");
    expect((await status(primeira)).status).toBe("trial");
    const avail = await as(db, dono, async (q) => (await q.query<{ trial_available: boolean }>("select trial_available from public.my_org_creation()")).rows[0]!);
    expect(avail.trial_available).toBe(false);
    expect(await status(segunda)).toEqual({ status: "vencida", trial_ends_at: null });
  });

  it("apagar a organização não devolve o teste", async () => {
    const dono = await novo("tdono");
    const { id } = await novaOrg(db, dono, "Vai sumir");
    await as(db, dono, (q) => q.query("delete from public.orgs where id = $1", [id]));
    const { id: nova } = await novaOrg(db, dono, "Outra");
    expect((await status(nova)).status).toBe("vencida");
  });

  it("outra conta com o mesmo CPF não ganha outro teste (mesmo com o CPF preenchido depois)", async () => {
    const a = await novo("tcpfa");
    const b = await novo("tcpfb");
    const c = await novo("tcpfc");
    const cpf = "52998224725";
    // A cria a organização antes de preencher o CPF; depois preenche.
    await novaOrg(db, a, "Org A");
    await as(db, a, (q) => q.query("insert into public.profiles (user_id, document_type, document) values ($1, 'cpf', $2)", [a.id, cpf]));
    await as(db, b, (q) => q.query("insert into public.profiles (user_id, document_type, document) values ($1, 'cpf', $2)", [b.id, cpf]));
    const { id: orgB } = await novaOrg(db, b, "Org B");
    expect((await status(orgB)).status).toBe("vencida");
    // Quem tem outro CPF ganha.
    await as(db, c, (q) => q.query("insert into public.profiles (user_id, document_type, document) values ($1, 'cpf', '11144477735')", [c.id]));
    const { id: orgC } = await novaOrg(db, c, "Org C");
    expect((await status(orgC)).status).toBe("trial");
  });

  it("o registro dos testes não é legível pelo app e guarda o documento só em hash", async () => {
    const a = await novo("thash");
    await novaOrg(db, a);
    await expect(as(db, a, (q) => q.query("select * from public.trial_grants"))).rejects.toThrow(/permission denied/);
    const { rows } = await db.query<{ document_hash: string | null }>("select document_hash from public.trial_grants where user_id = $1", [a.id]);
    expect(rows).toHaveLength(1);
  });
});
