import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { as, createDb, createUser, type User } from "./db";
import * as h from "./helpers";

let db: PGlite;

beforeAll(async () => {
  db = await createDb();
}, 60_000);

afterAll(async () => {
  await db?.close();
});

type Invite = h.Invite;
const novaOrg = (owner: User, name?: string) => h.novaOrg(db, owner, name);
const convidar = (by: User, orgId: string, email: string, role?: string) => h.convidar(db, by, orgId, email, role);
const aceitar = (user: User, token: string) => h.aceitar(db, user, token);
const contar = (user: User | null, sql: string, params?: unknown[]) => h.contar(db, user, sql, params);

describe("isolamento entre organizações", () => {
  it("cada usuário só vê a própria organização e a própria equipe", async () => {
    const ana = await createUser(db, "ana@a.com");
    const bia = await createUser(db, "bia@b.com");
    const orgA = await novaOrg(ana, "Ateliê A");
    const orgB = await novaOrg(bia, "Ateliê B");

    expect(await contar(ana, "select 1 from public.orgs where id = $1", [orgA.id])).toBe(1);
    expect(await contar(ana, "select 1 from public.orgs where id = $1", [orgB.id])).toBe(0);
    expect(await contar(bia, "select 1 from public.org_members where org_id = $1", [orgA.id])).toBe(0);
    expect(await contar(bia, "select 1 from public.org_members where org_id = $1", [orgB.id])).toBe(1);
  });

  it("quem cria a organização vira owner", async () => {
    const caio = await createUser(db, "caio@c.com");
    const org = await novaOrg(caio);
    const role = await as(db, caio, async (q) => {
      const { rows } = await q.query<{ role: string }>(
        "select role from public.org_members where org_id = $1 and user_id = $2",
        [org.id, caio.id],
      );
      return rows[0]?.role;
    });
    expect(role).toBe("owner");
  });

  it("não deixa entrar numa organização alheia inserindo em org_members", async () => {
    const dono = await createUser(db, "dono@d.com");
    const intruso = await createUser(db, "intruso@x.com");
    const org = await novaOrg(dono);

    await expect(
      as(db, intruso, (q) =>
        q.query("insert into public.org_members (org_id, user_id, role) values ($1, $2, 'owner')", [
          org.id,
          intruso.id,
        ]),
      ),
    ).rejects.toThrow(/permission denied/);
    expect(await contar(intruso, "select 1 from public.orgs where id = $1", [org.id])).toBe(0);
  });

  it("não deixa criar organização direto na tabela", async () => {
    const eva = await createUser(db, "eva@e.com");
    await expect(
      as(db, eva, (q) => q.query("insert into public.orgs (name) values ('Direto')")),
    ).rejects.toThrow(/permission denied/);
  });

  it("não deixa editar nem apagar organização alheia", async () => {
    const dono = await createUser(db, "dono2@d.com");
    const outro = await createUser(db, "outro@o.com");
    const org = await novaOrg(dono, "Original");

    await as(db, outro, async (q) => {
      const up = await q.query("update public.orgs set name = 'Invadida' where id = $1", [org.id]);
      const del = await q.query("delete from public.orgs where id = $1", [org.id]);
      expect(up.affectedRows).toBe(0);
      expect(del.affectedRows).toBe(0);
    });
    const nome = await as(db, dono, async (q) => {
      const { rows } = await q.query<{ name: string }>("select name from public.orgs where id = $1", [org.id]);
      return rows[0]?.name;
    });
    expect(nome).toBe("Original");
  });

  it("cliente não muda o plano da organização", async () => {
    const dono = await createUser(db, "plano@p.com");
    const org = await novaOrg(dono);
    await expect(
      as(db, dono, (q) => q.query("update public.orgs set plan = 'pro' where id = $1", [org.id])),
    ).rejects.toThrow(/permission denied/);
  });

  it("visitante sem login não vê nada nem cria organização", async () => {
    const dono = await createUser(db, "visivel@v.com");
    await novaOrg(dono);
    expect(await contar(null, "select 1 from public.orgs")).toBe(0);
    expect(await contar(null, "select 1 from public.org_members")).toBe(0);
    expect(await contar(null, "select 1 from public.invites")).toBe(0);
    await expect(as(db, null, (q) => q.query("select public.create_org('Anônima')"))).rejects.toThrow(
      /permission denied/,
    );
  });
});

