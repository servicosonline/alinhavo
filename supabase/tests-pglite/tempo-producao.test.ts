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

type Row = {
  stage: string;
  done_count: number;
  done_avg_seconds: number | null;
  done_median_seconds: number | null;
  current_count: number;
  current_avg_seconds: number | null;
};

let seq = 0;
async function equipe() {
  const n = ++seq;
  const dono = await createUser(db, `dono-tp${n}@m.com`);
  const admin = await createUser(db, `admin-tp${n}@m.com`);
  const modelista = await createUser(db, `modelista-tp${n}@m.com`);
  const fora = await createUser(db, `fora-tp${n}@m.com`);
  const { id: orgId } = await novaOrg(db, dono);
  await entrarComo(db, dono, orgId, admin, "admin");
  await entrarComo(db, dono, orgId, modelista, "modelista");
  return { orgId, dono, admin, modelista, fora };
}

async function novoProduto(user: User, orgId: string, name: string) {
  return as(db, user, async (q) => {
    const { rows } = await q.query<{ id: string }>("insert into public.products (org_id, name) values ($1, $2) returning id", [orgId, name]);
    return rows[0]!.id;
  });
}

async function mudar(user: User, id: string, status: string) {
  await as(db, user, (q) => q.query("update public.products set status = $2 where id = $1", [id, status]));
}

/** Põe as entradas do produto em dias fixos atrás (como superusuário: o app não escreve eventos). */
async function datar(productId: string, daysAgo: number[]) {
  const { rows } = await db.query<{ id: number }>("select id from public.product_status_events where product_id = $1 order by id", [productId]);
  for (const [i, ev] of rows.entries()) {
    await db.query("update public.product_status_events set entered_at = now() - make_interval(days => $2) where id = $1", [ev.id, daysAgo[i]]);
  }
}

async function tempos(user: User, orgId: string | null): Promise<Record<string, Row>> {
  return as(db, user, async (q) => {
    const { rows } = await q.query<Row>("select * from public.production_stage_times($1)", [orgId]);
    return Object.fromEntries(rows.map((r) => [r.stage, r]));
  });
}

const DIA = 86_400;

