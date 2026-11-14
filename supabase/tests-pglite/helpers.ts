import type { PGlite } from "@electric-sql/pglite";
import { as, type User } from "./db";

export type Org = { id: string; name: string };
export type Invite = { id: string; token: string };

export async function novaOrg(db: PGlite, owner: User, name = "Confecção Teste"): Promise<Org> {
  return as(db, owner, async (q) => {
    const { rows } = await q.query<Org>("select id, name from public.create_org($1)", [name]);
    return rows[0]!;
  });
}

export async function convidar(db: PGlite, by: User, orgId: string, email: string, role = "modelista"): Promise<Invite> {
  return as(db, by, async (q) => {
    const { rows } = await q.query<Invite>(
      "insert into public.invites (org_id, email, role) values ($1, $2, $3) returning id, token",
      [orgId, email, role],
    );
    return rows[0]!;
  });
}

export async function aceitar(db: PGlite, user: User, token: string) {
  return as(db, user, (q) => q.query("select * from public.accept_invite($1)", [token]));
}

/** Convida e já aceita: atalho para montar uma equipe nos testes. */
export async function entrarComo(db: PGlite, dono: User, orgId: string, user: User, role: string) {
  await aceitar(db, user, (await convidar(db, dono, orgId, user.email, role)).token);
}

export async function contar(db: PGlite, user: User | null, sql: string, params: unknown[] = []): Promise<number> {
  return as(db, user, async (q) => (await q.query(sql, params)).rows.length);
}