describe("convites", () => {
  it("owner convida e o convidado entra com o papel do convite", async () => {
    const dono = await createUser(db, "dona@conv.com");
    const nova = await createUser(db, "modelista@conv.com");
    const org = await novaOrg(dono);
    const convite = await convidar(dono, org.id, "modelista@conv.com", "modelista");

    expect(await contar(nova, "select 1 from public.orgs where id = $1", [org.id])).toBe(0);
    const { rows } = await aceitar(nova, convite.token);
    expect(rows[0]).toMatchObject({ org_id: org.id, user_id: nova.id, role: "modelista" });
    expect(await contar(nova, "select 1 from public.orgs where id = $1", [org.id])).toBe(1);
  });

  it("recusa convite de outro e-mail, já usado, expirado ou inexistente", async () => {
    const dono = await createUser(db, "dono@rec.com");
    const certo = await createUser(db, "certo@rec.com");
    const errado = await createUser(db, "errado@rec.com");
    const org = await novaOrg(dono);

    const convite = await convidar(dono, org.id, "certo@rec.com");
    await expect(aceitar(errado, convite.token)).rejects.toThrow(/Convite inválido/);
    await aceitar(certo, convite.token);
    await expect(aceitar(certo, convite.token)).rejects.toThrow(/Convite já usado/);

    const vencido = await as(db, dono, async (q) => {
      const { rows } = await q.query<Invite>(
        "insert into public.invites (org_id, email, role, expires_at) values ($1, 'errado@rec.com', 'leitura', now() - interval '1 day') returning token",
        [org.id],
      );
      return rows[0]!;
    });
    await expect(aceitar(errado, vencido.token)).rejects.toThrow(/Convite expirado/);
    await expect(aceitar(errado, "00000000-0000-4000-8000-000000000000")).rejects.toThrow(/Convite inválido/);
  });

  it("não aceita convite para owner nem validade acima de 30 dias", async () => {
    const dono = await createUser(db, "dono@lim.com");
    const org = await novaOrg(dono);
    await expect(convidar(dono, org.id, "x@lim.com", "owner")).rejects.toThrow(/check/);
    await expect(
      as(db, dono, (q) =>
        q.query(
          "insert into public.invites (org_id, email, role, expires_at) values ($1, 'y@lim.com', 'leitura', now() + interval '60 days')",
          [org.id],
        ),
      ),
    ).rejects.toThrow(/check/);
  });

  it("membro comum não convida, não vê convites e não muda papéis", async () => {
    const dono = await createUser(db, "dono@com.com");
    const mod = await createUser(db, "mod@com.com");
    const org = await novaOrg(dono);
    await aceitar(mod, (await convidar(dono, org.id, "mod@com.com", "modelista")).token);

    await expect(convidar(mod, org.id, "amigo@com.com")).rejects.toThrow(/row-level security/);
    expect(await contar(mod, "select 1 from public.invites where org_id = $1", [org.id])).toBe(0);
    const up = await as(db, mod, (q) =>
      q.query("update public.org_members set role = 'owner' where org_id = $1 and user_id = $2", [org.id, mod.id]),
    );
    expect(up.affectedRows).toBe(0);
  });

  it("admin gerencia a equipe mas não cria owner nem mexe no owner", async () => {
    const dono = await createUser(db, "dono@adm.com");
    const adm = await createUser(db, "adm@adm.com");
    const est = await createUser(db, "est@adm.com");
    const org = await novaOrg(dono);
    await aceitar(adm, (await convidar(dono, org.id, "adm@adm.com", "admin")).token);
    await aceitar(est, (await convidar(adm, org.id, "est@adm.com", "estilista")).token);

    await as(db, adm, async (q) => {
      const ok = await q.query(
        "update public.org_members set role = 'leitura' where org_id = $1 and user_id = $2",
        [org.id, est.id],
      );
      expect(ok.affectedRows).toBe(1);
      const rebaixarDono = await q.query(
        "update public.org_members set role = 'leitura' where org_id = $1 and user_id = $2",
        [org.id, dono.id],
      );
      expect(rebaixarDono.affectedRows).toBe(0);
    });
    await expect(
      as(db, adm, (q) =>
        q.query("update public.org_members set role = 'owner' where org_id = $1 and user_id = $2", [org.id, est.id]),
      ),
    ).rejects.toThrow(/row-level security/);
  });
});

