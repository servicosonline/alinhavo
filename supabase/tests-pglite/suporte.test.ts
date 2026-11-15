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
const email = (p: string) => `${p}${++seq}@sp.com`;
const rpc = <T = Record<string, unknown>>(u: User | null, sql: string, params: unknown[] = []) =>
  as(db, u, (q) => q.query<T>(sql, params)).then((r) => r.rows);

async function setup() {
  const adm = await createUser(db, email("adm"));
  await db.query("insert into public.platform_admins (user_id, role) values ($1, 'suporte')", [adm.id]);
  const ana = await createUser(db, email("ana"));
  const bia = await createUser(db, email("bia"));
  const { id: orgId } = await novaOrg(db, ana, "Ateliê Ana");
  return { adm, ana, bia, orgId };
}

const abrir = (u: User, orgId: string | null = null) =>
  rpc<{ id: string }>(u, "select public.open_support_thread('Encaixe não salva', 'Clico em salvar e nada acontece.', $1) as id", [orgId]).then((r) => r[0]!.id);

describe("chat de suporte", () => {
  it("o cliente abre a conversa; os admins são avisados no sino", async () => {
    const s = await setup();
    const id = await abrir(s.ana, s.orgId);
    const [t] = await rpc<{ status: string; org_id: string }>(s.ana, "select status, org_id from public.support_threads where id = $1", [id]);
    expect(t).toEqual({ status: "aberta", org_id: s.orgId });
    const avisos = await rpc<{ title: string; link: string }>(s.adm, "select title, link from public.my_notifications(50)");
    expect(avisos.find((n) => n.link === `/painel/admin/suporte/${id}`)?.title).toBe("Nova conversa de suporte");
  });

  it("só quem pediu e o superadmin leem; outra pessoa não", async () => {
    const s = await setup();
    const id = await abrir(s.ana);
    const sql = "select 1 from public.support_messages where thread_id = $1";
    expect((await rpc(s.ana, sql, [id])).length).toBe(1);
    expect((await rpc(s.adm, sql, [id])).length).toBe(1);
    expect((await rpc(s.bia, sql, [id])).length).toBe(0);
    await expect(rpc(s.bia, "select public.send_support_message($1, 'intrusa')", [id])).rejects.toThrow(/não encontrada/);
  });

  it("resposta do suporte: vira respondida e avisa o cliente; o cliente responde e volta a aberta", async () => {
    const s = await setup();
    const id = await abrir(s.ana);
    await rpc(s.adm, "select public.send_support_message($1, 'Olá! Pode mandar o nome do produto?')", [id]);
    const status = async () => (await rpc<{ status: string }>(s.ana, "select status from public.support_threads where id = $1", [id]))[0]!.status;
    expect(await status()).toBe("respondida");
    const aviso = (await rpc<{ title: string; link: string }>(s.ana, "select title, link from public.my_notifications(50)")).find((n) => n.link === `/painel/suporte/${id}`);
    expect(aviso?.title).toBe("O suporte respondeu");
    await rpc(s.ana, "select public.send_support_message($1, 'É a calça pantalona.')", [id]);
    expect(await status()).toBe("aberta");
    const msgs = await rpc<{ from_admin: boolean }>(s.ana, "select from_admin from public.support_messages where thread_id = $1 order by created_at", [id]);
    expect(msgs.map((m) => m.from_admin)).toEqual([false, true, false]);
  });

  it("fechar; a caixa do admin lista com a organização e a última mensagem", async () => {
    const s = await setup();
    const id = await abrir(s.ana, s.orgId);
    const caixa = await rpc<{ id: string; org_name: string; last_body: string; messages: number }>(s.adm, "select * from public.platform_support_threads(null)");
    expect(caixa.find((c) => c.id === id)).toMatchObject({ org_name: "Ateliê Ana", last_body: "Clico em salvar e nada acontece.", messages: 1 });
    await rpc(s.ana, "select public.close_support_thread($1)", [id]);
    expect((await rpc<{ id: string }>(s.adm, "select id from public.platform_support_threads('fechada')")).map((r) => r.id)).toContain(id);
    await expect(rpc(s.ana, "select * from public.platform_support_threads(null)")).rejects.toThrow(/superadmin/);
  });

  it("organização de que a pessoa não é membro não entra; ninguém escreve direto; limite por hora", async () => {
    const s = await setup();
    const id = await abrir(s.bia, s.orgId); // a bia não é da org da Ana
    expect((await rpc<{ org_id: string | null }>(s.bia, "select org_id from public.support_threads where id = $1", [id]))[0]!.org_id).toBeNull();
    await expect(as(db, s.bia, (q) => q.query("insert into public.support_messages (thread_id, body) values ($1, 'x')", [id]))).rejects.toThrow(/permission denied/);
    for (let i = 0; i < 29; i++) await rpc(s.bia, "select public.send_support_message($1, $2)", [id, `msg ${i}`]);
    await expect(rpc(s.bia, "select public.send_support_message($1, 'demais')", [id])).rejects.toThrow(/Muitas mensagens/);
  });
});