describe("tempo de produção", () => {
  it("cada troca de status vira um evento; ninguém escreve eventos pelo app", async () => {
    const e = await equipe();
    const p = await novoProduto(e.modelista, e.orgId, "Saia");
    await mudar(e.modelista, p, "modelagem");
    await mudar(e.modelista, p, "modelagem"); // sem troca, sem evento
    await as(db, e.modelista, (q) => q.query("update public.products set name = 'Saia 2' where id = $1", [p]));
    const { rows } = await db.query<{ status: string }>("select status from public.product_status_events where product_id = $1 order by id", [p]);
    expect(rows.map((r) => r.status)).toEqual(["ideia", "modelagem"]);

    expect(await contar(db, e.modelista, "select 1 from public.product_status_events where product_id = $1", [p])).toBe(2);
    expect(await contar(db, e.fora, "select 1 from public.product_status_events where product_id = $1", [p])).toBe(0);
    await expect(
      as(db, e.dono, (q) =>
        q.query("insert into public.product_status_events (org_id, product_id, status) values ($1, $2, 'prova')", [e.orgId, p]),
      ),
    ).rejects.toThrow(/permission denied/);
    await expect(
      as(db, e.dono, (q) => q.query("update public.product_status_events set entered_at = now() where product_id = $1", [p])),
    ).rejects.toThrow(/permission denied/);
  });

  it("média e mediana por estágio, parados agora e o total da ideia à produção", async () => {
    const e = await equipe();
    // A: ideia 10 d atrás → modelagem 8 → prova 5 → aprovado 4 → produção 1.
    const a = await novoProduto(e.modelista, e.orgId, "A");
    for (const s of ["modelagem", "prova", "aprovado", "producao"]) await mudar(e.modelista, a, s);
    await datar(a, [10, 8, 5, 4, 1]);
    // B: ideia 6 d atrás → modelagem 2 (está em modelagem há 2 dias).
    const b = await novoProduto(e.modelista, e.orgId, "B");
    await mudar(e.modelista, b, "modelagem");
    await datar(b, [6, 2]);

    const t = await tempos(e.dono, e.orgId);
    expect(Object.keys(t).sort()).toEqual(["aprovado", "ideia", "modelagem", "producao", "prova", "total"]);
    // Ideia: A ficou 2 dias, B 4 dias.
    expect(t.ideia!.done_count).toBe(2);
    expect(t.ideia!.done_avg_seconds! / DIA).toBeCloseTo(3, 3);
    expect(t.ideia!.done_median_seconds! / DIA).toBeCloseTo(3, 3);
    // Modelagem: A 3 dias (encerrada); B parado há 2 dias.
    expect(t.modelagem!.done_count).toBe(1);
    expect(t.modelagem!.done_avg_seconds! / DIA).toBeCloseTo(3, 3);
    expect(t.modelagem!.current_count).toBe(1);
    expect(t.modelagem!.current_avg_seconds! / DIA).toBeCloseTo(2, 2);
    expect(t.prova!.done_avg_seconds! / DIA).toBeCloseTo(1, 3);
    expect(t.producao!.done_count).toBe(0);
    expect(t.producao!.current_count).toBe(1);
    // Total: A levou 9 dias da ideia à produção; B está a caminho há 6.
    expect(t.total!.done_count).toBe(1);
    expect(t.total!.done_avg_seconds! / DIA).toBeCloseTo(9, 3);
    expect(t.total!.current_count).toBe(1);
    expect(t.total!.current_avg_seconds! / DIA).toBeCloseTo(6, 2);
  });

  it("produto que já existia (evento da migração) não entra nas contas até trocar de novo", async () => {
    const e = await equipe();
    const p = await novoProduto(e.modelista, e.orgId, "Antigo");
    await db.query("update public.product_status_events set backfilled = true, entered_at = now() - interval '30 days' where product_id = $1", [p]);
    await mudar(e.modelista, p, "modelagem");
    await datar(p, [30, 3]);
    const t = await tempos(e.dono, e.orgId);
    expect(t.ideia!.done_count).toBe(0);
    expect(t.modelagem!.current_count).toBe(1);
    expect(t.total!.done_count + t.total!.current_count).toBe(0);
  });

  it("só o dono vê a da organização; o superadmin vê qualquer uma e todas juntas", async () => {
    const e = await equipe();
    const outra = await equipe();
    await novoProduto(e.modelista, e.orgId, "X");
    await novoProduto(outra.modelista, outra.orgId, "Y");

    for (const u of [e.admin, e.modelista, e.fora, outra.dono]) {
      await expect(tempos(u, e.orgId)).rejects.toThrow(/dono da organização/);
    }
    await expect(tempos(e.dono, null)).rejects.toThrow(/dono da organização/);
    await expect(as(db, null, (q) => q.query("select * from public.production_stage_times($1)", [e.orgId]))).rejects.toThrow(
      /permission denied/,
    );

    const chefe = await createUser(db, "superadmin-tp@m.com");
    expect(await as(db, chefe, async (q) => (await q.query<{ ok: boolean }>("select public.am_platform_admin() as ok")).rows[0]!.ok)).toBe(false);
    await expect(as(db, chefe, (q) => q.query("select * from public.platform_orgs()"))).rejects.toThrow(/superadmin/);
    await db.query("insert into public.platform_admins (user_id) values ($1)", [chefe.id]);
    expect(await as(db, chefe, async (q) => (await q.query<{ ok: boolean }>("select public.am_platform_admin() as ok")).rows[0]!.ok)).toBe(true);

    expect((await tempos(chefe, e.orgId)).ideia!.current_count).toBe(1);
    expect((await tempos(chefe, null)).ideia!.current_count).toBeGreaterThanOrEqual(2);
    const orgs = await as(db, chefe, async (q) => (await q.query<{ id: string; members: number; products: number }>("select * from public.platform_orgs()")).rows);
    const minha = orgs.find((o) => o.id === e.orgId)!;
    expect(minha.members).toBe(3);
    expect(minha.products).toBe(1);

    // Ninguém se faz superadmin pelo app.
    await expect(as(db, e.dono, (q) => q.query("insert into public.platform_admins (user_id) values ($1)", [e.dono.id]))).rejects.toThrow(
      /permission denied/,
    );
    // Nem lê a lista (nem o próprio superadmin, pelo app).
    await expect(contar(db, chefe, "select 1 from public.platform_admins")).rejects.toThrow(/permission denied/);
  });
});
