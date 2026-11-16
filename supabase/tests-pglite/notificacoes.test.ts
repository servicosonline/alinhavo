import type { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { as, createDb, createUser, type User } from "./db";
import { novaOrg } from "./helpers";

let db: PGlite;

beforeAll(async () => {
  db = await createDb();
}, 60_000);

afterAll(async () => {
  await db?.close();
});

let seq = 0;
const email = (p: string) => `${p}${++seq}@nt.com`;
const rpc = <T = Record<string, unknown>>(u: User | null, sql: string, params: unknown[] = []) =>
  as(db, u, (q) => q.query<T>(sql, params)).then((r) => r.rows);

async function admin() {
  const u = await createUser(db, email("adm"));
  await db.query("insert into public.platform_admins (user_id, role) values ($1, 'suporte')", [u.id]);
  return u;
}

async function setup() {
  const adm = await admin();
  const ana = await createUser(db, email("ana")); // org em teste (Confecção)
  const bia = await createUser(db, email("bia")); // org cortesia, plano Modelista
  const { id: orgA } = await novaOrg(db, ana, "Ateliê Ana");
  const { id: orgB } = await novaOrg(db, bia, "Ateliê Bia");
  await db.query("update public.org_subscriptions set status = 'cortesia', plan_id = 'modelista', trial_ends_at = null where org_id = $1", [orgB]);
  return { adm, ana, bia, orgA, orgB };
}

const titulos = async (u: User) => (await rpc<{ title: string }>(u, "select title from public.my_notifications(50)")).map((r) => r.title);

describe("notificações", () => {
  it("cada pessoa vê só as que são para ela: todos, plano, status, organização, pessoa", async () => {
    const s = await setup();
    const tag = `t${seq}`;
    await rpc(s.adm, "select public.platform_send_notification($1, 'oi', null, 'todos')", [`${tag}-todos`]);
    await rpc(s.adm, "select public.platform_send_notification($1, '', null, 'plano', 'modelista')", [`${tag}-modelista`]);
    await rpc(s.adm, "select public.platform_send_notification($1, '', null, 'status', 'trial')", [`${tag}-teste`]);
    await rpc(s.adm, "select public.platform_send_notification($1, '', null, 'org', $2)", [`${tag}-orgA`, s.orgA]);
    await rpc(s.adm, "select public.platform_send_notification($1, '', '/painel/conta', 'pessoa', $2)", [`${tag}-bia`, s.bia.email]);
    const ana = (await titulos(s.ana)).filter((t) => t.startsWith(tag));
    const bia = (await titulos(s.bia)).filter((t) => t.startsWith(tag));
    expect(ana.sort()).toEqual([`${tag}-orgA`, `${tag}-teste`, `${tag}-todos`]);
    expect(bia.sort()).toEqual([`${tag}-bia`, `${tag}-modelista`, `${tag}-todos`]);
  });

  it("a tabela também filtra pela RLS (o Realtime entrega só as visíveis)", async () => {
    const s = await setup();
    await rpc(s.adm, "select public.platform_send_notification('só da bia', '', null, 'pessoa', $1)", [s.bia.id]);
    const sql = "select 1 from public.notifications where title = 'só da bia' and audience_value = $1";
    expect((await rpc(s.ana, sql, [s.bia.id])).length).toBe(0);
    expect((await rpc(s.bia, sql, [s.bia.id])).length).toBe(1);
  });

  it("marcar como lida: uma ou todas; cada um só as suas", async () => {
    const s = await setup();
    const [{ id }] = (await rpc<{ id: string }>(s.adm, "select public.platform_send_notification('leia', '', null, 'org', $1) as id", [s.orgA])) as [{ id: string }];
    await rpc(s.ana, "select public.mark_notifications_read(array[$1]::uuid[])", [id]);
    const lida = (await rpc<{ id: string; read: boolean }>(s.ana, "select id, read from public.my_notifications(50)")).find((n) => n.id === id)!;
    expect(lida.read).toBe(true);
    // A bia não vê a notificação da org A; marcar não faz nada.
    await rpc(s.bia, "select public.mark_notifications_read(array[$1]::uuid[])", [id]);
    const [{ reads }] = (await rpc<{ reads: number }>(s.adm, "select reads from public.platform_notifications(50) where id = $1", [id])) as [{ reads: number }];
    expect(reads).toBe(1);
  });

  it("só o superadmin envia; valores errados são recusados", async () => {
    const s = await setup();
    await expect(rpc(s.ana, "select public.platform_send_notification('x', '', null, 'todos')")).rejects.toThrow(/superadmin/);
    await expect(rpc(s.adm, "select public.platform_send_notification('x', '', null, 'plano', 'ouro')")).rejects.toThrow(/Plano desconhecido/);
    await expect(rpc(s.adm, "select public.platform_send_notification('x', '', null, 'pessoa', 'ninguem@x.com')")).rejects.toThrow(/Nenhuma conta/);
    await expect(rpc(s.adm, "select public.platform_send_notification('x', '', null, 'org', 'abc')")).rejects.toThrow(/inválida/);
    await expect(rpc(s.adm, "select public.platform_send_notification('x', '', 'javascript:alert(1)', 'todos')")).rejects.toThrow(/check/);
    await expect(as(db, s.adm, (q) => q.query("insert into public.notifications (title, audience) values ('x', 'todos')"))).rejects.toThrow(/permission denied/);
  });
});

describe("novidades", () => {
  it("o superadmin publica; todo mundo logado lê as publicadas; rascunho só o admin vê", async () => {
    const s = await setup();
    const [{ id }] = (await rpc<{ id: string }>(
      s.adm,
      "select public.platform_save_announcement(null, 'Prova ao lado do molde', 'Agora dá para…', null, 'https://www.youtube.com/watch?v=abc', true) as id",
    )) as [{ id: string }];
    await rpc(s.adm, "select public.platform_save_announcement(null, 'Rascunho', '', null, null, false)");
    const ana = await rpc<{ title: string }>(s.ana, "select title from public.announcements where title in ('Prova ao lado do molde', 'Rascunho')");
    expect(ana.map((r) => r.title)).toEqual(["Prova ao lado do molde"]);
    expect((await rpc(s.adm, "select 1 from public.announcements where title = 'Rascunho'")).length).toBeGreaterThan(0);
    await expect(rpc(s.ana, "select public.platform_save_announcement(null, 'x', '', null, null, true)")).rejects.toThrow(/superadmin/);
    await expect(rpc(s.adm, "select public.platform_save_announcement(null, 'x', '', null, 'https://evil.com/v', true)")).rejects.toThrow(/check/);
    await rpc(s.adm, "select public.platform_delete_announcement($1)", [id]);
    expect((await rpc(s.ana, "select 1 from public.announcements where id = $1", [id])).length).toBe(0);
  });

  it("imagem das novidades: só o superadmin envia", async () => {
    const s = await setup();
    const enviar = (u: User) => as(db, u, (q) => q.query("insert into storage.objects (bucket_id, name, metadata) values ('novidades', $1, '{}')", [`n${seq}.webp`]));
    await expect(enviar(s.ana)).rejects.toThrow(/row-level security/);
    await enviar(s.adm);
  });
});