describe("lista da equipe (org_team)", () => {
  it("membro vê e-mail e papel de toda a equipe", async () => {
    const dono = await createUser(db, "dono@time.com");
    const mod = await createUser(db, "mod@time.com");
    const org = await novaOrg(dono);
    await aceitar(mod, (await convidar(dono, org.id, "mod@time.com", "modelista")).token);

    const equipe = await as(db, mod, async (q) =>
      (await q.query<{ email: string; role: string }>("select email, role from public.org_team($1)", [org.id])).rows,
    );
    expect(equipe).toEqual([
      { email: "dono@time.com", role: "owner" },
      { email: "mod@time.com", role: "modelista" },
    ]);
  });

  it("quem é de fora não vê a equipe, e visitante nem consegue chamar", async () => {
    const dono = await createUser(db, "dono@fora.com");
    const fora = await createUser(db, "fora@fora.com");
    const org = await novaOrg(dono);
    expect(await contar(fora, "select * from public.org_team($1)", [org.id])).toBe(0);
    await expect(
      as(db, null, (q) => q.query("select * from public.org_team($1)", [org.id])),
    ).rejects.toThrow(/permission denied/);
  });
});

describe("owner", () => {
  it("a organização nunca fica sem owner", async () => {
    const dono = await createUser(db, "unico@own.com");
    const org = await novaOrg(dono);
    await expect(
      as(db, dono, (q) =>
        q.query("delete from public.org_members where org_id = $1 and user_id = $2", [org.id, dono.id]),
      ),
    ).rejects.toThrow(/pelo menos um owner/);
    await expect(
      as(db, dono, (q) =>
        q.query("update public.org_members set role = 'admin' where org_id = $1 and user_id = $2", [org.id, dono.id]),
      ),
    ).rejects.toThrow(/pelo menos um owner/);
  });

  it("apagar a organização leva junto membros e convites", async () => {
    const dono = await createUser(db, "apaga@own.com");
    const org = await novaOrg(dono);
    await convidar(dono, org.id, "alguem@own.com");
    await as(db, dono, (q) => q.query("delete from public.orgs where id = $1", [org.id]));

    const { rows } = await db.query<{ n: number }>(
      "select (select count(*) from public.org_members where org_id = $1)::int + (select count(*) from public.invites where org_id = $1)::int as n",
      [org.id],
    );
    expect(rows[0]?.n).toBe(0);
  });
});

describe("invariantes do esquema", () => {
  it("toda tabela do schema public tem RLS ativa", async () => {
    const { rows } = await db.query<{ tablename: string }>(
      "select tablename from pg_tables where schemaname = 'public' and not rowsecurity",
    );
    expect(rows.map((r) => r.tablename)).toEqual([]);
  });

  // Exceções: `orgs` (é a própria organização) e `profiles` (dado da pessoa, não da organização;
  // isolamento por user_id, ainda mais restrito: só a própria pessoa lê; ver o teste abaixo).
  it("toda tabela de negócio tem org_id", async () => {
    const { rows } = await db.query<{ tablename: string }>(`
      select t.tablename from pg_tables t
      -- orgs é a própria organização; profiles é da pessoa; platform_admins é da plataforma (superadmin), sem acesso pelo app;
      -- notifications, notification_reads e announcements são da plataforma: o público é decidido pela RLS (notification_visible, lidas por user_id).
      where t.schemaname = 'public' and t.tablename not in ('orgs', 'profiles', 'platform_admins', 'notifications', 'notification_reads', 'announcements')
        and not exists (
          select 1 from information_schema.columns c
          where c.table_schema = 'public' and c.table_name = t.tablename and c.column_name = 'org_id'
        )
    `);
    expect(rows.map((r) => r.tablename)).toEqual([]);
  });

  it("profiles, a exceção, é da pessoa: user_id é a chave e as políticas só olham auth.uid()", async () => {
    const { rows: pk } = await db.query<{ column_name: string }>(`
      select k.column_name from information_schema.table_constraints c
      join information_schema.key_column_usage k on k.constraint_name = c.constraint_name and k.table_name = c.table_name
      where c.table_schema = 'public' and c.table_name = 'profiles' and c.constraint_type = 'PRIMARY KEY'
    `);
    expect(pk.map((r) => r.column_name)).toEqual(["user_id"]);
    const { rows: pol } = await db.query<{ qual: string | null; with_check: string | null }>(
      "select qual, with_check from pg_policies where schemaname = 'public' and tablename = 'profiles'",
    );
    expect(pol.length).toBeGreaterThan(0);
    for (const p of pol) for (const expr of [p.qual, p.with_check]) if (expr) expect(expr).toMatch(/user_id = auth\.uid\(\)/);
  });
});
