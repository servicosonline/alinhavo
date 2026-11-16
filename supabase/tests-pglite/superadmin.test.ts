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
const email = (p: string) => `${p}${++seq}@sa.com`;

async function admin(role: "dono" | "suporte") {
  const u = await createUser(db, email(role));
  await db.query("insert into public.platform_admins (user_id, role) values ($1, $2)", [u.id, role]);
  return u;
}

async function cliente() {
  const dono = await createUser(db, email("cdono"));
  const mod = await createUser(db, email("cmod"));
  const est = await createUser(db, email("cest"));
  const { id: orgId } = await novaOrg(db, dono, "Confecção Cliente");
  await entrarComo(db, dono, orgId, mod, "modelista");
  await entrarComo(db, dono, orgId, est, "estilista");
  return { dono, mod, est, orgId };
}

const rpc = <T = Record<string, unknown>>(u: User | null, sql: string, params: unknown[] = []) =>
  as(db, u, (q) => q.query<T>(sql, params)).then((r) => r.rows);

describe("superadmin", () => {
  it("só admin vê os clientes; com plano, papéis e uso", async () => {
    const sup = await admin("suporte");
    const c = await cliente();
    const rows = await rpc<{ id: string; plan_id: string; status: string; full_seats: number; stylist_seats: number; actions_30d: number }>(
      sup,
      "select * from public.platform_clients()",
    );
    const mine = rows.find((r) => r.id === c.orgId)!;
    expect(mine).toMatchObject({ plan_id: "confeccao", status: "trial", full_seats: 2, stylist_seats: 1 });
    expect(mine.actions_30d).toBeGreaterThan(0);
    await expect(rpc(c.dono, "select * from public.platform_clients()")).rejects.toThrow(/superadmin/);
    await expect(rpc(null, "select * from public.platform_clients()")).rejects.toThrow(/permission denied|superadmin/);
  });

  it("ficha do cliente: equipe com e-mail, uso e convites", async () => {
    const sup = await admin("suporte");
    const c = await cliente();
    const [row] = await rpc<{ j: { members: { email: string; role: string }[]; usage: Record<string, number> } }>(
      sup,
      "select public.platform_client($1) as j",
      [c.orgId],
    );
    const j = row!.j;
    expect(j.members.map((m) => m.role)).toEqual(["owner", "modelista", "estilista"]);
    expect(j.members[0]!.email).toBe(c.dono.email);
    expect(j.usage.membro_entrou).toBe(3);
  });

  it("atendimento: convidar, mudar papel e tirar, tudo na auditoria", async () => {
    const sup = await admin("suporte");
    const c = await cliente();
    const t = (await rpc<{ t: string }>(sup, "select public.platform_create_invite($1, 'nova@x.com', 'leitura') as t", [c.orgId]))[0]!.t;
    expect(t).toMatch(/^[0-9a-f-]{36}$/);
    await rpc(sup, "select public.platform_set_member_role($1, $2, 'admin')", [c.orgId, c.mod.id]);
    await rpc(sup, "select public.platform_remove_member($1, $2)", [c.orgId, c.est.id]);
    const { rows: roles } = await db.query<{ user_id: string; role: string }>("select user_id, role from public.org_members where org_id = $1", [c.orgId]);
    expect(roles.find((r) => r.user_id === c.mod.id)!.role).toBe("admin");
    expect(roles.find((r) => r.user_id === c.est.id)).toBeUndefined();
    const audit = await rpc<{ action: string; admin_email: string }>(sup, "select * from public.platform_audit_list(20)");
    expect(audit.map((a) => a.action)).toEqual(expect.arrayContaining(["convite_criado", "papel_mudou", "membro_removido"]));
    expect(audit[0]!.admin_email).toBe(sup.email);
  });

  it("a organização nunca fica sem dono, nem pelo superadmin", async () => {
    const sup = await admin("suporte");
    const c = await cliente();
    await expect(rpc(sup, "select public.platform_remove_member($1, $2)", [c.orgId, c.dono.id])).rejects.toThrow(/pelo menos um owner/);
  });

  it("plano: só o dono da plataforma muda; estender teste, cortesia", async () => {
    const dono = await admin("dono");
    const sup = await admin("suporte");
    const c = await cliente();
    await expect(rpc(sup, "select public.platform_set_subscription($1, 'cortesia')", [c.orgId])).rejects.toThrow(/superadmin dono/);
    await rpc(dono, "select public.platform_set_subscription($1, 'trial', 30)", [c.orgId]);
    const days_left = (await rpc<{ days_left: number }>(c.dono, "select days_left from public.org_plan_status($1)", [c.orgId]))[0]!.days_left;
    expect(days_left).toBe(30);
    await expect(rpc(dono, "select public.platform_set_subscription($1, 'vencida')", [c.orgId])).rejects.toThrow(/calculada/);
  });

  it("ajudantes: só o dono adiciona e tira; nunca o último dono", async () => {
    const dono = await admin("dono");
    const sup = await admin("suporte");
    const nova = await createUser(db, email("ajudante"));
    await expect(rpc(sup, "select public.platform_add_admin($1, 'suporte')", [nova.email])).rejects.toThrow(/superadmin dono/);
    await rpc(dono, "select public.platform_add_admin($1, 'suporte')", [nova.email]);
    await expect(rpc(dono, "select public.platform_add_admin('ninguem@x.com', 'suporte')")).rejects.toThrow(/ainda não tem conta/);
    expect((await rpc<{ email: string }>(sup, "select * from public.platform_admins_list()")).map((a) => a.email)).toContain(nova.email);
    // Último dono não sai (pode haver donos de outros testes: tira todos menos um).
    const donos = (await rpc<{ user_id: string; role: string }>(dono, "select * from public.platform_admins_list()")).filter((a) => a.role === "dono");
    for (const d of donos.filter((x) => x.user_id !== dono.id)) await rpc(dono, "select public.platform_remove_admin($1)", [d.user_id]);
    await expect(rpc(dono, "select public.platform_remove_admin($1)", [dono.id])).rejects.toThrow(/pelo menos um dono/);
  });

  it("erros da tela: quem está logado registra (com limite); só o admin lê", async () => {
    const sup = await admin("suporte");
    const c = await cliente();
    for (let i = 0; i < 25; i++) await rpc(c.mod, "select public.log_client_error('/painel/x', 'Falhou', 'abc', $1)", [c.orgId]);
    await rpc(null, "select public.log_client_error('/x', 'anônimo')").catch(() => null);
    const errs = await rpc<{ org_id: string; user_email: string }>(sup, "select * from public.platform_errors($1, 100)", [c.orgId]);
    expect(errs.length).toBe(20);
    expect(errs[0]!.user_email).toBe(c.mod.email);
    await expect(rpc(c.dono, "select * from public.platform_errors(null, 10)")).rejects.toThrow(/superadmin/);
    await expect(as(db, c.dono, (q) => q.query("select * from public.app_errors"))).rejects.toThrow(/permission denied/);
  });

  it("meu papel: dono, suporte ou ninguém", async () => {
    const sup = await admin("suporte");
    const nada = await createUser(db, email("nada"));
    expect((await rpc<{ r: string | null }>(sup, "select public.my_platform_role() as r"))[0]!.r).toBe("suporte");
    expect((await rpc<{ r: string | null }>(nada, "select public.my_platform_role() as r"))[0]!.r).toBeNull();
  });
});
